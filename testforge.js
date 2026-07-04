#!/usr/bin/env node

// ============================================================
//  🔧 TestForge CLI — 自動掃描專案 & 產生測試案例
// ============================================================
//
//  用法：
//    node testforge.js <專案目錄>
//
//  範例：
//    node testforge.js ./sample-vue-project
//
//  它會做的事：
//    1. 遞迴掃描目錄中所有 .js / .ts / .vue 檔案
//    2. 用 AST 分析每個檔案，找出 export 的函數
//    3. 根據函數簽名自動產生 Vitest 測試
//    4. 輸出到 __generated_tests__/ 資料夾
//
// ============================================================

const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');

// ============================================================
// 設定
// ============================================================
const CONFIG = {
  // 要掃描的檔案類型
  extensions: ['.js', '.ts', '.jsx', '.tsx', '.vue'],
  // 要跳過的目錄
  ignoreDirs: ['node_modules', 'dist', '.git', '.nuxt', '.next', 'coverage', '__tests__', '__generated_tests__'],
  // 輸出目錄名稱
  outputDir: '__generated_tests__',
};

// ============================================================
// 主程式
// ============================================================
function main() {
  const targetDir = process.argv[2];

  if (!targetDir) {
    console.log('');
    console.log('  ❌ 請指定要掃描的專案目錄');
    console.log('');
    console.log('  用法：node testforge.js <專案目錄>');
    console.log('  範例：node testforge.js ./sample-vue-project');
    console.log('');
    process.exit(1);
  }

  const projectPath = path.resolve(targetDir);

  if (!fs.existsSync(projectPath)) {
    console.log(`\n  ❌ 目錄不存在：${projectPath}\n`);
    process.exit(1);
  }

  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║     🔧 TestForge — 自動測試案例產生器       ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`  📂 掃描目標：${projectPath}`);
  console.log('');

  // ---- Step 1：掃描檔案 ----
  console.log('  ── Step 1：掃描檔案 ──────────────────────────');
  const files = scanDirectory(projectPath);
  console.log(`  📋 找到 ${files.length} 個可分析的檔案：`);
  files.forEach(f => {
    const ext = path.extname(f);
    const icon = { '.ts': '🔷', '.js': '🟨', '.vue': '🟩', '.tsx': '🔷', '.jsx': '🟨' }[ext] || '📄';
    console.log(`     ${icon} ${path.relative(projectPath, f)}`);
  });
  console.log('');

  // ---- Step 2：AST 分析每個檔案 ----
  console.log('  ── Step 2：AST 分析 ─────────────────────────');
  const analysisResults = [];
  const vueComponentResults = [];
  let totalFunctions = 0;
  let totalComponents = 0;

  for (const filePath of files) {
    const result = analyzeFile(filePath);

    // Vue 元件額外分析 template
    if (result.isVueComponent) {
      const vueResult = analyzeVueComponent(filePath);
      if (vueResult) {
        vueComponentResults.push(vueResult);
        totalComponents++;
        console.log(`  🟩 ${path.relative(projectPath, filePath)}（Vue 元件）`);
        console.log(`     → Props：${vueResult.props.map(p => p.name).join(', ') || '無'}`);
        console.log(`     → Emits：${vueResult.emits.map(e => e.name).join(', ') || '無'}`);
        console.log(`     → 按鈕：${vueResult.buttons.length} 個，連結：${vueResult.links.length} 個，輸入框：${vueResult.inputs.length} 個`);
      }
    }

    if (result.functions.length > 0) {
      analysisResults.push(result);
      totalFunctions += result.functions.length;
      console.log(`  ✅ ${path.relative(projectPath, filePath)}`);
      console.log(`     → 找到 ${result.functions.length} 個 exported 函數：${result.functions.map(f => f.name).join(', ')}`);
    } else if (!result.isVueComponent) {
      console.log(`  ⏭️  ${path.relative(projectPath, filePath)} — 沒有找到 exported 函數（可能是設定檔）`);
    }
  }

  // ---- Step 3：產生測試 ----
  console.log('  ── Step 3：產生測試檔案 ──────────────────────');
  const outputBase = path.join(projectPath, CONFIG.outputDir);

  // 清空舊的產生檔案
  if (fs.existsSync(outputBase)) {
    fs.rmSync(outputBase, { recursive: true });
  }

  let generatedCount = 0;

  // 產生函數的單元測試（.ts / .js）
  for (const result of analysisResults) {
    const relativePath = path.relative(projectPath, result.filePath);
    const ext = path.extname(relativePath);

    // .vue 的 script 函數 → 輸出為 ComponentName.vue.unit.test.ts
    // .ts/.js → 輸出為 filename.test.ts
    const testRelative = relativePath
      .replace(/^src\//, '')
      .replace(/\.vue$/, '.vue.unit.test.ts')
      .replace(/\.ts$/, '.test.ts')
      .replace(/\.js$/, '.test.ts');

    const testPath = path.join(outputBase, testRelative);
    const testDir = path.dirname(testPath);

    // import 路徑：.vue 保留副檔名，.ts/.js 去掉
    let importPath = path.relative(testDir, result.filePath).replace(/\\/g, '/');
    if (ext !== '.vue') {
      importPath = importPath.replace(/\.(ts|js)$/, '');
    }
    if (!importPath.startsWith('.')) importPath = `./${importPath}`;

    const testCode = generateVitest(result, importPath);

    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testPath, testCode);

    generatedCount++;
    console.log(`  📝 ${testRelative}`);
  }

  // 產生 Vue 元件測試（template + props + emits + 互動）
  for (const vueResult of vueComponentResults) {
    const relativePath = path.relative(projectPath, vueResult.filePath);
    // 輸出到 components/ComponentName.vue.test.ts
    const testRelative = relativePath
      .replace(/^src\//, '')
      .replace(/\.vue$/, '.vue.test.ts');

    const testPath = path.join(outputBase, testRelative);
    const testDir = path.dirname(testPath);

    // import 路徑：.vue 保留副檔名
    let importPath = path.relative(testDir, vueResult.filePath).replace(/\\/g, '/');
    if (!importPath.startsWith('.')) importPath = `./${importPath}`;

    const testCode = generateVueComponentTest(vueResult, importPath);

    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testPath, testCode);

    generatedCount++;
    console.log(`  🟩 ${testRelative}  (Vue 元件測試)`);
  }

  console.log('');

  // ---- 統計摘要 ----
  console.log('  ═══════════════════════════════════════════════');
  console.log(`  ✅ 完成！共產生 ${generatedCount} 個測試檔案`);
  console.log(`  📁 輸出目錄：${path.relative(process.cwd(), outputBase)}/`);
  console.log(`  🧪 覆蓋 ${totalFunctions} 個 exported 函數`);
  console.log(`  🟩 覆蓋 ${totalComponents} 個 Vue 元件（template 互動測試）`);
  console.log('');
  console.log('  💡 下一步：');
  console.log('     1. npm install -D vitest @vue/test-utils');
  console.log(`     2. npx vitest run --root ${targetDir}`);
  console.log('  ═══════════════════════════════════════════════');
  console.log('');
}

