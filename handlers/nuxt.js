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
  // 借用 Vue Handler 的產生邏輯，可以根據需要修改後綴名
  const generatedFiles = vueHandler.generate(result, importPath);
  
  // 假設我們想要為 Nuxt 元件加上特殊的標記或檔名後綴
  return generatedFiles.map(file => ({
    suffix: file.suffix.replace('.vue', '.nuxt'),
    code: file.code.replace('🟩 自動產生的 Vue 元件測試', '🟢 自動產生的 Nuxt 元件測試')
  }));
}

module.exports = { analyze, generate };
