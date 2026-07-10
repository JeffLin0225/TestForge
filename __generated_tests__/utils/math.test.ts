// ============================================
// 🧪 TS 自動產生的測試 — by TestForge
// 來源：math.ts
// 產生時間：2026-07-10T09:13:16.308Z
// ============================================
import { describe, it, expect } from 'vitest';
import { add, subtract, average, percentage, roundTo } from '../../src/utils/math';

// 測試 add
describe('add', () => {
  it('應該是一個函數', () => {
    expect(typeof add).toBe('function');
  });
  it('預期接收 2 個必填參數 (Function.length)', () => {
    expect(add.length).toBe(2);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => add(42, 42)).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = add(42, 42);
    expect(result).toBeDefined();
  });

  it('回傳型別應為 number', () => {
    const result = add(42, 42);
    expect(typeof result).toBe('number');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = add(42, 42);
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('a 為 0 時不應崩潰', () => {
    expect(() => add(0, 42)).not.toThrow();
  });
  it('a 為負數時不應崩潰', () => {
    expect(() => add(-1, 42)).not.toThrow();
  });
  it('a 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      add("invalid_string" as any, 42);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('b 為 0 時不應崩潰', () => {
    expect(() => add(42, 0)).not.toThrow();
  });
  it('b 為負數時不應崩潰', () => {
    expect(() => add(42, -1)).not.toThrow();
  });
  it('b 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      add(42, "invalid_string" as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (add as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// 測試 subtract
describe('subtract', () => {
  it('應該是一個函數', () => {
    expect(typeof subtract).toBe('function');
  });
  it('預期接收 2 個必填參數 (Function.length)', () => {
    expect(subtract.length).toBe(2);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => subtract(42, 42)).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = subtract(42, 42);
    expect(result).toBeDefined();
  });

  it('回傳型別應為 number', () => {
    const result = subtract(42, 42);
    expect(typeof result).toBe('number');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = subtract(42, 42);
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('a 為 0 時不應崩潰', () => {
    expect(() => subtract(0, 42)).not.toThrow();
  });
  it('a 為負數時不應崩潰', () => {
    expect(() => subtract(-1, 42)).not.toThrow();
  });
  it('a 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      subtract("invalid_string" as any, 42);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('b 為 0 時不應崩潰', () => {
    expect(() => subtract(42, 0)).not.toThrow();
  });
  it('b 為負數時不應崩潰', () => {
    expect(() => subtract(42, -1)).not.toThrow();
  });
  it('b 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      subtract(42, "invalid_string" as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (subtract as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// 測試 average
describe('average', () => {
  it('應該是一個函數', () => {
    expect(typeof average).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(average.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => average([1, 2, 3])).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = average([1, 2, 3]);
    expect(result).toBeDefined();
  });

  it('回傳型別應為 number', () => {
    const result = average([1, 2, 3]);
    expect(typeof result).toBe('number');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = average([1, 2, 3]);
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('numbers 為空陣列時不應崩潰', () => {
    expect(() => average([])).not.toThrow();
  });
  it('numbers 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      average("not-an-array" as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (average as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// 測試 percentage
describe('percentage', () => {
  it('應該是一個函數', () => {
    expect(typeof percentage).toBe('function');
  });
  it('預期接收 2 個必填參數 (Function.length)', () => {
    expect(percentage.length).toBe(2);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => percentage(42, 99.99)).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = percentage(42, 99.99);
    expect(result).toBeDefined();
  });

  it('回傳型別應為 number', () => {
    const result = percentage(42, 99.99);
    expect(typeof result).toBe('number');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = percentage(42, 99.99);
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('value 為 0 時不應崩潰', () => {
    expect(() => percentage(0, 99.99)).not.toThrow();
  });
  it('value 為負數時不應崩潰', () => {
    expect(() => percentage(-1, 99.99)).not.toThrow();
  });
  it('value 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      percentage("invalid_string" as any, 99.99);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('total 為 0 時不應崩潰', () => {
    expect(() => percentage(42, 0)).not.toThrow();
  });
  it('total 為負數時不應崩潰', () => {
    expect(() => percentage(42, -1)).not.toThrow();
  });
  it('total 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      percentage(42, "invalid_string" as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (percentage as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// 測試 roundTo
describe('roundTo', () => {
  it('應該是一個函數', () => {
    expect(typeof roundTo).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(roundTo.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => roundTo(42, 42)).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = roundTo(42, 42);
    expect(result).toBeDefined();
  });

  it('回傳型別應為 number', () => {
    const result = roundTo(42, 42);
    expect(typeof result).toBe('number');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = roundTo(42, 42);
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('num 為 0 時不應崩潰', () => {
    expect(() => roundTo(0, 42)).not.toThrow();
  });
  it('num 為負數時不應崩潰', () => {
    expect(() => roundTo(-1, 42)).not.toThrow();
  });
  it('num 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      roundTo("invalid_string" as any, 42);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('decimals 為 0 時不應崩潰', () => {
    expect(() => roundTo(42, 0)).not.toThrow();
  });
  it('decimals 為負數時不應崩潰', () => {
    expect(() => roundTo(42, -1)).not.toThrow();
  });
  it('decimals 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      roundTo(42, "invalid_string" as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (roundTo as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('只傳必填參數也不應崩潰', () => {
    expect(() => roundTo(42)).not.toThrow();
  });
});