// ============================================================
// 掃描器 — 遞迴找出所有要分析的檔案
// ============================================================
function scanDirectory(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // 跳過黑名單目錄
      if (entry.isDirectory()) {
        if (!CONFIG.ignoreDirs.includes(entry.name)) {
          walk(fullPath);
        }
        continue;
      }

      // 只看符合副檔名的檔案
      const ext = path.extname(entry.name);
      if (CONFIG.extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files.sort();
}

// ============================================================
// AST 分析器 — 解析單一檔案，提取 exported 函數
// ============================================================
function analyzeFile(filePath) {
  const ext = path.extname(filePath);
  let sourceCode = fs.readFileSync(filePath, 'utf-8');
  let isVueComponent = false;

  // .vue 檔案：先提取 <script> 區塊
  if (ext === '.vue') {
    isVueComponent = true;
    sourceCode = extractVueScript(sourceCode);
    if (!sourceCode) {
      return { filePath, functions: [], isVueComponent };
    }
  }

  // 用 Babel Parser 解析 AST
  // Babel Parser 支援 JS / TS / JSX / TSX，不用分開處理
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
    console.log(`  ⚠️  解析失敗：${path.basename(filePath)} — ${err.message}`);
    return { filePath, functions: [], isVueComponent };
  }

  // 遍歷 AST，提取 exported 函數
  const functions = [];

  for (const node of ast.program.body) {
    // ---- export function foo() {} ----
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      const decl = node.declaration;

      if (decl.type === 'FunctionDeclaration' && decl.id) {
        functions.push(extractFunctionInfo(decl, sourceCode));
      }

      // export const foo = () => {}
      // export const foo = function() {}
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

    // ---- export default function() {} ----
    if (node.type === 'ExportDefaultDeclaration') {
      const decl = node.declaration;
      if (decl.type === 'FunctionDeclaration') {
        functions.push(extractFunctionInfo(decl, sourceCode, decl.id?.name || 'default'));
      }
    }
  }

  return { filePath, functions, isVueComponent };
}

// ============================================================
// 提取函數資訊（名稱、參數、型別、是否 async）
// ============================================================
function extractFunctionInfo(funcNode, sourceCode, overrideName = null) {
  const info = {
    name: overrideName || funcNode.id?.name || 'anonymous',
    params: [],
    isAsync: funcNode.async || false,
    returnType: null,
    comment: null,
  };

  // 提取參數資訊
  for (const param of funcNode.params || []) {
    info.params.push(extractParamInfo(param));
  }

  // 提取 TypeScript 回傳型別
  if (funcNode.returnType?.typeAnnotation) {
    info.returnType = extractTypeName(funcNode.returnType.typeAnnotation);
  }

  // 提取 JSDoc 註解
  if (funcNode.leadingComments?.length > 0) {
    const lastComment = funcNode.leadingComments[funcNode.leadingComments.length - 1];
    if (lastComment.type === 'CommentBlock') {
      const match = lastComment.value.match(/\*\s*(.+?)(?:\n|\*\/)/);
      if (match) info.comment = match[1].trim();
    }
  }
  // Fallback：用 sourceCode 位置推斷
  if (!info.comment) {
    const before = sourceCode.substring(0, funcNode.start);
    const match = before.match(/\/\*\*\s*\n?\s*\*\s*(.+?)\s*\n?\s*\*\/\s*$/);
    if (match) info.comment = match[1].trim();
  }

  return info;
}

// ============================================================
// 提取參數資訊（支援 TS 型別、預設值、解構等）
// ============================================================
function extractParamInfo(param) {
  // 一般參數：function foo(a: number) {}
  if (param.type === 'Identifier') {
    return {
      name: param.name,
      type: param.typeAnnotation ? extractTypeName(param.typeAnnotation.typeAnnotation) : null,
      hasDefault: false,
      optional: param.optional || false,
    };
  }

  // 有預設值：function foo(a = 5) {}
  if (param.type === 'AssignmentPattern') {
    const inner = extractParamInfo(param.left);
    return {
      ...inner,
      hasDefault: true,
      defaultValue: extractDefaultValue(param.right),
    };
  }

  // 解構參數：function foo({ a, b }: Options) {}
  if (param.type === 'ObjectPattern') {
    return {
      name: '_obj',
      type: param.typeAnnotation ? extractTypeName(param.typeAnnotation.typeAnnotation) : 'object',
      hasDefault: false,
      isDestructured: true,
      properties: param.properties.map(p => p.key?.name || p.argument?.name).filter(Boolean),
    };
  }

  // 陣列解構：function foo([a, b]) {}
  if (param.type === 'ArrayPattern') {
    return {
      name: '_arr',
      type: 'array',
      hasDefault: false,
    };
  }

  // Rest 參數：function foo(...args) {}
  if (param.type === 'RestElement') {
    return {
      name: param.argument.name,
      type: 'rest',
      hasDefault: false,
    };
  }

  return { name: 'unknown', type: null, hasDefault: false };
}

