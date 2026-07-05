#!/usr/bin/env node

// ============================================================
//  📊 TestForge — 統一報告產生器
//
//  用法：
//    node scripts/generate-report.js <專案路徑> [覆蓋率門檻]
//
//  輸出：
//    - <專案路徑>/TestForge-Report.md     合併測試+覆蓋率報告
//    - <專案路徑>/testforge-pr-comment.md  PR Comment 內容
//    - GitHub Actions outputs（如在 CI 環境中）
// ============================================================

const fs = require('fs');
const path = require('path');

// ---- 參數 ----
const projectPath = process.argv[2];
const threshold = parseFloat(process.argv[3] || '80');

if (!projectPath) {
  console.error('❌ 請指定專案路徑');
  process.exit(1);
}

const absProjectPath = path.resolve(projectPath);

// ---- 讀取測試結果 ----
let testData = null;
const testResultPaths = [
  path.join(absProjectPath, 'testforge-results.json'),
  path.join(absProjectPath, 'test-results.json'),
];

for (const p of testResultPaths) {
  if (fs.existsSync(p)) {
    try {
      testData = JSON.parse(fs.readFileSync(p, 'utf-8'));
      break;
    } catch (e) {
      console.warn(`⚠️  解析 ${path.basename(p)} 失敗：${e.message}`);
    }
  }
}

// ---- 讀取覆蓋率結果 ----
let coverageData = null;
const coveragePath = path.join(absProjectPath, 'coverage', 'coverage-summary.json');

if (fs.existsSync(coveragePath)) {
  try {
    coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
  } catch (e) {
    console.warn(`⚠️  解析覆蓋率報告失敗：${e.message}`);
  }
}

// ---- 計算摘要數據 ----
const summary = {
  totalTests: testData?.numTotalTests || 0,
  passedTests: testData?.numPassedTests || 0,
  failedTests: testData?.numFailedTests || 0,
  testFiles: testData?.testResults?.length || 0,
  coverage: {
    statements: coverageData?.total?.statements?.pct || 0,
    branches: coverageData?.total?.branches?.pct || 0,
    functions: coverageData?.total?.functions?.pct || 0,
    lines: coverageData?.total?.lines?.pct || 0,
  },
  timestamp: new Date().toISOString(),
  thresholdMet: true,
};

// 以 statements 作為整體覆蓋率指標
const overallCoverage = summary.coverage.statements;
summary.thresholdMet = overallCoverage >= threshold;

// ---- 決定徽章顏色 ----
function getBadgeColor(pct) {
  if (pct >= 90) return 'brightgreen';
  if (pct >= 80) return 'green';
  if (pct >= 70) return 'yellowgreen';
  if (pct >= 60) return 'yellow';
  if (pct >= 50) return 'orange';
  return 'red';
}

function getTestBadgeColor(passed, total) {
  if (total === 0) return 'yellow';
  if (passed === total) return 'brightgreen';
  if (passed / total >= 0.9) return 'yellow';
  return 'red';
}

const coverageColor = getBadgeColor(overallCoverage);
const testColor = getTestBadgeColor(summary.passedTests, summary.totalTests);

