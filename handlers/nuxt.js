const path = require('path');
const vueHandler = require('./vue');

// ============================================================
// Nuxt Handler
// 目前將 .nuxt 檔案視為 Vue 元件進行分析與產生測試，
// 未來可針對 Nuxt 專屬特性 (如 useAsyncData, layout, middleware) 進行擴充
// ============================================================

function analyze(filePath) {
  // 借用 Vue Handler 的分析邏輯
  const result = vueHandler.analyze(filePath);
  return result;
}

function generate(result, importPath) {
  // 借用 Vue Handler 的產生邏輯
  const generatedFiles = vueHandler.generate(result, importPath);
  
  const nuxtMocks = `
// ============================================
// 🟢 Nuxt 專屬 Mocks (模擬 Auto-imports)
import { vi } from 'vitest';
vi.stubGlobal('useRoute', () => ({ path: '/', query: {}, params: {} }));
vi.stubGlobal('useRouter', () => ({ push: vi.fn(), replace: vi.fn(), go: vi.fn(), back: vi.fn() }));
vi.stubGlobal('navigateTo', vi.fn());
vi.stubGlobal('useFetch', () => ({ data: { value: null }, pending: { value: false }, error: { value: null }, execute: vi.fn() }));
vi.stubGlobal('useAsyncData', () => ({ data: { value: null }, pending: { value: false }, error: { value: null }, execute: vi.fn() }));
vi.stubGlobal('useRuntimeConfig', () => ({ public: {} }));
vi.stubGlobal('definePageMeta', vi.fn());
// ============================================
`;

  return generatedFiles.map(file => {
    let newCode = file.code.replace('🟩 自動產生的 Vue 元件測試', '🟢 自動產生的 Nuxt 元件測試');
    // 在最後一個 import 後面注入 Nuxt Mocks
    newCode = newCode.replace(/(import .* from '.*';\n)(?!import)/, match => match + '\n' + nuxtMocks);
    return {
      suffix: file.suffix.replace('.vue', '.nuxt'),
      code: newCode
    };
  });
}

module.exports = { analyze, generate };