// ============================================================
// TypeScript 型別名稱提取
// ============================================================
function extractTypeName(typeNode) {
  if (!typeNode) return null;

  const typeMap = {
    'TSNumberKeyword': 'number',
    'TSStringKeyword': 'string',
    'TSBooleanKeyword': 'boolean',
    'TSVoidKeyword': 'void',
    'TSAnyKeyword': 'any',
    'TSNullKeyword': 'null',
    'TSUndefinedKeyword': 'undefined',
    'TSNeverKeyword': 'never',
    'TSObjectKeyword': 'object',
  };

  if (typeMap[typeNode.type]) return typeMap[typeNode.type];

  // Promise<T>
  if (typeNode.type === 'TSTypeReference' && typeNode.typeName) {
    const name = typeNode.typeName.name || 
                 (typeNode.typeName.right?.name ? `${typeNode.typeName.left?.name}.${typeNode.typeName.right.name}` : null);
    if (name === 'Promise' && typeNode.typeParameters?.params?.[0]) {
      return `Promise<${extractTypeName(typeNode.typeParameters.params[0])}>`;
    }
    return name || 'unknown';
  }

  // Array<T> or T[]
  if (typeNode.type === 'TSArrayType') {
    return `${extractTypeName(typeNode.elementType)}[]`;
  }

  // { key: value }
  if (typeNode.type === 'TSTypeLiteral') {
    return 'object';
  }

  // Union: A | B
  if (typeNode.type === 'TSUnionType') {
    return typeNode.types.map(t => extractTypeName(t)).join(' | ');
  }

  return 'unknown';
}

// ============================================================
// 提取預設值
// ============================================================
function extractDefaultValue(node) {
  if (node.type === 'NumericLiteral') return node.value;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'BooleanLiteral') return node.value;
  if (node.type === 'ArrayExpression') return '[]';
  if (node.type === 'ObjectExpression') return '{}';
  return '(complex)';
}

// ============================================================
// Vue SFC <script> 提取器
// ============================================================
function extractVueScript(vueSource) {
  const scriptMatch = vueSource.match(
    /<script\b[^>]*>([\s\S]*?)<\/script>/
  );

  if (!scriptMatch) return null;
  return scriptMatch[1].trim();
}

// ============================================================
// Vue 元件完整分析器（template + script setup）
// ============================================================
function analyzeVueComponent(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');

  // ---- 提取 <template> ----
  const templateMatch = source.match(/<template>(\s*[\s\S]*?)\s*<\/template>/);
  const template = templateMatch ? templateMatch[1] : '';

  // ---- 提取 <script> ----
  const scriptMatch = source.match(/<script\b([^>]*)>([\s\S]*?)<\/script>/);
  const scriptAttrs = scriptMatch ? scriptMatch[1] : '';
  const scriptCode = scriptMatch ? scriptMatch[2].trim() : '';
  const isSetup = scriptAttrs.includes('setup');

  // ---- 分析 template 中的互動元素 ----
  const buttons = extractTemplateButtons(template);
  const links = extractTemplateLinks(template);
  const inputs = extractTemplateInputs(template);
  const textBindings = extractTextInterpolations(template);
  const conditionals = extractConditionals(template);

  // ---- 分析 script 中的 defineProps / defineEmits ----
  const props = extractDefineProps(scriptCode);
  const emits = extractDefineEmits(scriptCode);
  const componentName = path.basename(filePath, '.vue');
  const hasForm = template.includes('<form');

  return {
    filePath,
    componentName,
    isSetup,
    props,
    emits,
    buttons,
    links,
    inputs,
    textBindings,
    conditionals,
    hasForm,
  };
}

// ---- Template 解析輔助函數 ----

function extractTemplateButtons(template) {
  const buttons = [];
  // 匹配 <button ...>文字</button>
  const btnRegex = /<button([^>]*)>([\s\S]*?)<\/button>/g;
  let match;
  while ((match = btnRegex.exec(template)) !== null) {
    const attrs = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    const clickMatch = attrs.match(/@click="([^"]+)"/) || attrs.match(/@click='([^']+)'/);
    const classMatch = attrs.match(/class="([^"]+)"/);
    buttons.push({
      text,
      clickHandler: clickMatch ? clickMatch[1] : null,
      classes: classMatch ? classMatch[1].split(/\s+/) : [],
      emitsEvent: clickMatch ? extractEmitFromHandler(clickMatch[1]) : null,
    });
  }
  return buttons;
}

function extractTemplateLinks(template) {
  const links = [];
  const linkRegex = /<a([^>]*)>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = linkRegex.exec(template)) !== null) {
    const attrs = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    const hrefMatch = attrs.match(/:?href="([^"]+)"/);
    links.push({
      text,
      href: hrefMatch ? hrefMatch[1] : null,
      isDynamic: hrefMatch ? hrefMatch[0].startsWith(':') : false,
    });
  }
  return links;
}

