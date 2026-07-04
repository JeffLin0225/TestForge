import { describe, it, expect } from 'vitest';
import { add, average, formatPrice, fetchUser, isValidEmail } from '../sample-code/utils.js';


// 測試 add
describe('add', () => {
  // --- 基本測試 ---
  it('應該是一個函數', () => {
    expect(typeof add).toBe('function');
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => add(1, 1)).not.toThrow();
  });

  it('應該回傳值', () => {
    const result = add(1, 1);
    expect(result).toBeDefined();
  });

  // --- 邊界值測試 ---

  it('add — 傳入 0 不應崩潰', () => {
    expect(() => add(0, 1)).not.toThrow();
  });

  it('add — 傳入負數不應崩潰', () => {
    expect(() => add(-1, 1)).not.toThrow();
  });

  it('add — 傳入 0 不應崩潰', () => {
    expect(() => add(1, 0)).not.toThrow();
  });

  it('add — 傳入負數不應崩潰', () => {
    expect(() => add(1, -1)).not.toThrow();
  });
});


// 測試 average
describe('average', () => {
  // --- 基本測試 ---
  it('應該是一個函數', () => {
    expect(typeof average).toBe('function');
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => average([1, 2, 3])).not.toThrow();
  });

  it('應該回傳值', () => {
    const result = average([1, 2, 3]);
    expect(result).toBeDefined();
  });

  // --- 邊界值測試 ---

  it('average — 空陣列不應崩潰', () => {
    expect(() => average([])).not.toThrow();
  });

  it('average — 傳入 0 不應崩潰', () => {
    expect(() => average(0)).not.toThrow();
  });

  it('average — 傳入負數不應崩潰', () => {
    expect(() => average(-1)).not.toThrow();
  });
});


// 測試 formatPrice
describe('formatPrice', () => {
  // --- 基本測試 ---
  it('應該是一個函數', () => {
    expect(typeof formatPrice).toBe('function');
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => formatPrice(100, "TWD")).not.toThrow();
  });

  it('應該回傳值', () => {
    const result = formatPrice(100, "TWD");
    expect(result).toBeDefined();
  });

  // --- 邊界值測試 ---

  it('formatPrice — 傳入 0 不應崩潰', () => {
    expect(() => formatPrice(0, "TWD")).not.toThrow();
  });

  it('formatPrice — 傳入負數不應崩潰', () => {
    expect(() => formatPrice(-1, "TWD")).not.toThrow();
  });
});


// 測試 fetchUser
describe('fetchUser', () => {
  // --- 基本測試 ---
  it('應該是一個函數', () => {
    expect(typeof fetchUser).toBe('function');
  });

  it('正常呼叫不應拋出錯誤', async () => {
    // 跳過非同步函數的簡單呼叫測試（需要 mock）
  });

  it('應該回傳值', async () => {
    // 跳過非同步函數（需要 mock fetch）
  });

  // --- 邊界值測試 ---

});


// 測試 isValidEmail
describe('isValidEmail', () => {
  // --- 基本測試 ---
  it('應該是一個函數', () => {
    expect(typeof isValidEmail).toBe('function');
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => isValidEmail("test@example.com")).not.toThrow();
  });

  it('應該回傳值', () => {
    const result = isValidEmail("test@example.com");
    expect(result).toBeDefined();
  });

  // --- 邊界值測試 ---

  it('isValidEmail — 空字串不應崩潰', () => {
    expect(() => isValidEmail("")).not.toThrow();
  });
});

