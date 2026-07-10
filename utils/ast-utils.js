const babelParser = require('@babel/parser');

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

module.exports = {
  extractFunctionInfo,
  extractParamInfo,
  extractTypeName,
  extractDefaultValue
};
