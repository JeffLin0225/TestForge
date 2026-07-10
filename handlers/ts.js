const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const { extractFunctionInfo } = require('../utils/ast-utils');
const { guessTestValue, generateEdgeCases, getTypeCheck } = require('../utils/test-utils');

function analyze(filePath) {
  let sourceCode = fs.readFileSync(filePath, 'utf-8');
  let ast;
  try {
    ast = babelParser.parse(sourceCode, {
      sourceType: 'module',
      plugins: [
        'typescript',          // 支援 TypeScript
        'jsx',                 // 支援 JSX/TSX
        'decorators-legacy',   // 支援 @Decorator
        'classProperties',     // 支援 class 屬性
        'optionalChaining',    // 支援 ?.
        'nullishCoalescingOperator', // 支援 ??
      ],
    });
  } catch (err) {
    console.log(`  ⚠️  TS 解析失敗：${path.basename(filePath)} — ${err.message}`);
    return { filePath, functions: [] };
  }

  const functions = [];

  for (const node of ast.program.body) {
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      const decl = node.declaration;

      if (decl.type === 'FunctionDeclaration' && decl.id) {
        functions.push(extractFunctionInfo(decl, sourceCode));
      }

      if (decl.type === 'VariableDeclaration') {
        for (const declarator of decl.declarations) {
          if (declarator.init && 
              (declarator.init.type === 'ArrowFunctionExpression' || 
               declarator.init.type === 'FunctionExpression')) {
            functions.push(extractFunctionInfo(declarator.init, sourceCode, declarator.id.name));
          }
        }
      }
    }

    if (node.type === 'ExportDefaultDeclaration') {
      const decl = node.declaration;
      if (decl.type === 'FunctionDeclaration') {
        functions.push(extractFunctionInfo(decl, sourceCode, decl.id?.name || 'default'));
      }
    }
  }

  return { filePath, functions };
}

function generate(result, importPath) {
  const { functions } = result;
  if (!functions || functions.length === 0) return '';

  const syncFns = functions.filter(f => !f.isAsync);
  const asyncFns = functions.filter(f => f.isAsync);

  const allNames = functions.map(f => f.name).filter(n => n !== 'default');
  
  let importStatement = '';
  if (allNames.length > 0) {
    importStatement = `import { ${allNames.join(', ')} } from '${importPath}';`;
  }
  
  const defaultFn = functions.find(f => f.name === 'default');
  if (defaultFn) {
    importStatement += `\nimport defaultFn from '${importPath}';`;
  }

  let code = `// ============================================
// 🧪 TS 自動產生的測試 — by TestForge
// 來源：${path.basename(result.filePath)}
// 產生時間：${new Date().toISOString()}
// ============================================
import { describe, it, expect${asyncFns.length > 0 ? ', vi' : ''} } from 'vitest';
${importStatement}
`;

  for (const fn of functions) {
    const paramValues = fn.params.map(p => guessTestValue(p)).join(', ');
    const isAsync = fn.isAsync;
    const fnNameToCall = fn.name === 'default' ? 'defaultFn' : fn.name;

    code += `
// ${fn.comment ? `📝 ${fn.comment}` : `測試 ${fnNameToCall}`}
describe('${fnNameToCall}', () => {
`;

    code += `  it('應該是一個函數', () => {
    expect(typeof ${fnNameToCall}).toBe('function');
  });
`;

    let expectedLength = 0;
    for (const p of fn.params) {
      if (p.hasDefault || p.type === 'rest') break;
      expectedLength++;
    }

    code += `  it('預期接收 ${expectedLength} 個必填參數 (Function.length)', () => {
    expect(${fnNameToCall}.length).toBe(${expectedLength});
  });
`;

    if (isAsync) {
      code += `
  it('呼叫時應回傳 Promise', () => {
    const result = ${fnNameToCall}(${paramValues});
    expect(result).toBeInstanceOf(Promise);
    result.catch(() => {});
  });
`;
    } else {
      code += `
  it('正常呼叫不應拋出錯誤', () => {
    expect(() => ${fnNameToCall}(${paramValues})).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = ${fnNameToCall}(${paramValues});
    expect(result).toBeDefined();
  });
`;

      if (fn.returnType && !fn.returnType.startsWith('Promise')) {
        const typeCheck = getTypeCheck(fn.returnType);
        if (typeCheck) {
          code += `
  it('回傳型別應為 ${fn.returnType}', () => {
    const result = ${fnNameToCall}(${paramValues});
    ${typeCheck}
  });
`;
        }
      }
    }

    if (!isAsync) {
      code += `
  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = ${fnNameToCall}(${paramValues});
    expect(result).toMatchSnapshot();
  });
`;
    }

    const edgeCases = generateEdgeCases({ ...fn, name: fnNameToCall });
    if (edgeCases.length > 0) {
      code += `
  // --- 邊界值測試 ---
${edgeCases.join('\n')}
`;
    }

    const optionalParams = fn.params.filter(p => p.hasDefault || p.optional);
    if (optionalParams.length > 0 && !isAsync) {
      const requiredOnly = fn.params
        .filter(p => !p.hasDefault && !p.optional)
        .map(p => guessTestValue(p))
        .join(', ');

      code += `
  it('只傳必填參數也不應崩潰', () => {
    expect(() => ${fnNameToCall}(${requiredOnly})).not.toThrow();
  });
`;
    }

    code += `});\n`;
  }

  return [{ suffix: '.test.ts', code }];
}

module.exports = { analyze, generate };
