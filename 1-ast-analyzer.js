// ========================================
//  AST 分析器 — 用程式讀懂程式碼
// ========================================
//
//  AST = Abstract Syntax Tree（抽象語法樹）
//
//  想像你看到一段程式碼：
//    export function add(a, b) { return a + b; }
//
//  你的大腦會自動理解：
//    - 這是一個「匯出」的「函數」
//    - 名字叫「add」
//    - 有兩個參數「a」和「b」
//
//  AST 做的就是同樣的事，只是用程式來做！
//  它把程式碼轉成一棵樹狀結構：
//
//     ExportNamedDeclaration
//        └─ FunctionDeclaration
//             ├─ id: "add"
//             ├─ params: ["a", "b"]
//             └─ body: ReturnStatement
//                  └─ BinaryExpression: a + b
//
// ========================================

const acorn = require('acorn');    // JavaScript 的 AST 解析器
const walk = require('acorn-walk'); // 用來遍歷（走訪）AST 樹的工具
const fs = require('fs');
const path = require('path');

// -----------------------------------------
// 第一步：讀取原始碼
// -----------------------------------------
const filePath = path.join(__dirname, 'sample-code', 'utils.js');
const sourceCode = fs.readFileSync(filePath, 'utf-8');

console.log('📄 原始碼：');
console.log('='.repeat(60));
console.log(sourceCode);
console.log('='.repeat(60));
console.log('');

// -----------------------------------------
// 第二步：把原始碼解析成 AST
// -----------------------------------------
// acorn.parse() 就像翻譯官，把文字翻成樹狀結構
const ast = acorn.parse(sourceCode, {
  ecmaVersion: 2022,        // 支援最新的 JS 語法
  sourceType: 'module',      // 因為有用 import/export
});

// 讓你看看 AST 長什麼樣（只印前 3 個節點）
console.log('🌳 AST 結構（前 3 個頂層節點）：');
console.log('='.repeat(60));
ast.body.slice(0, 3).forEach((node, i) => {
  console.log(`\n節點 ${i + 1}: type = "${node.type}"`);
  if (node.type === 'ExportNamedDeclaration' && node.declaration) {
    const decl = node.declaration;
    console.log(`  └─ declaration.type = "${decl.type}"`);
    if (decl.id) console.log(`  └─ declaration.id.name = "${decl.id.name}"`);
    if (decl.params) {
      console.log(`  └─ params = [${decl.params.map(p => {
        if (p.type === 'AssignmentPattern') return `${p.left.name} (有預設值)`;
        return p.name;
      }).join(', ')}]`);
    }
    if (decl.async) console.log(`  └─ async = true`);
  }
});
console.log('\n' + '='.repeat(60));
console.log('');

// -----------------------------------------
// 第三步：遍歷 AST，找出所有 export 的函數
// -----------------------------------------
// 這就是真正厲害的部分！
// 我們「走訪」整棵樹，找到特定類型的節點

const exportedFunctions = [];

// 方法：直接遍歷頂層節點
ast.body.forEach(node => {
  // 只看 export 的宣告
  if (node.type !== 'ExportNamedDeclaration') return;
  if (!node.declaration) return;

  const decl = node.declaration;

  // 只看函數宣告
  if (decl.type !== 'FunctionDeclaration') return;

  // 提取函數資訊
  const funcInfo = {
    name: decl.id.name,
    params: decl.params.map(param => {
      // 處理有預設值的參數：function foo(x = 'default')
      if (param.type === 'AssignmentPattern') {
        return {
          name: param.left.name,
          hasDefault: true,
          // 嘗試取得預設值
          defaultValue: param.right.value !== undefined
            ? param.right.value
            : '(complex expression)',
        };
      }
      // 一般參數
      return {
        name: param.name,
        hasDefault: false,
      };
    }),
    isAsync: decl.async || false,
    // 提取函數上方的 JSDoc 註解
    comment: extractComment(decl.start),
  };

  exportedFunctions.push(funcInfo);
});

// 提取註解的輔助函數
function extractComment(position) {
  // 找到函數前面的 /** ... */ 註解
  const before = sourceCode.substring(0, position);
  const match = before.match(/\/\*\*\s*\n?\s*\*\s*(.+?)\s*\n?\s*\*\/\s*$/);
  return match ? match[1].trim() : null;
}

// -----------------------------------------
// 第四步：顯示分析結果
// -----------------------------------------
console.log('🔍 AST 分析結果 — 找到的 exported 函數：');
console.log('='.repeat(60));