function extractTemplateInputs(template) {
  const inputs = [];
  // <input> 標籤
  const inputRegex = /<input([^>]*)\/?>/g;
  let match;
  while ((match = inputRegex.exec(template)) !== null) {
    const attrs = match[1];
    const typeMatch = attrs.match(/type="([^"]+)"/);
    const modelMatch = attrs.match(/v-model="([^"]+)"/);
    const placeholderMatch = attrs.match(/placeholder="([^"]+)"/);
    const idMatch = attrs.match(/id="([^"]+)"/) || attrs.match(/id='([^']+)'/);
    inputs.push({
      id: idMatch ? idMatch[1] : null,
      type: typeMatch ? typeMatch[1] : 'text',
      vModel: modelMatch ? modelMatch[1] : null,
      placeholder: placeholderMatch ? placeholderMatch[1] : null,
      tag: 'input',
    });
  }
  // <textarea> 標籤
  const textareaRegex = /<textarea([^>]*)>[\s\S]*?<\/textarea>/g;
  while ((match = textareaRegex.exec(template)) !== null) {
    const attrs = match[1];
    const modelMatch = attrs.match(/v-model="([^"]+)"/);
    const idMatch = attrs.match(/id="([^"]+)"/) || attrs.match(/id='([^']+)'/);
    inputs.push({
      id: idMatch ? idMatch[1] : null,
      type: 'textarea',
      vModel: modelMatch ? modelMatch[1] : null,
      tag: 'textarea',
    });
  }
  // <select> 標籤
  const selectRegex = /<select([^>]*)>[\s\S]*?<\/select>/g;
  while ((match = selectRegex.exec(template)) !== null) {
    const attrs = match[1];
    const modelMatch = attrs.match(/v-model="([^"]+)"/);
    const idMatch = attrs.match(/id="([^"]+)"/) || attrs.match(/id='([^']+)'/);
    inputs.push({
      id: idMatch ? idMatch[1] : null,
      type: 'select',
      vModel: modelMatch ? modelMatch[1] : null,
      tag: 'select',
    });
  }
  return inputs;
}

function extractTextInterpolations(template) {
  const bindings = [];
  const regex = /\{\{\s*([^}]+)\s*\}\}/g;
  let match;
  while ((match = regex.exec(template)) !== null) {
    bindings.push(match[1].trim());
  }
  return bindings;
}

function extractConditionals(template) {
  const conditionals = [];
  const regex = /v-(?:if|show)="([^"]+)"/g;
  let match;
  while ((match = regex.exec(template)) !== null) {
    conditionals.push(match[1]);
  }
  return conditionals;
}

