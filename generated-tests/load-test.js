// ============================================
// 🚀 自動產生的 k6 負載測試腳本
// 來源：openapi.yaml
// 產生時間：2026-07-04T07:04:17.532Z
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
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const HEADERS = {
  'Content-Type': 'application/json',
  // 如果需要認證，加在這裡：
  // 'Authorization': `Bearer ${__ENV.API_TOKEN}`,
};

// ============================================
// 主要測試函數 — k6 會重複執行這個函數
// ============================================
export default function () {

  // ---- GET 請求測試（讀取操作）----

  group('GET /api/users — 取得所有使用者', () => {
    const res = http.get(`${BASE_URL}/api/users`, {
      headers: HEADERS,
      tags: { endpoint: '/api/users' },
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

  group('GET /api/users/{id} — 取得特定使用者', () => {
    const res = http.get(`${BASE_URL}/api/users/test-id-123`, {
      headers: HEADERS,
      tags: { endpoint: '/api/users/{id}' },
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

  group('GET /api/products — 取得商品列表', () => {
    const res = http.get(`${BASE_URL}/api/products?page=1&limit=20&category=test`, {
      headers: HEADERS,
      tags: { endpoint: '/api/products' },
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

  group('GET /api/products/{id} — 取得特定商品', () => {
    const res = http.get(`${BASE_URL}/api/products/test-id-123`, {
      headers: HEADERS,
      tags: { endpoint: '/api/products/{id}' },
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

  group('GET /api/orders/{id} — 取得訂單狀態', () => {
    const res = http.get(`${BASE_URL}/api/orders/test-id-123`, {
      headers: HEADERS,
      tags: { endpoint: '/api/orders/{id}' },
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

  group('GET /api/health — 伺服器健康檢查', () => {
    const res = http.get(`${BASE_URL}/api/health`, {
      headers: HEADERS,
      tags: { endpoint: '/api/health' },
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


  // ---- 寫入操作測試（POST/PUT/DELETE）----

  group('POST /api/users — 建立新使用者', () => {
    const res = http.post(
      `${BASE_URL}/api/users`,
      JSON.stringify({
            "name": "Jeff",
            "email": "jeff@example.com",
            "age": 28
      }),
      { headers: HEADERS, tags: { endpoint: '/api/users' } }
    );

    const passed = check(res, {
      '✅ 狀態碼 2xx': (r) => r.status >= 200 && r.status < 300,
      '⚡ 回應 < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!passed);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  });

  group('PUT /api/users/{id} — 更新使用者', () => {
    const res = http.put(
      `${BASE_URL}/api/users/test-id-123`,
      JSON.stringify({
            "name": "test_string",
            "email": "test@example.com",
            "age": 1
      }),
      { headers: HEADERS, tags: { endpoint: '/api/users/{id}' } }
    );

    const passed = check(res, {
      '✅ 狀態碼 2xx': (r) => r.status >= 200 && r.status < 300,
      '⚡ 回應 < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!passed);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  });

  group('DELETE /api/users/{id} — 刪除使用者', () => {
    const res = http.delete(
      `${BASE_URL}/api/users/test-id-123`,
      null,
      { headers: HEADERS, tags: { endpoint: '/api/users/{id}' } }
    );

    const passed = check(res, {
      '✅ 狀態碼 2xx': (r) => r.status >= 200 && r.status < 300,
      '⚡ 回應 < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!passed);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  });

  group('POST /api/orders — 建立訂單', () => {
    const res = http.post(
      `${BASE_URL}/api/orders`,
      JSON.stringify({
            "userId": "user-123",
            "items": [
                  {
                        "productId": "prod-456",
                        "quantity": 2
                  }
            ],
            "shippingAddress": "台北市信義區"
      }),
      { headers: HEADERS, tags: { endpoint: '/api/orders' } }
    );

    const passed = check(res, {
      '✅ 狀態碼 2xx': (r) => r.status >= 200 && r.status < 300,
      '⚡ 回應 < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!passed);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  });


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

  console.log('\n📊 測試摘要：');
  console.log(JSON.stringify(summary, null, 2));

  return {
    'summary.json': JSON.stringify(data, null, 2),
  };
}
