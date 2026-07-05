# TestForge 系統架構文件

> 📅 最後更新：2026-07-05

---

## 1. 系統架構總覽

```mermaid
graph TB
    subgraph "使用者介面"
        CLI["CLI<br/>node testforge.js"]
        GHA["GitHub Action<br/>uses: JeffLin0225/testforge@v1"]
        SCRIPT["Shell Script<br/>scripts/run-testforge.sh"]
    end

    subgraph "核心引擎"
        SCANNER["📂 檔案掃描器<br/>scanDirectory()"]
        AST["🌳 AST 分析器<br/>analyzeFile()"]
        VUE_ANALYZER["🟩 Vue 元件分析器<br/>analyzeVueComponent()"]
        GENERATOR["🧪 測試產生器<br/>generateVitest()"]
        VUE_GEN["🟩 Vue 測試產生器<br/>generateVueComponentTest()"]
    end

    subgraph "報告系統"
        REPORT["📊 報告產生器<br/>generate-report.js"]
        BRANCH["📤 分支推送<br/>push-to-branch.sh"]
        PR_COMMENT["💬 PR Comment"]
    end

    subgraph "輸出"
        TESTS["__generated_tests__/<br/>*.test.ts"]
        MD_REPORT["TestForge-Report.md"]
        REPORT_BRANCH["testforge/reports 分支"]
    end

    CLI --> SCANNER
    GHA --> SCRIPT
    SCRIPT --> SCANNER

    SCANNER --> AST
    SCANNER --> VUE_ANALYZER
    AST --> GENERATOR
    VUE_ANALYZER --> VUE_GEN
    GENERATOR --> TESTS
    VUE_GEN --> TESTS

    TESTS -->|vitest 執行| REPORT
    REPORT --> MD_REPORT
    REPORT --> BRANCH
    REPORT --> PR_COMMENT
    BRANCH --> REPORT_BRANCH
```

---

## 2. 模組詳細說明

### 2.1 檔案掃描器 (`scanDirectory`)

```mermaid
graph LR
    INPUT["專案根目錄"] --> WALK["遞迴走訪"]
    WALK -->|跳過| IGNORE["node_modules<br/>dist<br/>.git<br/>coverage"]
    WALK -->|匹配| FILTER["副檔名過濾<br/>.js .ts .vue .jsx .tsx"]
    FILTER --> OUTPUT["檔案路徑列表<br/>（排序後）"]
```

- **輸入**：專案根目錄路徑
- **輸出**：排序後的檔案路徑陣列
- **忽略清單**：`node_modules`, `dist`, `.git`, `.nuxt`, `.next`, `coverage`, `__tests__`, `__generated_tests__`

### 2.2 AST 分析器 (`analyzeFile`)

```mermaid
graph TB
    FILE["原始檔案"] --> CHECK{".vue 檔？"}
    CHECK -->|是| EXTRACT["提取 script 區塊"]
    CHECK -->|否| PARSE["直接解析"]
    EXTRACT --> PARSE

    PARSE --> BABEL["Babel Parser<br/>(TypeScript + JSX)"]
    BABEL --> AST["AST 語法樹"]

    AST --> TRAVERSE["遍歷頂層節點"]
    TRAVERSE --> EXPORT["尋找 Export 宣告"]

    EXPORT --> NAMED["ExportNamedDeclaration"]
    EXPORT --> DEFAULT["ExportDefaultDeclaration"]

    NAMED --> FUNC_INFO["提取函數資訊"]
    DEFAULT --> FUNC_INFO

    FUNC_INFO --> RESULT["{ name, params, isAsync,<br/>returnType, comment }"]
```

**支援的 export 模式**：
```javascript
// 1. 命名匯出函數宣告
export function foo(a: number): string { ... }

// 2. 命名匯出箭頭函數
export const bar = (a, b) => { ... }

// 3. 命名匯出函數表達式
export const baz = function(x) { ... }

// 4. 預設匯出
export default function() { ... }
```