// ============================================================
// 產生完整報告 — TestForge-Report.md
// ============================================================
function generateFullReport() {
  let report = `# 🔧 TestForge 測試報告

![Tests](https://img.shields.io/badge/Tests-${summary.passedTests}_Passed,_${summary.failedTests}_Failed-${testColor})
![Coverage](https://img.shields.io/badge/Coverage-${overallCoverage}%25-${coverageColor})
![Threshold](https://img.shields.io/badge/Threshold-${threshold}%25-${summary.thresholdMet ? 'green' : 'red'})

> 📅 報告產生時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
> 🔧 由 [TestForge](https://github.com/JeffLin0225/testforge) 自動產生

---

## 📋 測試總覽

| 指標 | 數值 |
| --- | --- |
| 測試檔案數 | ${summary.testFiles} |
| 總測試數 | ${summary.totalTests} |
| ✅ 通過 | ${summary.passedTests} |
| ❌ 失敗 | ${summary.failedTests} |
| 通過率 | ${summary.totalTests > 0 ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1) : 0}% |

`;

  // ---- 測試檔案明細 ----
  if (testData?.testResults?.length > 0) {
    report += `## 📄 測試檔案結果

| 檔案名稱 | 狀態 | 通過 | 失敗 | 總數 |
| --- | --- | --- | --- | --- |
`;

    for (const file of testData.testResults) {
      const fileName = path.basename(file.name);
      const fileTotal = file.assertionResults?.length || 0;
      const filePassed = file.assertionResults?.filter(r => r.status === 'passed').length || 0;
      const fileFailed = fileTotal - filePassed;
      const statusIcon = file.status === 'passed' ? '✅' : '❌';
      report += `| \`${fileName}\` | ${statusIcon} | ${filePassed} | ${fileFailed} | ${fileTotal} |\n`;
    }

    report += '\n';
  }

  // ---- 覆蓋率明細 ----
  if (coverageData) {
    report += `## 📊 測試覆蓋率

**整體覆蓋率：${overallCoverage}%** ${summary.thresholdMet ? '✅ 達到門檻' : `⚠️ 低於門檻 (${threshold}%)`}

| 類別 | 覆蓋率 | 狀態 |
| --- | --- | --- |
| Statements | ${summary.coverage.statements}% | ${summary.coverage.statements >= threshold ? '✅' : '⚠️'} |
| Branches | ${summary.coverage.branches}% | ${summary.coverage.branches >= threshold ? '✅' : '⚠️'} |
| Functions | ${summary.coverage.functions}% | ${summary.coverage.functions >= threshold ? '✅' : '⚠️'} |
| Lines | ${summary.coverage.lines}% | ${summary.coverage.lines >= threshold ? '✅' : '⚠️'} |

`;
  }

  // ---- 失敗的測試明細 ----
  if (summary.failedTests > 0 && testData?.testResults) {
    report += `## ❌ 失敗的測試\n\n`;

    for (const file of testData.testResults) {
      const failedAssertions = file.assertionResults?.filter(r => r.status === 'failed') || [];
      if (failedAssertions.length > 0) {
        report += `### \`${path.basename(file.name)}\`\n\n`;
        for (const assertion of failedAssertions) {
          report += `- **${assertion.fullName || assertion.title}**\n`;
          if (assertion.failureMessages?.length > 0) {
            report += `  \`\`\`\n  ${assertion.failureMessages[0].split('\n').slice(0, 5).join('\n  ')}\n  \`\`\`\n`;
          }
        }
        report += '\n';
      }
    }
  }

  report += `---

> 💡 如果想看詳細的互動式覆蓋率報告，請查看 \`coverage/index.html\`。
>
> 🔧 此報告由 [TestForge](https://github.com/JeffLin0225/testforge) 自動產生。
`;

  return report;
}

// ============================================================
// 產生 PR Comment — testforge-pr-comment.md
// ============================================================
function generatePRComment() {
  const statusEmoji = summary.failedTests === 0 ? '✅' : '❌';
  const coverageEmoji = summary.thresholdMet ? '✅' : '⚠️';

  let comment = `## ${statusEmoji} TestForge 測試報告

| 指標 | 結果 |
| --- | --- |
| 🧪 測試 | ${summary.passedTests} / ${summary.totalTests} 通過 |
| 📊 覆蓋率 | ${overallCoverage}% ${coverageEmoji} |
| 📏 門檻 | ${threshold}% |

`;

  if (summary.failedTests > 0) {
    comment += `### ❌ 失敗的測試（${summary.failedTests} 個）\n\n`;

    if (testData?.testResults) {
      for (const file of testData.testResults) {
        const failed = file.assertionResults?.filter(r => r.status === 'failed') || [];
        for (const f of failed.slice(0, 10)) {
          comment += `- \`${f.fullName || f.title}\`\n`;
        }
      }
    }
    comment += '\n';
  }

  comment += `<details>
<summary>📊 覆蓋率明細</summary>

| 類別 | 覆蓋率 |
| --- | --- |
| Statements | ${summary.coverage.statements}% |
| Branches | ${summary.coverage.branches}% |
| Functions | ${summary.coverage.functions}% |
| Lines | ${summary.coverage.lines}% |

</details>

---
🔧 由 [TestForge](https://github.com/JeffLin0225/testforge) 自動產生
`;

  return comment;
}

