const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, 'coverage-report.md');
const COVERAGE_PATH = path.join(__dirname, 'sample-vue-project', 'coverage', 'coverage-summary.json');

function updateReport() {
  if (!fs.existsSync(COVERAGE_PATH)) {
    console.log('找不到覆蓋率報告，請先執行 npm run test:coverage');
    process.exit(1);
  }

  const coverageData = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf-8'));
  const total = coverageData.total;

  if (!total) {
    console.log('覆蓋率報告格式錯誤');
    process.exit(1);
  }

  // 取 Statements 的覆蓋率當作整體指標
  const pct = total.statements.pct;

  // 決定徽章顏色
  let color = 'brightgreen';
  if (pct < 80) color = 'yellow';
  if (pct < 60) color = 'red';

  const content = `# 測試覆蓋率報告 (Test Coverage)

![Coverage](https://img.shields.io/badge/Coverage-${pct}%25-${color})

這個檔案是由自動化腳本產生的最新測試覆蓋率報告。
當你執行 \`npm run test:coverage\` 後，此檔案會自動更新。

## 覆蓋率總覽 (Overall Coverage)
**整體覆蓋率：${pct}%**

| 類別 (Category) | 覆蓋率 (Coverage) |
| --- | --- |
| Statements | ${total.statements.pct}% |
| Branches | ${total.branches.pct}% |
| Functions | ${total.functions.pct}% |
| Lines | ${total.lines.pct}% |

> 💡 **提示**：如果想看詳細的互動式報告，請用瀏覽器開啟 \`sample-vue-project/coverage/index.html\`。
`;

  fs.writeFileSync(REPORT_PATH, content, 'utf-8');
  console.log(`✅ coverage.md 覆蓋率已自動更新為 ${pct}%`);
}

updateReport();