**參數解析支援**：
```javascript
// 一般參數
function(a: number) {}

// 有預設值
function(a = 5) {}

// 解構參數
function({ a, b }: Options) {}

// 陣列解構
function([a, b]) {}

// Rest 參數
function(...args) {}
```

### 2.3 Vue 元件分析器 (`analyzeVueComponent`)

```mermaid
graph TB
    VUE[".vue 檔案"] --> TEMPLATE["提取 template"]
    VUE --> SCRIPT_TAG["提取 script<br/>(偵測 setup)"]

    TEMPLATE --> BUTTONS["提取按鈕<br/>button 標籤<br/>@click handler"]
    TEMPLATE --> LINKS["提取連結<br/>a 標籤"]
    TEMPLATE --> INPUTS["提取輸入框<br/>input / textarea / select<br/>v-model"]
    TEMPLATE --> BINDINGS["提取文字綁定<br/>{{ expression }}"]
    TEMPLATE --> CONDITIONALS["提取條件渲染<br/>v-if / v-show"]

    SCRIPT_TAG --> PROPS["提取 defineProps<br/>TypeScript 泛型<br/>物件語法"]
    SCRIPT_TAG --> EMITS["提取 defineEmits<br/>TypeScript 泛型<br/>陣列語法"]

    BUTTONS --> RESULT["VueComponentResult"]
    LINKS --> RESULT
    INPUTS --> RESULT
    BINDINGS --> RESULT
    CONDITIONALS --> RESULT
    PROPS --> RESULT
    EMITS --> RESULT
```

### 2.4 測試產生器 (`generateVitest`)

```mermaid
graph TB
    FUNC["函數資訊"] --> CLASSIFY{"async?"}
    CLASSIFY -->|同步| SYNC["同步測試"]
    CLASSIFY -->|非同步| ASYNC["非同步測試"]

    SYNC --> BASIC["基本測試<br/>- 是函數<br/>- 參數數量<br/>- 不拋錯<br/>- 有回傳值"]
    SYNC --> TYPE_CHECK["型別測試<br/>（如有 returnType）"]
    SYNC --> SNAPSHOT["Snapshot 測試"]
    SYNC --> EDGE["邊界值測試"]
    SYNC --> OPTIONAL["可選參數測試"]

    ASYNC --> PROMISE["Promise 測試<br/>- 回傳 Promise"]

    EDGE --> NUM_EDGE["數字：0、負數、錯誤型別"]
    EDGE --> STR_EDGE["字串：空字串、錯誤型別"]
    EDGE --> ARR_EDGE["陣列：空陣列、錯誤型別"]
    EDGE --> BOOL_EDGE["布林：false、錯誤型別"]
    EDGE --> OBJ_EDGE["物件：null、空物件、錯誤型別"]
    EDGE --> MISSING["缺少必填參數"]
```

### 2.5 報告產生器 (`generate-report.js`)

```mermaid
graph LR
    TEST_JSON["testforge-results.json"] --> PARSE["解析結果"]
    COVERAGE_JSON["coverage-summary.json"] --> PARSE

    PARSE --> SUMMARY["計算摘要<br/>通過/失敗/覆蓋率"]

    SUMMARY --> FULL["TestForge-Report.md<br/>完整報告"]
    SUMMARY --> PR["testforge-pr-comment.md<br/>PR 留言內容"]
    SUMMARY --> COMPAT["UnitTest-Report.md<br/>Coverage-Report.md<br/>（向下相容）"]
    SUMMARY --> GH_OUTPUT["GitHub Actions<br/>Outputs"]
```

---

## 3. 資料流

### 3.1 CLI 執行流程

```
使用者
  │
  ├── node testforge.js ./project
  │     │
  │     ├── scanDirectory() → 檔案列表
  │     ├── analyzeFile() × N → 函數資訊
  │     ├── analyzeVueComponent() × N → 元件資訊
  │     ├── generateVitest() × N → 測試程式碼
  │     └── generateVueComponentTest() × N → 元件測試程式碼
  │           │
  │           └── 寫入 __generated_tests__/
  │
  ├── npx vitest run → 測試結果 JSON
  │
  └── node scripts/generate-report.js
        │
        └── 寫入報告檔案
```

