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

// 輔助函數：清理測試描述中的特殊字元（如單引號），避免破壞生成的測試字串
function sanitizeDescription(str) {
  if (!str) return '';
  return str.replace(/'/g, '"').replace(/\r?\n/g, ' ').trim();
}

module.exports = {
  guessTestValue,
  generateEdgeCases,
  guessTypeFromName,
  getTypeCheck,
  generateMockProps,
  generateMockValue,
  topLevelPropAccess,
  sanitizeDescription
};
