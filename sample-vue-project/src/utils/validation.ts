// ===========================
// 驗證工具
// ===========================

/**
 * 驗證 Email 格式
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 驗證手機號碼（台灣格式）
 */
export function isValidPhone(phone: string): boolean {
  return /^09\d{8}$/.test(phone);
}

/**
 * 驗證密碼強度（至少8位，包含大小寫和數字）
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * 驗證是否為有效的 URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 驗證台灣身分證字號
 */
export function isValidTWID(id: string): boolean {
  if (!/^[A-Z][12]\d{8}$/.test(id)) return false;
  const mapping: Record<string, number> = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17,
    I: 34, J: 18, K: 19, L: 20, M: 21, N: 22, O: 35, P: 23,
    Q: 24, R: 25, S: 26, T: 27, U: 28, V: 29, W: 32, X: 30,
    Y: 31, Z: 33,
  };
  const firstValue = mapping[id[0]];
  const digits = [Math.floor(firstValue / 10), firstValue % 10, ...id.slice(1).split('').map(Number)];
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  return sum % 10 === 0;
}
