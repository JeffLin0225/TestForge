# TestForge 技術規格書 (SPEC)

> 📅 最後更新：2026-07-05
> 📌 版本：v1.0.0

---

## 1. 專案概述

### 1.1 願景

TestForge 是一個**自動化測試平台**，目標是讓任何前端/Node.js 專案都能「零設定」地獲得：

1. 自動產生的單元測試腳本
2. 自動執行的測試 & 覆蓋率分析
3. 自動產生的測試報告
4. CI/CD 整合（GitHub Actions）

### 1.2 核心價值

| 價值 | 說明 |
| --- | --- |
| **零設定** | 使用者不需要安裝 vitest，不需要寫設定檔，只需引入 TestForge |
| **自動化** | 從掃描、分析、產生測試到執行報告，全部自動完成 |
| **可擴展** | 支援多種框架（Vue / React / Node），可透過設定自訂行為 |
| **CI 友善** | 原生支援 GitHub Actions，一行引入即可使用 |

### 1.3 目標使用者

- 個人開發者：想為專案快速建立測試基礎
- 小型團隊：想在 CI/CD 流程中加入自動測試
- 開源專案：想提升專案的測試覆蓋率

---

## 2. 系統功能

### 2.1 功能清單

| 模組 | 功能 | 狀態 |
| --- | --- | --- |
| AST 分析器 | 掃描 .js / .ts / .vue 檔案 | ✅ 完成 |
| AST 分析器 | 提取 exported 函數（名稱、參數、型別） | ✅ 完成 |
| AST 分析器 | Vue SFC template 分析（按鈕、輸入框、v-if） | ✅ 完成 |
| AST 分析器 | defineProps / defineEmits 解析 | ✅ 完成 |
| 測試產生器 | 產生 Vitest 單元測試 | ✅ 完成 |
| 測試產生器 | 產生 Vue 元件測試（@vue/test-utils） | ✅ 完成 |
| 測試產生器 | 邊界值測試（空值、型別錯誤、null） | ✅ 完成 |
| 測試產生器 | Snapshot 測試 | ✅ 完成 |
| 測試產生器 | 根據參數名 & 型別智慧推測測試資料 | ✅ 完成 |
| K6 產生器 | 讀取 OpenAPI YAML 產生 k6 負載測試 | ✅ 完成 |
| 報告系統 | 單元測試報告（Markdown） | ✅ 完成 |
| 報告系統 | 覆蓋率報告（Markdown + Badge） | ✅ 完成 |
| 報告系統 | 統一報告（TestForge-Report.md） | ✅ 完成 |
| 報告系統 | PR Comment 自動留言 | ✅ 完成 |
| CI/CD | GitHub Composite Action | ✅ 完成 |
| CI/CD | 報告分支自動推送 | ✅ 完成 |
| CI/CD | 框架自動偵測 | ✅ 完成 |

### 2.2 支援的檔案類型

| 副檔名 | 說明 | AST 解析器 |
| --- | --- | --- |
| `.js` | JavaScript | Babel Parser |
| `.ts` | TypeScript | Babel Parser (TypeScript plugin) |
| `.jsx` | React JSX | Babel Parser (JSX plugin) |
| `.tsx` | React TSX | Babel Parser (TypeScript + JSX) |
| `.vue` | Vue SFC | 自訂 `<script>` / `<template>` 解析器 |

### 2.3 支援的框架

| 框架 | 偵測方式 | 安裝的測試依賴 |
| --- | --- | --- |
| Vue 3 | `package.json` 中有 `vue` | `@vue/test-utils`, `jsdom` |
| React | `package.json` 中有 `react` | `@testing-library/react`, `jsdom` |
| Node.js | 預設 fallback | `vitest` |
| Nuxt | `package.json` 中有 `nuxt` | 同 Vue |
| Next.js | `package.json` 中有 `next` | 同 React |

---

## 3. CLI 介面規格

### 3.1 testforge.js — 測試產生器

