// ========================================
//  OpenAPI → k6 測試腳本 自動產生器
// ========================================
//
//  什麼是 OpenAPI？
//  ────────────────
//  OpenAPI（以前叫 Swagger）是一種描述 API 的標準格式。
//  就像 API 的「說明書」，告訴你：
//    - 有哪些 endpoint（網址）
//    - 每個 endpoint 接受什麼參數
//    - 要用 GET / POST / PUT / DELETE
//    - 回傳什麼資料
//
//  很多後端框架可以自動產生這個檔案：
//    - Express + swagger-jsdoc
//    - FastAPI（Python，自動產生）
//    - Spring Boot + Springdoc
//    - NestJS + @nestjs/swagger
//
//  我們的做法：
//  ────────────
//  讀取 openapi.yaml → 解析出所有 API endpoint → 自動產生 k6 負載測試腳本
//
// ========================================

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// -----------------------------------------
// 第一步：讀取 & 解析 OpenAPI 文件
// -----------------------------------------
const specPath = path.join(__dirname, 'sample-code', 'openapi.yaml');
const spec = yaml.load(fs.readFileSync(specPath, 'utf-8'));

console.log('📄 OpenAPI 文件資訊：');
console.log('='.repeat(60));
console.log(`  API 名稱：${spec.info.title}`);
console.log(`  版本：${spec.info.version}`);
console.log(`  Base URL：${spec.servers[0].url}`);
console.log(`  描述：${spec.info.description}`);
console.log('='.repeat(60));
console.log('');

// -----------------------------------------
// 第二步：提取所有 API endpoint
// -----------------------------------------
const endpoints = [];

for (const [apiPath, methods] of Object.entries(spec.paths)) {
  for (const [method, details] of Object.entries(methods)) {
    // 只看 HTTP 方法
    if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;

    const endpoint = {
      method: method.toUpperCase(),
      path: apiPath,
      summary: details.summary || '',
      // 處理 path 參數（如 /users/{id}）
      pathParams: (details.parameters || [])
        .filter(p => p.in === 'path')
        .map(p => ({ name: p.name, type: p.schema?.type || 'string' })),
      // 處理 query 參數
      queryParams: (details.parameters || [])
        .filter(p => p.in === 'query')
        .map(p => ({
          name: p.name,
          type: p.schema?.type || 'string',
          default: p.schema?.default,
        })),
      // 處理 request body
      requestBody: extractBody(details.requestBody),
    };

    endpoints.push(endpoint);
  }
}

console.log('🔍 解析到的 API Endpoints：');
console.log('='.repeat(60));
endpoints.forEach((ep, i) => {
  console.log(`\n  ${i + 1}. ${ep.method.padEnd(6)} ${ep.path}`);
  console.log(`     📝 ${ep.summary}`);
  if (ep.pathParams.length > 0) {
    console.log(`     🔗 Path 參數：${ep.pathParams.map(p => p.name).join(', ')}`);
  }
  if (ep.queryParams.length > 0) {
    console.log(`     ❓ Query 參數：${ep.queryParams.map(p => `${p.name}${p.default !== undefined ? `=${p.default}` : ''}`).join(', ')}`);
  }
  if (ep.requestBody) {
    console.log(`     📦 Request Body：${JSON.stringify(ep.requestBody)}`);
  }
});
console.log('\n' + '='.repeat(60));

// -----------------------------------------
// 第三步：根據 schema 產生假資料
// -----------------------------------------
function extractBody(requestBody) {
  if (!requestBody) return null;

  const schema = requestBody.content?.['application/json']?.schema;
  if (!schema) return null;

  return generateFakeData(schema);
}

function generateFakeData(schema) {
  if (!schema) return null;

  switch (schema.type) {
    case 'object': {
      const obj = {};
      for (const [key, prop] of Object.entries(schema.properties || {})) {
        // 如果有 example，直接用
        if (prop.example !== undefined) {
          obj[key] = prop.example;
        } else {
          obj[key] = generateFakeData(prop);
        }
      }
      return obj;
    }

    case 'array':
      return [generateFakeData(schema.items)];

    case 'string':
      if (schema.format === 'email') return 'test@example.com';
      if (schema.format === 'date-time') return '2025-01-01T00:00:00Z';
      if (schema.enum) return schema.enum[0];
      return 'test_string';

    case 'integer':
      return schema.example || 1;

    case 'number':
      return schema.example || 1.0;

    case 'boolean':
      return true;

    default:
      return 'test';
  }
}

// -----------------------------------------
// 第四步：產生 k6 測試腳本！
// -----------------------------------------
console.log('');
console.log('');
console.log('⚡ 自動產生的 k6 負載測試腳本：');
console.log('='.repeat(60));

const k6Script = generateK6Script(endpoints, spec.servers[0].url);
console.log(k6Script);

// 存成檔案
const outputPath = path.join(__dirname, 'generated-tests', 'load-test.js');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, k6Script);
console.log(`\n✅ k6 測試腳本已存到: ${outputPath}`);
console.log(`\n💡 要實際執行，先安裝 k6 然後跑：`);
console.log(`   brew install k6`);
console.log(`   k6 run ${outputPath}`);