### 3.2 GitHub Action 執行流程

```
GitHub Event (push / PR)
  │
  ├── Step 1: actions/setup-node → Node.js 環境
  ├── Step 2: npm install → TestForge 依賴
  ├── Step 3: npm install → 目標專案依賴
  ├── Step 4: 偵測框架 → 安裝 vitest 等
  ├── Step 5: testforge.js → 產生測試
  ├── Step 6: 檢查 vitest 設定
  ├── Step 7: vitest run → 測試 & 覆蓋率
  ├── Step 8: generate-report.js → 產生報告
  ├── Step 9: push-to-branch.sh → 推到 testforge/reports
  └── Step 10: github-script → PR Comment
```

---

## 4. 目錄結構

```
testforge/
├── action.yml                      # GitHub Composite Action 定義
├── testforge.js                    # 核心：AST 分析 + 測試產生
├── 1-ast-analyzer.js               # 教學範例：AST 分析器
├── 2-openapi-to-k6.js              # 教學範例：OpenAPI → k6
├── package.json                    # 專案設定
│
├── scripts/
│   ├── run-testforge.sh            # 主執行腳本（跨平台）
│   ├── generate-report.js          # 統一報告產生器
│   └── push-to-branch.sh           # 報告分支推送
│
├── .github/
│   └── workflows/
│       └── testforge-ci.yml        # 自身 CI workflow
│
├── docs/
│   ├── SPEC.md                     # 技術規格書
│   └── ARCHITECTURE.md             # 架構文件（本檔案）
│
├── sample-vue-project/             # 範例 Vue 專案
│   ├── src/
│   │   ├── App.vue
│   │   ├── components/
│   │   ├── composables/
│   │   ├── utils/
│   │   └── api/
│   ├── __generated_tests__/        # TestForge 產生的測試
│   ├── package.json
│   └── vite.config.ts
│
├── update-test-report.js           # (舊) 測試報告更新器
├── update-readme.js                # (舊) 覆蓋率報告更新器
├── UnitTest-Report.md              # 單元測試報告
├── Coverage-Report.md              # 覆蓋率報告
└── README.md                       # 專案 README
```

---

## 5. 測試資料推測引擎

TestForge 使用多層策略來推測合適的測試資料：

```mermaid
graph TB
    PARAM["參數資訊<br/>name + type"] --> TS{"有 TS 型別？"}
    TS -->|是| TS_MAP["根據型別對應<br/>number → 42<br/>string → 'test'<br/>boolean → true"]
    TS -->|否| DEFAULT{"有預設值？"}
    DEFAULT -->|是| USE_DEFAULT["使用預設值"]
    DEFAULT -->|否| DESTRUCTURED{"是解構？"}
    DESTRUCTURED -->|是| OBJECT["{ key: 'value' }"]
    DESTRUCTURED -->|否| NAME_MATCH["根據名稱模式匹配<br/>email → 'test@example.com'<br/>price → 99.99"]
    NAME_MATCH --> FUZZY{"精確匹配？"}
    FUZZY -->|是| USE_MATCH["使用匹配值"]
    FUZZY -->|否| FUZZY_MATCH["模糊匹配（contains）"]
    FUZZY_MATCH --> FALLBACK["fallback: 'test'"]
```

---

## 6. 錯誤處理策略

| 情境 | 處理方式 |
| --- | --- |
| AST 解析失敗 | 跳過該檔案，輸出警告，繼續處理其他檔案 |
| 沒有找到 exported 函數 | 跳過該檔案（可能是設定檔） |
| 部分測試失敗 | 繼續產生報告，在報告中標記失敗的測試 |
| 覆蓋率低於門檻 | 在報告中標記警告，但不阻擋 CI |
| 無法推送到分支 | 輸出警告，不影響測試結果 |
| 目標專案沒有 package.json | 跳過依賴安裝，直接掃描 |
