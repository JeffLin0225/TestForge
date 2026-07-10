const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const { extractFunctionInfo } = require('../utils/ast-utils');
const { generateMockProps, topLevelPropAccess, sanitizeDescription } = require('../utils/test-utils');
const { analyzeVueComponent, extractVueScript } = require('../utils/vue-utils');

// 這裡我們需要使用跟 ts.js 一樣的 generateVitest 邏輯來產生 unit test
const tsHandler = require('./ts');

function analyze(filePath) {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Vue 元件特有分析 (template + setup)
  const vueResult = analyzeVueComponent(filePath);
  
  // 2. <script> 區塊的導出函數分析
  const scriptCode = extractVueScript(sourceCode);
  const functions = [];
  
  if (scriptCode) {
    try {
      const ast = babelParser.parse(scriptCode, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'optionalChaining',
          'nullishCoalescingOperator',
        ],
      });
      
      for (const node of ast.program.body) {
        if (node.type === 'ExportNamedDeclaration' && node.declaration) {
          const decl = node.declaration;
          if (decl.type === 'FunctionDeclaration' && decl.id) {
            functions.push(extractFunctionInfo(decl, scriptCode));
          }
          if (decl.type === 'VariableDeclaration') {
            for (const declarator of decl.declarations) {
              if (declarator.init && 
                  (declarator.init.type === 'ArrowFunctionExpression' || 
                   declarator.init.type === 'FunctionExpression')) {
                functions.push(extractFunctionInfo(declarator.init, scriptCode, declarator.id.name));
              }
            }
          }
        }
        if (node.type === 'ExportDefaultDeclaration') {
          const decl = node.declaration;
          if (decl.type === 'FunctionDeclaration') {
            functions.push(extractFunctionInfo(decl, scriptCode, decl.id?.name || 'default'));
          }
        }
      }
    } catch (err) {
      console.log(`  ⚠️  Vue Script 解析失敗：${path.basename(filePath)} — ${err.message}`);
    }
  }

  return {
    filePath,
    functions,      // 提供給 unit test
    ...vueResult,   // 提供給 component test
  };
}

function generate(result, importPath) {
  const generatedFiles = [];

  // 1. 產生函數的單元測試 (.vue.unit.test.ts)
  if (result.functions && result.functions.length > 0) {
    // 借用 tsHandler 的 generate 來產生 unit tests
    const unitGenerated = tsHandler.generate(result, importPath);
    if (unitGenerated && unitGenerated.length > 0 && unitGenerated[0].code) {
      generatedFiles.push({
        suffix: '.vue.unit.test.ts',
        code: unitGenerated[0].code
      });
    }
  }

  // 2. 產生 Vue 元件的掛載測試 (.vue.test.ts)
  const componentCode = generateVueComponentTest(result, importPath);
  if (componentCode) {
    generatedFiles.push({
      suffix: '.vue.test.ts',
      code: componentCode
    });
  }

  return generatedFiles;
}

// 產生 Vue Component 的掛載與互動測試
function generateVueComponentTest(vueResult, importPath) {
  const { componentName, props, emits, buttons, links, inputs, textBindings, conditionals } = vueResult;

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

  // 基本掛載測試
  code += `  // ===== 基本掛載 =====
  it('應該能正常掛載', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it('掛載後不應有 console 錯誤', () => {
    expect(() => mountComponent()).not.toThrow();
  });

`;

  // Props 渲染測試
  if (props.length > 0) {
    code += `  // ===== Props 渲染 =====\n`;
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

  // 按鈕測試
  if (buttons.length > 0) {
    code += `  // ===== 按鈕互動 =====\n`;
    buttons.forEach((btn, i) => {
      const selector = btn.classes.includes('danger') ? `'button.danger'` : `wrapper.findAll('button').at(${i})`;
      const findCode = btn.classes.includes('danger') ? `wrapper.find(${selector})` : selector;
      const btnDesc = sanitizeDescription(btn.text) || '按鈕' + (i+1);

      code += `  it('按鈕「${btnDesc}」應該存在', () => {
    const wrapper = mountComponent();
    const button = ${findCode};
    expect(button.exists()).toBe(true);
  });

`;

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

  const hasForm = vueResult.hasForm;

  // 輸入框測試
  if (inputs.length > 0) {
    code += `  // ===== 表單輸入 =====\n`;
    inputs.forEach((input, i) => {
      const selector = input.id ? `'#${input.id}'` : (input.tag === 'input' ? (input.type !== 'text' ? `'input[type="${input.type}"]'` : `'input'`) : `'${input.tag}'`);

      code += `  it('${input.tag} 元素應該存在', () => {
    const wrapper = mountComponent();
    expect(wrapper.find(${selector}).exists()).toBe(true);
  });

`;

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

  // 表單提交測試
  if (hasForm && emits.some(e => e.name === 'submit')) {
    code += `  // ===== 表單提交 =====
  it('提交表單時應觸發 submit 事件', async () => {
    const wrapper = mountComponent();
`;
    inputs.forEach(input => {
      if (input.vModel) {
        const selector = input.id ? `'#${input.id}'` : (input.tag === 'input' ? (input.type !== 'text' ? `'input[type="${input.type}"]'` : `'input'`) : `'${input.tag}'`);
        let testVal = '"test@example.com"';
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

  // Emit 事件測試
  if (emits.length > 0) {
    code += `  // ===== 事件 Emits =====\n`;
    for (const emit of emits) {
      const matchingBtn = buttons.find(b => b.emitsEvent === emit.name);
      const isTestedByForm = (emit.name === 'submit' && hasForm);
      if (!matchingBtn && !isTestedByForm) {
        code += `  it('元件應該定義 ${emit.name} 事件', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

`;
      }
    }
  }

  // 條件渲染測試
  if (conditionals.length > 0) {
    code += `  // ===== 條件渲染 =====\n`;
    conditionals.forEach((cond, i) => {
      code += `  it('條件渲染 (${cond}) 不同值不應崩潰', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

`;
    });
  }

  // 快照測試
  code += `  // ===== 快照測試 =====
  it('渲染結果應與快照一致', () => {
    const wrapper = mountComponent();
    expect(wrapper.html()).toMatchSnapshot();
  });
`;

  code += `});\n`;

  return code;
}

module.exports = { analyze, generate };