function generateK6Script(endpoints, baseUrl) {
  // 把動態路徑參數替換成假資料
  function resolvePath(ep) {
    let resolved = ep.path;
    ep.pathParams.forEach(p => {
      const fakeValue = p.type === 'integer' ? '1' : 'test-id-123';
      resolved = resolved.replace(`{${p.name}}`, fakeValue);
    });
    return resolved;
  }

  // 產生 query string
  function resolveQuery(ep) {
    if (ep.queryParams.length === 0) return '';
    const params = ep.queryParams
      .map(p => `${p.name}=${p.default || (p.type === 'integer' ? '1' : 'test')}`)
      .join('&');
    return `?${params}`;
  }

  // 分類 endpoints
  const gets = endpoints.filter(e => e.method === 'GET');
  const mutations = endpoints.filter(e => e.method !== 'GET');

  return `// ============================================
// 🚀 自動產生的 k6 負載測試腳本
// 來源：openapi.yaml
// 產生時間：${new Date().toISOString()}
// ============================================

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ---- 自訂監控指標 ----
const errorRate = new Rate('error_rate');          // 錯誤比率
const responseTime = new Trend('response_time');    // 回應時間趨勢
const requestCount = new Counter('request_count');  // 請求總數

// ---- 測試設定 ----
export const options = {
  // 場景設定：你可以根據需求選擇不同的場景
  scenarios: {
    // 🔥 煙霧測試：快速驗證 API 是否活著（1 個用戶跑 30 秒）
    smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
    },

    // 📈 負載測試：模擬正常流量（逐步增加到 20 個用戶）
    // 預設關閉，取消下面的註解來啟用
    // load_test: {
    //   executor: 'ramping-vus',
    //   startVUs: 0,
    //   stages: [
    //     { duration: '1m', target: 10 },   // 1 分鐘升到 10 用戶
    //     { duration: '3m', target: 20 },   // 維持 20 用戶 3 分鐘
    //     { duration: '1m', target: 0 },    // 1 分鐘降回 0
    //   ],
    // },

    // 💥 壓力測試：超過正常負載，找出系統極限
    // 預設關閉，取消下面的註解來啟用
    // stress_test: {
    //   executor: 'ramping-vus',
    //   startVUs: 0,
    //   stages: [
    //     { duration: '2m', target: 50 },
    //     { duration: '3m', target: 100 },
    //     { duration: '2m', target: 200 },
    //     { duration: '5m', target: 200 },  // 維持高負載
    //     { duration: '2m', target: 0 },
    //   ],
    // },
  },

  // ---- 通過/失敗的門檻 ----
  thresholds: {
    http_req_duration: [
      'p(95)<500',   // 95% 的請求要在 500ms 內完成
      'p(99)<1000',  // 99% 的請求要在 1 秒內完成
    ],
    error_rate: ['rate<0.05'],  // 錯誤率要低於 5%
  },
};

// ---- 基礎設定 ----
const BASE_URL = __ENV.BASE_URL || '${baseUrl}';

const HEADERS = {
  'Content-Type': 'application/json',
  // 如果需要認證，加在這裡：
  // 'Authorization': \`Bearer \${__ENV.API_TOKEN}\`,
};

// ============================================
// 主要測試函數 — k6 會重複執行這個函數
// ============================================
export default function () {

  // ---- GET 請求測試（讀取操作）----
${gets.map(ep => `
  group('${ep.method} ${ep.path} — ${ep.summary}', () => {
    const res = http.get(\`\${BASE_URL}${resolvePath(ep)}${resolveQuery(ep)}\`, {
      headers: HEADERS,
      tags: { endpoint: '${ep.path}' },
    });

    // 驗證回應
    const passed = check(res, {
      '✅ 狀態碼 200': (r) => r.status === 200,
      '⚡ 回應 < 500ms': (r) => r.timings.duration < 500,
      '📦 有回應內容': (r) => r.body && r.body.length > 0,
    });

    // 記錄指標
    errorRate.add(!passed);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  });
`).join('')}

  // ---- 寫入操作測試（POST/PUT/DELETE）----
${mutations.map(ep => `
  group('${ep.method} ${ep.path} — ${ep.summary}', () => {
    const res = http.${ep.method.toLowerCase()}(
      \`\${BASE_URL}${resolvePath(ep)}\`,
      ${ep.requestBody ? `JSON.stringify(${JSON.stringify(ep.requestBody, null, 6).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n')})` : 'null'},
      { headers: HEADERS, tags: { endpoint: '${ep.path}' } }
    );

    const passed = check(res, {
      '✅ 狀態碼 2xx': (r) => r.status >= 200 && r.status < 300,
      '⚡ 回應 < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!passed);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  });
`).join('')}

  // 模擬使用者思考時間（1~3 秒隨機）
  sleep(Math.random() * 2 + 1);
}

// ============================================
// 測試結束後的摘要報告
// ============================================
export function handleSummary(data) {
  // 印出漂亮的摘要
  const summary = {
    total_requests: data.metrics.request_count?.values?.count || 0,
    avg_response_time: data.metrics.response_time?.values?.avg?.toFixed(2) + 'ms',
    p95_response_time: data.metrics.response_time?.values?.['p(95)']?.toFixed(2) + 'ms',
    error_rate: ((data.metrics.error_rate?.values?.rate || 0) * 100).toFixed(2) + '%',
  };

  console.log('\\n📊 測試摘要：');
  console.log(JSON.stringify(summary, null, 2));

  return {
    'summary.json': JSON.stringify(data, null, 2),
  };
}
`;
}
