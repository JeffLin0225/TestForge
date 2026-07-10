const fs = require('fs');
const path = require('path');

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

module.exports = {
  extractVueScript,
  analyzeVueComponent
};