// ============================================================
// 寫入檔案 & 設定 GitHub Actions outputs
// ============================================================

// 寫入完整報告
const fullReport = generateFullReport();
fs.writeFileSync(path.join(absProjectPath, 'TestForge-Report.md'), fullReport, 'utf-8');
console.log('✅ 已產生 TestForge-Report.md');

// 寫入 PR Comment
const prComment = generatePRComment();
fs.writeFileSync(path.join(absProjectPath, 'testforge-pr-comment.md'), prComment, 'utf-8');
console.log('✅ 已產生 testforge-pr-comment.md');

// 同步更新舊的報告檔（向下相容）
const testforgeRoot = path.resolve(__dirname, '..');
const unitTestReportPath = path.join(testforgeRoot, 'UnitTest-Report.md');
const coverageReportPath = path.join(testforgeRoot, 'Coverage-Report.md');

// 只有在 TestForge repo 內才更新這些舊報告
if (fs.existsSync(path.join(testforgeRoot, 'testforge.js'))) {
  // UnitTest-Report.md
  if (testData) {
    const unitReport = `# 單元測試報告 (Unit Test Report)

![Tests](https://img.shields.io/badge/Tests-${summary.passedTests}_Passed-${testColor})

這個檔案是由自動化腳本產生的最新單元測試報告。
當你執行 \`npm run test\` 後，此檔案會自動更新。

## 測試總覽 (Test Overview)
- **總測試數**: ${summary.totalTests}
- **通過**: ✅ ${summary.passedTests}
- **失敗**: ❌ ${summary.failedTests}

## 測試檔案結果
| 檔案名稱 | 狀態 | 通過/總數 |
| --- | --- | --- |
${testData.testResults.map(file => {
      const fileTotal = file.assertionResults.length;
      const filePassed = file.assertionResults.filter(r => r.status === 'passed').length;
      const statusIcon = file.status === 'passed' ? '✅' : '❌';
      return `| \`${path.basename(file.name)}\` | ${statusIcon} | ${filePassed} / ${fileTotal} |`;
    }).join('\n')}

`;
    fs.writeFileSync(unitTestReportPath, unitReport, 'utf-8');
    console.log('✅ 已更新 UnitTest-Report.md');
  }

  // Coverage-Report.md
  if (coverageData) {
    const covReport = `# 測試覆蓋率報告 (Test Coverage)

![Coverage](https://img.shields.io/badge/Coverage-${overallCoverage}%25-${coverageColor})

這個檔案是由自動化腳本產生的最新測試覆蓋率報告。
當你執行 \`npm run test:coverage\` 後，此檔案會自動更新。

## 覆蓋率總覽 (Overall Coverage)
**整體覆蓋率：${overallCoverage}%**

| 類別 (Category) | 覆蓋率 (Coverage) |
| --- | --- |
| Statements | ${summary.coverage.statements}% |
| Branches | ${summary.coverage.branches}% |
| Functions | ${summary.coverage.functions}% |
| Lines | ${summary.coverage.lines}% |

> 💡 **提示**：如果想看詳細的互動式報告，請用瀏覽器開啟 \`coverage/index.html\`。
`;
    fs.writeFileSync(coverageReportPath, covReport, 'utf-8');
    console.log('✅ 已更新 Coverage-Report.md');
  }
}

// 設定 GitHub Actions outputs
if (process.env.GITHUB_OUTPUT) {
  const outputLines = [
    `test-total=${summary.totalTests}`,
    `test-passed=${summary.passedTests}`,
    `test-failed=${summary.failedTests}`,
    `coverage-percent=${overallCoverage}`,
  ];

  fs.appendFileSync(process.env.GITHUB_OUTPUT, outputLines.join('\n') + '\n');
  console.log('✅ 已設定 GitHub Actions outputs');
}

// 印出摘要
console.log('');
console.log('📊 測試摘要：');
console.log(`   🧪 測試：${summary.passedTests} / ${summary.totalTests} 通過`);
console.log(`   📊 覆蓋率：${overallCoverage}%`);
console.log(`   📏 門檻：${threshold}% ${summary.thresholdMet ? '✅ 達標' : '⚠️ 未達標'}`);
console.log('');
