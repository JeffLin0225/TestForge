// ===========================
// 數學計算工具
// ===========================

/**
 * 計算兩數相加
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * 計算兩數相減
 */
export function subtract(a: number, b: number): number {
  return a - b;
}

/**
 * 計算陣列平均值
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * 計算百分比
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * 數字四捨五入到指定小數位
 */
export function roundTo(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}