```
用法：node testforge.js <專案目錄>

參數：
  <專案目錄>  要掃描的專案根目錄路徑（必填）

範例：
  node testforge.js ./my-vue-project
  node testforge.js /absolute/path/to/project

輸出：
  在 <專案目錄>/__generated_tests__/ 中產生測試檔案

退出碼：
  0  成功
  1  參數錯誤或目錄不存在
```

### 3.2 run-testforge.sh — 完整執行腳本

```
用法：bash scripts/run-testforge.sh <專案路徑> [選項]

選項：
  --framework <auto|vue|react|node>  指定框架（預設：auto）
  --threshold <數字>                  覆蓋率門檻（預設：80）
  --skip-install                      跳過依賴安裝
  --help, -h                          顯示說明

範例：
  bash scripts/run-testforge.sh ./sample-vue-project
  bash scripts/run-testforge.sh ./my-project --framework vue --threshold 90
```

---

## 4. GitHub Action 規格

### 4.1 使用方式

在你的專案中建立 `.github/workflows/testforge.yml`：

```yaml
name: TestForge
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: JeffLin0225/testforge@v1
        with:
          project-path: './'
```

### 4.2 Inputs

| 名稱 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `project-path` | ✅ | `./` | 要掃描的專案目錄 |
| `node-version` | ❌ | `20` | Node.js 版本 |
| `create-branch` | ❌ | `true` | 是否推送報告到分支 |
| `branch-name` | ❌ | `testforge/reports` | 報告分支名稱 |
| `comment-on-pr` | ❌ | `true` | 是否在 PR 留言 |
| `coverage-threshold` | ❌ | `80` | 覆蓋率門檻（%） |
| `install-dependencies` | ❌ | `true` | 自動安裝測試依賴 |
| `framework` | ❌ | `auto` | 指定框架 |

### 4.3 Outputs

| 名稱 | 說明 |
| --- | --- |
| `test-total` | 測試總數 |
| `test-passed` | 通過的測試數 |
| `test-failed` | 失敗的測試數 |
| `coverage-percent` | 覆蓋率百分比 |
| `report-branch` | 報告分支名稱 |
| `report-url` | 報告 GitHub 連結 |

### 4.4 運作流程

```
1. 設定 Node.js 環境
2. 安裝 TestForge 自身依賴
3. 安裝目標專案依賴
4. 偵測框架 → 安裝對應測試依賴（vitest 等）
5. 執行 testforge.js → 產生測試腳本
6. 確保 vitest 設定存在
7. 執行 vitest → 測試 + 覆蓋率
8. 執行 generate-report.js → 產生報告
9. 推送報告到 testforge/reports 分支
10. 在 PR 上留言測試摘要
```

---

## 5. 輸出檔案格式

### 5.1 產生的測試檔案

```
<專案目錄>/
  __generated_tests__/
    ├── ComponentA.vue.test.ts       ← Vue 元件測試
    ├── ComponentB.vue.test.ts
    ├── ComponentB.vue.unit.test.ts  ← Vue script 中的函數測試
    ├── utils/
    │   ├── math.test.ts             ← 工具函數測試
    │   └── validation.test.ts
    └── api/
        └── userService.test.ts      ← API 服務測試
```

### 5.2 報告檔案

| 檔案 | 說明 | 產生方式 |
| --- | --- | --- |
| `TestForge-Report.md` | 統一測試報告（測試+覆蓋率） | `generate-report.js` |
| `testforge-pr-comment.md` | PR Comment 內容 | `generate-report.js` |
| `testforge-results.json` | 原始測試結果 JSON | vitest |
| `UnitTest-Report.md` | 單元測試報告（向下相容） | `generate-report.js` |
| `Coverage-Report.md` | 覆蓋率報告（向下相容） | `generate-report.js` |

### 5.3 測試產生策略

#### 函數測試

對每個 exported 函數產生：

