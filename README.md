# 🔧 TestForge

> **自動化測試平台** — 掃描專案、產生測試、執行分析、產生報告，全部自動完成。

![Tests](https://img.shields.io/badge/Tests-269_Passed-brightgreen?logo=vitest&logoColor=white)
![Coverage](https://img.shields.io/badge/Coverage-88.48%25-brightgreen?logo=codecov&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-20+-green?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

**📊 專案實測成果展示：**

[![Reports Branch](https://img.shields.io/badge/%E9%BB%9E%E6%AD%A4%E6%9F%A5%E7%9C%8B-%E8%87%AA%E5%8B%95%E7%94%A2%E7%94%9F%E7%9A%84%E6%B8%AC%E8%A9%95%E5%A0%B1%E5%91%8A-blue?style=for-the-badge&logo=github&logoColor=white)](https://github.com/JeffLin0225/testforge/tree/testforge/reports)<br>
*(💡 點擊上方按鈕即可直接跳轉到 `testforge/reports` 分支，查看完整產生的測試程式碼與 HTML 互動式覆蓋率報告)*

---

## 📖 文件

| 文件 | 說明 |
| --- | --- |
| [SPEC.md](docs/SPEC.md) | 完整技術規格書 |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 系統架構文件 |

---

## ✨ 功能特色

| 功能 | 說明 |
| --- | --- |
| 🌳 **AST 智慧分析** | 用抽象語法樹解析你的程式碼，提取所有 exported 函數 |
| 🧪 **自動產生測試** | 根據函數簽名、參數型別、命名模式，自動產生 Vitest 單元測試 |
| 🟩 **Vue 元件測試** | 分析 `<template>` 和 `<script setup>`，產生完整的元件互動測試 |
| 📊 **覆蓋率報告** | 執行測試並產生覆蓋率報告，含 Markdown 和互動式 HTML |
| 🤖 **GitHub Action** | 一行引入，自動在 CI/CD 中執行測試並產生報告 |
| 📤 **報告分支** | 自動將報告推送到獨立分支，方便查閱 |
| 💬 **PR 留言** | 在 Pull Request 上自動留言測試摘要 |
| ⚡ **K6 負載測試** | 讀取 OpenAPI 文件，自動產生 k6 負載測試腳本 |

---

## 🚀 快速開始

### 方式一：GitHub Action（推薦）

在你的專案中建立 `.github/workflows/testforge.yml`：

```yaml
name: TestForge — 自動測試
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: write        # 允許推送到 testforge/reports 分支
  pull-requests: write   # 允許在 PR 上留言

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: JeffLin0225/TestForge@v1
        with:
          project-path: './'
```

就這樣！TestForge 會自動：
1. 🔍 掃描你的專案
2. 🧪 產生測試腳本
3. 📦 安裝必要依賴（vitest 等）
4. ▶️ 執行測試 & 覆蓋率分析
5. 📊 產生報告 & 推送到 `testforge/reports` 分支
6. 💬 在 PR 上留言摘要

### 方式二：CLI 本地執行

```bash
# 1. Clone TestForge
git clone https://github.com/JeffLin0225/testforge.git
cd testforge

# 2. 安裝依賴
npm install

# 3. 掃描你的專案並產生測試
node testforge.js /path/to/your/project

# 4. 或使用完整腳本（含自動安裝依賴 + 執行測試）
bash scripts/run-testforge.sh /path/to/your/project
```

---

## ⚙️ GitHub Action 設定選項

```yaml
- uses: JeffLin0225/testforge@v1
  with:
    # 必填：要掃描的專案目錄
    project-path: './'
    
    # 選填：Node.js 版本（預設 20）
    node-version: '20'
    
    # 選填：是否推送報告到分支（預設 true）
    create-branch: 'true'
    
    # 選填：報告分支名稱（預設 testforge/reports）
    branch-name: 'testforge/reports'
    
    # 選填：是否在 PR 留言（預設 true）
    comment-on-pr: 'true'
    
    # 選填：覆蓋率門檻 %（預設 80）
    coverage-threshold: '80'
    
    # 選填：自動安裝測試依賴（預設 true）
    install-dependencies: 'true'
    
    # 選填：框架偵測（auto / vue / react / node，預設 auto）
    framework: 'auto'
```

### Outputs

你可以在後續 step 中使用 TestForge 的輸出：

```yaml
steps:
  - uses: JeffLin0225/testforge@v1
    id: testforge
    with:
      project-path: './'

  - name: 檢查結果
    run: |
      echo "通過: ${{ steps.testforge.outputs.test-passed }}"
      echo "失敗: ${{ steps.testforge.outputs.test-failed }}"
      echo "覆蓋率: ${{ steps.testforge.outputs.coverage-percent }}%"
```

---

## 🧪 產生的測試範例

### 函數測試

對於以下函數：
```typescript
export function formatPrice(amount: number, currency: string = 'NT$'): string {
  return `${currency} ${amount.toFixed(2)}`;
}
```

TestForge 自動產生：
```typescript
describe('formatPrice', () => {
  it('應該是一個函數', () => {
    expect(typeof formatPrice).toBe('function');
  });

  it('預期接收 1 個必填參數', () => {
    expect(formatPrice.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => formatPrice(99.99, 'NT$')).not.toThrow();
  });

  it('回傳型別應為 string', () => {
    const result = formatPrice(99.99, 'NT$');
    expect(typeof result).toBe('string');
  });

  // 邊界值測試
  it('amount 為 0 時不應崩潰', () => {
    expect(() => formatPrice(0)).not.toThrow();
  });

  it('只傳必填參數也不應崩潰', () => {
    expect(() => formatPrice(99.99)).not.toThrow();
  });
});
```

### Vue 元件測試

對於 Vue 元件，TestForge 會分析 template 和 script：
```typescript
describe('LoginForm.vue', () => {
  it('應該能正常掛載', () => {
    const wrapper = mount(LoginForm);
    expect(wrapper.exists()).toBe(true);
  });

  it('email 輸入框應該存在', () => {
    const wrapper = mount(LoginForm);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
  });

  it('點擊「登入」應觸發 submit 事件', async () => {
    const wrapper = mount(LoginForm);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('submit')).toBeTruthy();
  });
});
```

---

## 📂 支援的框架

| 框架 | 偵測方式 | 自動安裝 |
| --- | --- | --- |
| **Vue 3** | `package.json` 含 `vue` | `@vue/test-utils`, `jsdom` |
| **React** | `package.json` 含 `react` | `@testing-library/react`, `jsdom` |
| **Node.js** | 預設 | `vitest` |
| **Nuxt** | `package.json` 含 `nuxt` | 同 Vue |
| **Next.js** | `package.json` 含 `next` | 同 React |

---

## 📊 報告範例

TestForge 產生的報告包含：

- **測試摘要**：通過/失敗數、測試檔案列表
- **覆蓋率**：Statements / Branches / Functions / Lines
- **失敗明細**：失敗的測試名稱和錯誤訊息
- **PR Comment**：自動在 Pull Request 上留言

> [!TIP]
> **💡 為什麼要把報告放在獨立分支？**
> 
> 為了保持你專案的 `main` 分支乾淨！TestForge 會自動在**你的專案**中建立一個名為 `testforge/reports` 的孤兒分支（orphan branch），並將每次執行的測試腳本、測試報告與覆蓋率 HTML 推送上去。
>
> 這樣一來，你的主要程式碼庫不會被自動產生的測試檔給弄亂（避免大量雜訊），同時你又能隨時切換到報告分支查看完整的測試結果。
> 
> 如果你想更醒目地展示，還能搭配 **GitHub Pages**，直接將該分支的 `coverage/index.html` 部署成精美的靜態網頁！

**🔗 [👀 點這裡預覽 TestForge 產生的報告分支範例](https://github.com/JeffLin0225/testforge/tree/testforge/reports)**

---

## 🛠️ 本地開發

```bash
# Clone
git clone https://github.com/JeffLin0225/testforge.git
cd testforge

# 安裝依賴
npm install

# 用範例專案測試
node testforge.js ./sample-vue-project

# 執行測試
npm run test

# 執行覆蓋率測試
npm run test:coverage
```

---

## 📋 目前測試成果

對 `sample-vue-project` 的測試結果：

| 指標 | 數值 |
| --- | --- |
| 測試檔案 | 8 個 |
| 總測試數 | 269 個 |
| 通過率 | 100% ✅ |
| 覆蓋率 | 88.48% |

| 覆蓋率分類 | 百分比 |
| --- | --- |
| Statements | 88.48% |
| Branches | 85.88% |
| Functions | 81.39% |
| Lines | 88.48% |

---

## 📄 授權

ISC License