function extractEmitFromHandler(handler) {
  // $emit('eventName', ...) → eventName
  const match = handler.match(/\$emit\(['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

// ---- Script 解析：defineProps ----
function extractDefineProps(scriptCode) {
  const props = [];

  // 方式 1：defineProps<{ name: type }>()（TypeScript 泛型）
  const genericMatch = scriptCode.match(/defineProps<\{([\s\S]*?)\}>\(/);
  if (genericMatch) {
    const propsBlock = genericMatch[1];
    // 解析每一行：name: Type 或 name?: Type
    const propRegex = /(\w+)(\?)?\s*:\s*([^;\n,]+)/g;
    let match;
    while ((match = propRegex.exec(propsBlock)) !== null) {
      props.push({
        name: match[1],
        optional: !!match[2],
        type: match[3].trim(),
      });
    }
    return props;
  }

  // 方式 2：defineProps({ name: { type: String, required: true } })
  const objMatch = scriptCode.match(/defineProps\(\{([\s\S]*?)\}\)/);
  if (objMatch) {
    const propsBlock = objMatch[1];
    const propRegex = /(\w+)\s*:\s*\{([^}]*)\}/g;
    let match;
    while ((match = propRegex.exec(propsBlock)) !== null) {
      const propName = match[1];
      const propConfig = match[2];
      const typeMatch = propConfig.match(/type\s*:\s*(\w+)/);
      const requiredMatch = propConfig.match(/required\s*:\s*(true|false)/);
      props.push({
        name: propName,
        optional: requiredMatch ? requiredMatch[1] !== 'true' : true,
        type: typeMatch ? typeMatch[1].toLowerCase() : 'any',
      });
    }
  }

  return props;
}

// ---- Script 解析：defineEmits ----
function extractDefineEmits(scriptCode) {
  const emits = [];

  // 方式 1：defineEmits<{ eventName: [payload: Type] }>()（TS 泛型）
  const genericMatch = scriptCode.match(/defineEmits<\{([\s\S]*?)\}>\(/);
  if (genericMatch) {
    const emitsBlock = genericMatch[1];
    const emitRegex = /(\w+)\s*:\s*\[([^\]]*)\]/g;
    let match;
    while ((match = emitRegex.exec(emitsBlock)) !== null) {
      const params = match[2].split(',').map(p => {
        const parts = p.trim().split(':');
        return {
          name: parts[0]?.trim(),
          type: parts[1]?.trim() || 'any',
        };
      }).filter(p => p.name);
      emits.push({
        name: match[1],
        params,
      });
    }
    return emits;
  }

  // 方式 2：defineEmits(['event1', 'event2'])
  const arrMatch = scriptCode.match(/defineEmits\(\[([^\]]*)\]\)/);
  if (arrMatch) {
    const names = arrMatch[1].match(/['"]([^'"]+)['"]/g);
    if (names) {
      names.forEach(n => {
        emits.push({ name: n.replace(/['"]/g, ''), params: [] });
      });
    }
  }

  return emits;
}

// 輔助函數：清理測試描述中的特殊字元（如單引號），避免破壞生成的測試字串
function sanitizeDescription(str) {
  if (!str) return '';
  return str.replace(/'/g, '"').replace(/\r?\n/g, ' ').trim();
}

// ============================================================
// Vue 元件測試產生器（使用 @vue/test-utils）
// ============================================================
function generateVueComponentTest(vueResult, importPath) {
  const { componentName, props, emits, buttons, links, inputs, textBindings, conditionals } = vueResult;

  // 產生 mock props 資料
  const mockProps = generateMockProps(props);
  const mockPropsStr = JSON.stringify(mockProps, null, 4).replace(/"/g, "'");

  let code = `// ============================================
// 🟩 自動產生的 Vue 元件測試 — by TestForge
// 來源：${componentName}.vue
// 產生時間：${new Date().toISOString()}
// ============================================
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ${componentName} from '${importPath}';

// Mock Props 資料
const defaultProps = ${mockPropsStr};

// 輔助函數：快速掛載元件
function mountComponent(overrideProps = {}) {
  return mount(${componentName}, {
    props: { ...defaultProps, ...overrideProps },
  });
}

describe('${componentName}.vue', () => {
`;

  // ---- 基本掛載測試 ----
  code += `  // ===== 基本掛載 =====
  it('應該能正常掛載', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it('掛載後不應有 console 錯誤', () => {
    expect(() => mountComponent()).not.toThrow();
  });

`;

  // ---- Props 渲染測試 ----
  if (props.length > 0) {
    code += `  // ===== Props 渲染 =====\n`;

    // 檢查 props 的值是否出現在渲染結果中
    for (const prop of props) {
      if (['string', 'String'].includes(prop.type)) {
        const isUsedInText = textBindings.some(binding => binding.includes(prop.name));
        if (isUsedInText) {
          code += `  it('應該渲染 prop: ${prop.name}', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain(String(defaultProps.${topLevelPropAccess(prop, props)}));
  });

`;
        }
      }
    }

    // 測試物件類型的 props 的子屬性
    for (const prop of props) {
      if (/^[A-Z]/.test(prop.type) || prop.type === 'object') {
        const mock = mockProps[prop.name];
        if (mock && typeof mock === 'object') {
          for (const [key, val] of Object.entries(mock)) {
            if (typeof val === 'string') {
              const bindingName = `${prop.name}.${key}`;
              const isUsedInText = textBindings.some(binding => binding.includes(bindingName));
              if (isUsedInText) {
                code += `  it('應該渲染 ${prop.name}.${key}', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('${val}');
  });

`;
              }
            }
          }
        }
      }
    }
  }

  // ---- 按鈕測試 ----
  if (buttons.length > 0) {
    code += `  // ===== 按鈕互動 =====\n`;
    buttons.forEach((btn, i) => {
      const selector = btn.classes.includes('danger')
        ? `'button.danger'`
        : `wrapper.findAll('button').at(${i})`;
      const findCode = btn.classes.includes('danger')
        ? `wrapper.find(${selector})`
        : selector;

      const btnDesc = sanitizeDescription(btn.text) || '按鈕' + (i+1);

      // 按鈕存在
      code += `  it('按鈕「${btnDesc}」應該存在', () => {
    const wrapper = mountComponent();
    const button = ${findCode};
    expect(button.exists()).toBe(true);
  });

`;

      // 如果按鈕觸發 emit
      if (btn.emitsEvent) {
        code += `  it('點擊「${btnDesc}」應觸發 ${btn.emitsEvent} 事件', async () => {
    const wrapper = mountComponent();
    const button = ${findCode};
    await button.trigger('click');
    expect(wrapper.emitted('${btn.emitsEvent}')).toBeTruthy();
    expect(wrapper.emitted('${btn.emitsEvent}')).toHaveLength(1);
  });

`;
      } else if (btn.clickHandler) {
        code += `  it('點擊「${btnDesc}」不應崩潰', async () => {
    const wrapper = mountComponent();
    const button = ${findCode};
    await button.trigger('click');
    expect(wrapper.exists()).toBe(true);
  });

`;
      }
    });
  }

  // ---- 覆蓋 Vue 元件的 properties / config
  const hasForm = vueResult.hasForm;

  // ---- 輸入框測試 ----
  if (inputs.length > 0) {
    code += `  // ===== 表單輸入 =====\n`;
    inputs.forEach((input, i) => {
      const selector = input.id 
        ? `'#${input.id}'` 
        : (input.tag === 'input' 
            ? (input.type !== 'text' ? `'input[type="${input.type}"]'` : `'input'`)
            : `'${input.tag}'`);

      code += `  it('${input.tag} 元素應該存在', () => {
    const wrapper = mountComponent();
    expect(wrapper.find(${selector}).exists()).toBe(true);
  });

`;

      // v-model 雙向綁定測試
      if (input.vModel) {
        const testValue = input.type === 'checkbox' ? null : '"test input value"';
        if (testValue) {
          code += `  it('${input.tag} 應支援輸入（v-model: ${input.vModel}）', async () => {
    const wrapper = mountComponent();
    const el = wrapper.find(${selector});
    await el.setValue(${testValue});
    expect((el.element as HTMLInputElement).value).toBe(${testValue});
  });

`;
        }
      }
    });
  }

  // ---- 表單提交測試 ----
  if (hasForm && emits.some(e => e.name === 'submit')) {
    code += `  // ===== 表單提交 =====
  it('提交表單時應觸發 submit 事件', async () => {
    const wrapper = mountComponent();
`;
    inputs.forEach(input => {
      if (input.vModel) {
        const selector = input.id 
          ? `'#${input.id}'` 
          : (input.tag === 'input' 
              ? (input.type !== 'text' ? `'input[type="${input.type}"]'` : `'input'`)
              : `'${input.tag}'`);
        
        let testVal = '"test@example.com"'; // fallback
        if (input.type === 'email') testVal = '"test@example.com"';
        else if (input.type === 'password') testVal = '"password123"';
        else if (input.type === 'number') testVal = '42';
        else if (input.type === 'checkbox') testVal = 'true';
        else if (input.type === 'text') testVal = '"test text"';

        code += `    const el_${input.vModel} = wrapper.find(${selector});
    if (el_${input.vModel}.exists()) {
      await el_${input.vModel}.setValue(${testVal});
    }
`;
      }
    });

    code += `    const form = wrapper.find('form');
    expect(form.exists()).toBe(true);
    await form.trigger('submit');
    expect(wrapper.emitted('submit')).toBeTruthy();
  });

`;
  }

  // ---- Emit 事件測試 ----
  if (emits.length > 0) {
    code += `  // ===== 事件 Emits =====\n`;
    for (const emit of emits) {
      // 檢查對應按鈕是否存在
      const matchingBtn = buttons.find(b => b.emitsEvent === emit.name);
      const isTestedByForm = (emit.name === 'submit' && hasForm);
      if (!matchingBtn && !isTestedByForm) {
        code += `  it('元件應該定義 ${emit.name} 事件', () => {
    // 此事件在 defineEmits 中定義，但沒有在 template 中直接觸發
    // 可能由子元件或程式邏輯觸發
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

`;
      }
    }
  }

  // ---- 條件渲染測試 ----
  if (conditionals.length > 0) {
    code += `  // ===== 條件渲染 =====\n`;
    conditionals.forEach((cond, i) => {
      code += `  it('條件渲染 (${cond}) 不同值不應崩潰', () => {
    // v-if/v-show: ${cond}
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

`;
    });
  }

  // ---- Snapshot 測試 ----
  code += `  // ===== 快照測試 =====
  it('渲染結果應與快照一致', () => {
    const wrapper = mountComponent();
    expect(wrapper.html()).toMatchSnapshot();
  });
`;

  code += `});
`;

  return code;
}

// ============================================================
// 根據 Props 定義產生 Mock 資料
// ============================================================
function generateMockProps(props) {
  const mock = {};
  for (const prop of props) {
    mock[prop.name] = generateMockValue(prop.name, prop.type);
  }
  return mock;
}

function generateMockValue(name, type) {
  // 複合型別（interface 名稱）→ 根據名稱猜內容
  if (type && /^[A-Z]/.test(type)) {
    // 常見型別名稱
    const n = type.toLowerCase();
    if (n.includes('user')) {
      return { id: 'user-1', name: 'Test User', email: 'test@example.com', isActive: true, age: 25 };
    }
    if (n.includes('product') || n.includes('item')) {
      return { id: 'item-1', name: 'Test Product', price: 100, quantity: 1 };
    }
    if (n.includes('order')) {
      return { id: 'order-1', status: 'pending', total: 500 };
    }
    // 通用物件
    return { id: '1', name: 'Test' };
  }

  // 基本型別
  const typeMap = {
    'string': 'Test Value',
    'String': 'Test Value',
    'number': 42,
    'Number': 42,
    'boolean': true,
    'Boolean': true,
    'object': {},
    'Object': {},
  };

  if (typeMap[type] !== undefined) return typeMap[type];
  if (type?.includes('[]')) return [];

  // 根據 prop 名稱猜
  const nameMap = {
    title: 'Test Title',
    name: 'Test Name',
    label: 'Test Label',
    message: 'Test message',
    visible: true,
    show: true,
    disabled: false,
    loading: false,
    count: 5,
    size: 'medium',
    color: '#333',
    items: [],
    data: [],
    options: [],
  };

  return nameMap[name] || 'test';
}

function topLevelPropAccess(prop, allProps) {
  // 如果 prop 是物件型別，找到第一個 string 子屬性
  return prop.name;
}

// ============================================================
// 測試值推測器 — 根據參數名稱 & TypeScript 型別推測合適的測試值
// ============================================================
function guessTestValue(param) {
  const name = (param.name || '').toLowerCase();

  // ---- 優先看 TS 型別（最可靠） ----
  if (param.type) {
    if (param.type === 'number') {
      if (name.includes('price') || name.includes('amount') || name.includes('total')) return '99.99';
      if (name.includes('age')) return '25';
      if (name.includes('port')) return '8080';
      if (name.includes('page')) return '1';
      if (name.includes('limit')) return '10';
      return '42';
    }
    if (param.type === 'string') {
      if (name.includes('email')) return '"test@example.com"';
      if (name.includes('phone') || name.includes('mobile')) return '"0912345678"';
      if (name.includes('url') || name.includes('link')) return '"https://example.com"';
      if (name.includes('path')) return '"/test-path"';
      if (name.includes('password')) return '"Password123"';
      if (name.includes('ip')) return '"127.0.0.1"';
      if (name.includes('id')) return '"test-id"';
      return '"test"';
    }
    if (param.type === 'boolean') {
      if (name.includes('disabled') || name.includes('loading')) return 'false';
      return 'true';
    }
    if (param.type === 'object') {
      if (name.includes('params') || name.includes('query')) return '{ q: "query", page: 1 }';
      return '{ key: "value" }';
    }
    if (param.type === 'any') {
      if (name.includes('email')) return '"test@example.com"';
      return '"test"';
    }
    if (param.type === 'void') return 'undefined';
    if (param.type === 'Date') return 'new Date()';
    if (param.type.endsWith('[]')) {
      if (name.includes('number')) return '[1, 2, 3]';
      if (name.includes('string') || name.includes('tag')) return '["a", "b"]';
      return '[{ id: "1" }]';
    }
    if (param.type.startsWith('Record')) {
      return '{ q: "query", page: 1 }';
    }
    // 自訂型別（首字母大寫，如 User, CartItem 等）
    if (/^[A-Z]/.test(param.type)) {
      const typeNameLower = param.type.toLowerCase();
      if (typeNameLower.includes('user')) {
        return '{ id: "1", name: "Test User", email: "test@example.com" }';
      }
      if (typeNameLower.includes('item') || typeNameLower.includes('product')) {
        return '{ id: "1", name: "Test Product", price: 100, quantity: 1 }';
      }
      if (typeNameLower.includes('cart')) {
        return '{ items: [] }';
      }
      return '{ id: "1" }';
    }
  }

  // ---- 有預設值？直接用 ----
  if (param.hasDefault && param.defaultValue !== '(complex)') {
    if (typeof param.defaultValue === 'string') return `"${param.defaultValue}"`;
    return String(param.defaultValue);
  }

  // ---- 解構參數 ----
  if (param.isDestructured) return '{ key: "value" }';

  // ---- 根據參數名稱猜 ----
  const nameMap = {
    // 數字類
    amount: '100', price: '99.99', total: '500', count: '5', num: '42',
    age: '25', index: '0', size: '10', width: '100', height: '100',
    id: '"1"', limit: '10', page: '1', offset: '0',
    value: '42', threshold: '100', percent: '50',
    decimals: '2', quantity: '1',
    a: '1', b: '2', n: '1', x: '1', y: '2',
    // 字串類
    name: '"Test User"', email: '"test@example.com"', 
    phone: '"0912345678"', password: '"TestPass123"',
    text: '"Hello World"', title: '"Test Title"',
    url: '"https://example.com"', path: '"/test"',
    query: '"test"', search: '"keyword"',
    message: '"test message"', description: '"test desc"',
    key: '"test-key"', token: '"test-token"',
    currency: '"NT$"', code: '"ABC"', status: '"active"',
    address: '"台北市信義區"',
    // 布林類
    flag: 'true', enabled: 'true', visible: 'true', active: 'true',
    // 陣列類
    items: '[{ id: "1", name: "item" }]', list: '[1, 2, 3]', numbers: '[1, 2, 3]', arr: '[1, 2, 3]', array: '[1, 2, 3]',
    data: '[{ id: "1" }]', users: '[{ id: "1", name: "user" }]', options: '[{ label: "Option 1", value: "1" }]', tags: '["tag1", "tag2"]',
    // 物件類
    config: '{ debug: true }', settings: '{ theme: "dark" }', params: '{ q: "query", page: 1 }', props: '{ visible: true }',
    // 函數類
    callback: '() => {}', fn: '() => {}', handler: '() => {}',
    // 日期類
    date: 'new Date()', startDate: 'new Date()', endDate: 'new Date()',
    // 特殊
    item: '{ id: "1", name: "test", price: 100, quantity: 1 }',
  };

  // 精確匹配
  if (nameMap[name]) return nameMap[name];

  // 模糊匹配（包含關鍵字）
  for (const [keyword, value] of Object.entries(nameMap)) {
    if (name.includes(keyword)) return value;
  }

  // 終極 fallback
  return '"test"';
}

// ============================================================
// Vitest 測試產生器
// ============================================================
function generateVitest(fileResult, importPath) {
  const { functions, isVueComponent } = fileResult;
  const syncFns = functions.filter(f => !f.isAsync);
  const asyncFns = functions.filter(f => f.isAsync);

  // import 語句
  const allNames = functions.map(f => f.name);
  const importStatement = `import { ${allNames.join(', ')} } from '${importPath}';`;

  let code = `// ============================================
// 🧪 自動產生的測試 — by TestForge
// 來源：${path.basename(fileResult.filePath)}
// 產生時間：${new Date().toISOString()}
// ============================================
import { describe, it, expect${asyncFns.length > 0 ? ', vi' : ''} } from 'vitest';
${importStatement}
`;

  // 每個函數產生一個 describe block
  for (const fn of functions) {
    const paramValues = fn.params.map(p => guessTestValue(p)).join(', ');
    const isAsync = fn.isAsync;
    const asyncPrefix = isAsync ? 'async ' : '';

    code += `
// ${fn.comment ? `📝 ${fn.comment}` : `測試 ${fn.name}`}
describe('${fn.name}', () => {
`;

    // ---- 基本存在性與簽名測試 ----
    code += `  it('應該是一個函數', () => {
    expect(typeof ${fn.name}).toBe('function');
  });
`;

    // 計算 JavaScript 實際的 Function.length（遇到第一個有預設值或 rest 參數前停止）
    let expectedLength = 0;
    for (const p of fn.params) {
      if (p.hasDefault || p.type === 'rest') break;
      expectedLength++;
    }

    code += `  it('預期接收 ${expectedLength} 個必填參數 (Function.length)', () => {
    expect(${fn.name}.length).toBe(${expectedLength});
  });
`;

    // ---- 呼叫測試 ----
    if (isAsync) {
      code += `
  it('呼叫時應回傳 Promise', () => {
    // async 函數需要 mock 外部依賴才能正確測試
    // 這裡只驗證它回傳 Promise
    const result = ${fn.name}(${paramValues});
    expect(result).toBeInstanceOf(Promise);
    // 避免未處理的 Promise 拒絕導致測試警告或失敗
    result.catch(() => {});
  });
`;
    } else {
      code += `
  it('正常呼叫不應拋出錯誤', () => {
    expect(() => ${fn.name}(${paramValues})).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = ${fn.name}(${paramValues});
    expect(result).toBeDefined();
  });
`;

      // ---- 回傳型別測試（如果知道型別） ----
      if (fn.returnType && !fn.returnType.startsWith('Promise')) {
        const typeCheck = getTypeCheck(fn.returnType);
        if (typeCheck) {
          code += `
  it('回傳型別應為 ${fn.returnType}', () => {
    const result = ${fn.name}(${paramValues});
    ${typeCheck}
  });
`;
        }
      }
    }

    // ---- Snapshot 測試（非 async） ----
    if (!isAsync) {
      code += `
  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = ${fn.name}(${paramValues});
    expect(result).toMatchSnapshot();
  });
`;
    }

    // ---- 邊界值測試 ----
    const edgeCases = generateEdgeCases(fn);
    if (edgeCases.length > 0) {
      code += `
  // --- 邊界值測試 ---
${edgeCases.join('\n')}
`;
    }

    // ---- 可選參數測試 ----
    const optionalParams = fn.params.filter(p => p.hasDefault || p.optional);
    if (optionalParams.length > 0 && !isAsync) {
      const requiredOnly = fn.params
        .filter(p => !p.hasDefault && !p.optional)
        .map(p => guessTestValue(p))
        .join(', ');

      code += `
  it('只傳必填參數也不應崩潰', () => {
    expect(() => ${fn.name}(${requiredOnly})).not.toThrow();
  });
`;
    }

    code += `});\n`;
  }

  return code;
}

// ============================================================
// 產生邊界值測試
// ============================================================
function generateEdgeCases(fn) {
  const tests = [];
  if (fn.isAsync) return tests; // async 函數跳過

  fn.params.forEach((param, paramIndex) => {
    const type = param.type || guessTypeFromName(param.name);
    const otherParams = fn.params.map((p, i) => i === paramIndex ? null : guessTestValue(p));

    function makeCall(testVal) {
      const args = [...otherParams];
      args[paramIndex] = testVal;
      return args.join(', ');
    }

    // 數字邊界值與型別測試
    if (type === 'number') {
      tests.push(`  it('${param.name} 為 0 時不應崩潰', () => {
    expect(() => ${fn.name}(${makeCall('0')})).not.toThrow();
  });`);
      tests.push(`  it('${param.name} 為負數時不應崩潰', () => {
    expect(() => ${fn.name}(${makeCall('-1')})).not.toThrow();
  });`);
      tests.push(`  it('${param.name} 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      ${fn.name}(${makeCall('"invalid_string" as any')});
    } catch (e) {
      expect(e).toBeDefined();
    }
  });`);
    }

    // 字串邊界值與型別測試
    if (type === 'string') {
      tests.push(`  it('${param.name} 為空字串時不應崩潰', () => {
    expect(() => ${fn.name}(${makeCall('""')})).not.toThrow();
  });`);
      tests.push(`  it('${param.name} 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      ${fn.name}(${makeCall('123 as any')});
    } catch (e) {
      expect(e).toBeDefined();
    }
  });`);
    }

    // 陣列邊界值與型別測試
    if (type?.includes('[]') || type === 'array') {
      tests.push(`  it('${param.name} 為空陣列時不應崩潰', () => {
    expect(() => ${fn.name}(${makeCall('[]')})).not.toThrow();
  });`);
      tests.push(`  it('${param.name} 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      ${fn.name}(${makeCall('"not-an-array" as any')});
    } catch (e) {
      expect(e).toBeDefined();
    }
  });`);
    }

    // 布林值兩面與型別測試
    if (type === 'boolean') {
      tests.push(`  it('${param.name} 為 false 時不應崩潰', () => {
    expect(() => ${fn.name}(${makeCall('false')})).not.toThrow();
  });`);
      tests.push(`  it('${param.name} 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      ${fn.name}(${makeCall('"not-a-boolean" as any')});
    } catch (e) {
      expect(e).toBeDefined();
    }
  });`);
    }

    // 物件邊界值與型別測試
    if (type === 'object' || type?.startsWith('Record') || /^[A-Z]/.test(type)) {
      tests.push(`  it('${param.name} 為 null 時的容錯處理', () => {
    // 預期可能會拋錯，或是優雅處理（取決於實作）
    try {
      ${fn.name}(${makeCall('null as any')});
    } catch (e) {
      expect(e).toBeDefined();
    }
  });`);
      tests.push(`  it('${param.name} 為空物件 {} 時的行為', () => {
    try {
      ${fn.name}(${makeCall('{} as any')});
    } catch (e) {
      expect(e).toBeDefined();
    }
  });`);
      tests.push(`  it('${param.name} 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      ${fn.name}(${makeCall('123 as any')});
    } catch (e) {
      expect(e).toBeDefined();
    }
  });`);
    }
  });

  // 測試：缺少必填參數的呼叫
  const requiredParamsCount = fn.params.filter(p => !p.hasDefault && !p.optional).length;
  if (requiredParamsCount > 0) {
    tests.push(`  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (${fn.name} as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });`);
  }

  return tests;
}

// ============================================================
// 從參數名猜型別（沒有 TS 型別時的 fallback）
// ============================================================
function guessTypeFromName(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (/amount|price|total|count|num|age|size|width|height|index|id|limit|page/.test(n)) return 'number';
  if (/name|email|phone|text|title|url|path|query|message|password|code|address/.test(n)) return 'string';
  if (/flag|enabled|visible|active|is[A-Z]/.test(n)) return 'boolean';
  if (/items|list|numbers|arr|array|data|users|tags/.test(n)) return 'array';
  return null;
}

// ============================================================
// 根據 TS 回傳型別產生型別檢查
// ============================================================
function getTypeCheck(returnType) {
  switch (returnType) {
    case 'number':
      return `expect(typeof result).toBe('number');`;
    case 'string':
      return `expect(typeof result).toBe('string');`;
    case 'boolean':
      return `expect(typeof result).toBe('boolean');`;
    case 'void':
      return `expect(result).toBeUndefined();`;
    case 'object':
      return `expect(typeof result).toBe('object');`;
    default:
      if (returnType.endsWith('[]')) {
        return `expect(Array.isArray(result)).toBe(true);`;
      }
      return null;
  }
}

// ============================================================
// 啟動！
// ============================================================
main();