1. **存在性測試**：確認是 function
2. **簽名測試**：驗證 `Function.length` 與必填參數數一致
3. **呼叫測試**：用推測的測試資料呼叫，不應崩潰
4. **回傳值測試**：確認有回傳值、型別正確
5. **Snapshot 測試**：偵測非預期的行為變更
6. **邊界值測試**：
   - 數字：0、負數、字串型別
   - 字串：空字串、數字型別
   - 陣列：空陣列、字串型別
   - 物件：null、空物件、數字型別
   - 布林：false、字串型別
7. **可選參數測試**：只傳必填參數

#### Vue 元件測試

對每個 `.vue` 元件產生：

1. **掛載測試**：確認能正常 mount
2. **Props 渲染**：傳入 props 後確認畫面中有對應文字
3. **按鈕互動**：
   - 確認按鈕存在
   - 點擊後觸發正確的 emit 事件
4. **表單輸入**：
   - 確認輸入框存在
   - v-model 雙向綁定
   - 表單提交
5. **條件渲染**：v-if / v-show 不同狀態不應崩潰
6. **Snapshot**：渲染結果快照

---

## 6. 測試資料推測策略

TestForge 使用多層策略來推測合適的測試資料：

```
優先順序：
  1. TypeScript 型別註解（最可靠）
  2. 參數預設值
  3. 參數名稱模式匹配
  4. 通用 fallback 值
```

### 名稱 → 測試值 對照表（部分）

| 參數名模式 | 推測型別 | 測試值 |
| --- | --- | --- |
| `email` | string | `"test@example.com"` |
| `name` | string | `"Test User"` |
| `price`, `amount` | number | `99.99` |
| `items`, `list` | array | `[{ id: "1" }]` |
| `enabled`, `visible` | boolean | `true` |
| `a`, `b` | number | `1`, `2` |

---

## 7. 跳過規則

### 7.1 目錄跳過

以下目錄不會被掃描：

```
node_modules, dist, .git, .nuxt, .next, 
coverage, __tests__, __generated_tests__
```

### 7.2 函數跳過

以下函數不會產生測試：

- 未 export 的函數（內部函數）
- 設定檔中的函數（如 `vite.config.ts`）

---

## 8. 依賴

### 8.1 TestForge 自身依賴

| 套件 | 用途 |
| --- | --- |
| `@babel/parser` | AST 解析（支援 TS/JSX/Vue） |
| `acorn` | JavaScript AST 解析（用於教學範例） |
| `acorn-walk` | AST 遍歷工具 |
| `js-yaml` | 解析 OpenAPI YAML 檔案 |

### 8.2 會自動安裝給目標專案的依賴

| 套件 | 條件 |
| --- | --- |
| `vitest` | 總是安裝 |
| `@vitest/coverage-v8` | 總是安裝 |
| `@vue/test-utils` | 偵測到 Vue 時 |
| `jsdom` | 偵測到 Vue / React 時 |
| `@testing-library/react` | 偵測到 React 時 |

---

## 9. 限制與已知問題

| 限制 | 說明 |
| --- | --- |
| 只分析 exported 函數 | 內部函數不會被偵測 |
| Vue 2 不支援 | 目前只支援 Vue 3 (Composition API) |
| 不支援 Svelte / Angular | 未來可擴展 |
| Mock 能力有限 | async 函數的外部依賴需要手動 mock |
| 測試只是起點 | 產生的測試是基礎框架，使用者應該補充業務邏輯測試 |

---

## 10. 未來規劃

| 功能 | 優先度 | 說明 |
| --- | --- | --- |
| React 元件測試產生 | 🔴 高 | 類似 Vue 的 template 分析 |
| 設定檔支援 | 🟡 中 | `testforge.config.js` 自訂行為 |
| GitLab CI 支援 | 🟡 中 | `.gitlab-ci.yml` 模板 |
| 互動式 HTML 報告 | 🟢 低 | 產生美觀的 HTML 報告頁面 |
| AI 輔助測試 | 🟢 低 | 用 AI 分析函數邏輯，產生更精準的測試 |
