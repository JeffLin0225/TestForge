const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, 'UnitTestReport.md');
const RESULTS_PATH = path.join(__dirname, 'sample-vue-project', 'test-results.json');

function updateReport() {
  if (!fs.existsSync(RESULTS_PATH)) {
    console.log('找不到測試結果報告，請先執行 npm run test');
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf-8'));
  } catch (e) {
    console.log('解析測試報告失敗，檔案可能不完整');
    process.exit(1);
  }
  
  const total = data.numTotalTests || 0;
  const passed = data.numPassedTests || 0;
  const failed = data.numFailedTests || 0;
  
  let color = 'brightgreen';
  if (failed > 0) color = 'red';
  else if (total === 0) color = 'yellow';

  const content = `# 單元測試報告 (Unit Test Report)

![Tests](https://img.shields.io/badge/Tests-${passed}_Passed-${color})

這個檔案是由自動化腳本產生的最新單元測試報告。
當你執行 \`npm run test\` 後，此檔案會自動更新。

## 測試總覽 (Test Overview)
- **總測試數**: ${total}
- **通過**: ✅ ${passed}
- **失敗**: ❌ ${failed}

## 測試檔案結果
| 檔案名稱 | 狀態 | 通過/總數 |
| --- | --- | --- |
${data.testResults.map(file => {
  const fileTotal = file.assertionResults.length;
  const filePassed = file.assertionResults.filter(r => r.status === 'passed').length;
  const statusIcon = file.status === 'passed' ? '✅' : '❌';
  return `| \`${path.basename(file.name)}\` | ${statusIcon} | ${filePassed} / ${fileTotal} |`;
}).join('\n')}

`;

  fs.writeFileSync(REPORT_PATH, content, 'utf-8');
  console.log(`✅ UnitTestReport.md 測試報告已自動更新 (${passed}/${total} 通過)`);
}

updateReport();
