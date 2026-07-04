// ========================================
// 這是一個「假裝是使用者上傳的 Repo」裡面的工具函數
// 我們的 AST 分析器要自動讀懂這些函數的結構
// ========================================

/**
 * 計算兩個數字的和
 */
export function add(a, b) {
  return a + b;
}

/**
 * 計算陣列的平均值
 */
export function average(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return sum / numbers.length;
}

/**
 * 格式化價格
 */
export function formatPrice(amount, currency = 'TWD') {
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * 非同步取得使用者資料
 */
export async function fetchUser(userId) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}

/**
 * 判斷是否為有效的 email
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 這個沒有 export，分析器不應該抓到它
function internalHelper() {
  return 'secret';
}