exportedFunctions.forEach((fn, i) => {
  console.log(`\n${i + 1}. ${fn.isAsync ? 'async ' : ''}function ${fn.name}(${
    fn.params.map(p =>
      p.hasDefault ? `${p.name} = ${JSON.stringify(p.defaultValue)}` : p.name
    ).join(', ')
  })`);
  if (fn.comment) {
    console.log(`   📝 說明：${fn.comment}`);
  }
  console.log(`   📦 參數：${fn.params.length === 0 ? '無' : ''}`);
  fn.params.forEach(p => {
    console.log(`      - ${p.name}${p.hasDefault ? ` (預設值: ${JSON.stringify(p.defaultValue)})` : ''}`);
  });
});

console.log('\n⚠️  注意：internalHelper() 沒有被抓到，因為它沒有 export！');
console.log('='.repeat(60));
console.log('');

// -----------------------------------------
// 第五步：根據分析結果，自動產生 Vitest 測試！
// -----------------------------------------
console.log('');
console.log('🧪 自動產生的 Vitest 測試程式碼：');
console.log('='.repeat(60));

const testCode = generateVitestCode(exportedFunctions);
console.log(testCode);

// 存成檔案
const outputPath = path.join(__dirname, 'generated-tests', 'utils.test.js');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, testCode);
console.log(`\n✅ 測試檔案已存到: ${outputPath}`);

// -----------------------------------------
// 測試產生器
// -----------------------------------------
function generateVitestCode(functions) {
  // 根據參數名稱猜測合適的測試值
  function guessValue(param) {
    const name = param.name.toLowerCase();

    // 有預設值？直接用
    if (param.hasDefault && param.defaultValue !== '(complex expression)') {
      return JSON.stringify(param.defaultValue);
    }

    // 根據名稱猜
    if (/numbers?|nums?|arr|items|list/.test(name)) return '[1, 2, 3]';
    if (/amount|price|total|count|num|n|age/.test(name)) return '100';
    if (/email/.test(name)) return '"test@example.com"';
    if (/name|str|text|title/.test(name)) return '"test"';
    if (/id|userId|user_id/.test(name)) return '"user-123"';
    if (/flag|enabled|visible|active/.test(name)) return 'true';
    if (/callback|fn|handler/.test(name)) return '() => {}';
    if (/options?|config|settings/.test(name)) return '{}';

    // 常見的雙參數模式 (a, b) 通常是數字
    if (/^[a-b]$/.test(name)) return '1';

    return '"test"'; // 最終 fallback
  }

  // 產生邊界值測試
  function edgeCaseTests(fn) {
    const tests = [];

    fn.params.forEach(param => {
      const name = param.name.toLowerCase();

      if (/numbers?|arr|items|list/.test(name)) {
        tests.push(`
  it('${fn.name} — 空陣列不應崩潰', () => {
    expect(() => ${fn.name}([])).not.toThrow();
  });`);
      }

      if (/^[a-b]$/.test(name) || /amount|price|num|count/.test(name)) {
        tests.push(`
  it('${fn.name} — 傳入 0 不應崩潰', () => {
    expect(() => ${fn.name}(${fn.params.map(p =>
      p.name === param.name ? '0' : guessValue(p)
    ).join(', ')})).not.toThrow();
  });`);
        tests.push(`
  it('${fn.name} — 傳入負數不應崩潰', () => {
    expect(() => ${fn.name}(${fn.params.map(p =>
      p.name === param.name ? '-1' : guessValue(p)
    ).join(', ')})).not.toThrow();
  });`);
      }

      if (/email|name|str|text/.test(name)) {
        tests.push(`
  it('${fn.name} — 空字串不應崩潰', () => {
    expect(() => ${fn.name}(${fn.params.map(p =>
      p.name === param.name ? '""' : guessValue(p)
    ).join(', ')})).not.toThrow();
  });`);
      }
    });

    return tests.join('\n');
  }

  // 組裝完整的測試檔
  return `import { describe, it, expect } from 'vitest';
import { ${functions.map(f => f.name).join(', ')} } from '../sample-code/utils.js';

${functions.map(fn => `
// ${fn.comment ? `📝 ${fn.comment}` : `測試 ${fn.name}`}
describe('${fn.name}', () => {
  // --- 基本測試 ---
  it('應該是一個函數', () => {
    expect(typeof ${fn.name}).toBe('function');
  });

  it('正常呼叫不應拋出錯誤', ${fn.isAsync ? 'async ' : ''}() => {
    ${fn.isAsync ? '// 跳過非同步函數的簡單呼叫測試（需要 mock）' :
    `expect(() => ${fn.name}(${fn.params.map(p => guessValue(p)).join(', ')})).not.toThrow();`}
  });

  it('應該回傳值', ${fn.isAsync ? 'async ' : ''}() => {
    ${fn.isAsync ? '// 跳過非同步函數（需要 mock fetch）' :
    `const result = ${fn.name}(${fn.params.map(p => guessValue(p)).join(', ')});
    expect(result).toBeDefined();`}
  });

  // --- 邊界值測試 ---
${edgeCaseTests(fn)}
});
`).join('\n')}
`;
}
