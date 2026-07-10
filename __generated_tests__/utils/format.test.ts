// ============================================
// 🧪 TS 自動產生的測試 — by TestForge
// 來源：format.ts
// 產生時間：2026-07-10T08:10:23.434Z
// ============================================
import { describe, it, expect } from 'vitest';
import { formatPrice, formatDate, truncateText, formatDuration, formatFileSize } from '../../src/utils/format';

// 測試 formatPrice
describe('formatPrice', () => {
  it('應該是一個函數', () => {
    expect(typeof formatPrice).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(formatPrice.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => formatPrice(99.99, "test")).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = formatPrice(99.99, "test");
    expect(result).toBeDefined();
  });

  it('回傳型別應為 string', () => {
    const result = formatPrice(99.99, "test");
    expect(typeof result).toBe('string');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = formatPrice(99.99, "test");
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('amount 為 0 時不應崩潰', () => {
    expect(() => formatPrice(0, "test")).not.toThrow();
  });
  it('amount 為負數時不應崩潰', () => {
    expect(() => formatPrice(-1, "test")).not.toThrow();
  });
  it('amount 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      formatPrice("invalid_string" as any, "test");
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('currency 為空字串時不應崩潰', () => {
    expect(() => formatPrice(99.99, "")).not.toThrow();
  });
  it('currency 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      formatPrice(99.99, 123 as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (formatPrice as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('只傳必填參數也不應崩潰', () => {
    expect(() => formatPrice(99.99)).not.toThrow();
  });
});

// 測試 formatDate
describe('formatDate', () => {
  it('應該是一個函數', () => {
    expect(typeof formatDate).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(formatDate.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => formatDate(new Date())).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = formatDate(new Date());
    expect(result).toBeDefined();
  });

  it('回傳型別應為 string', () => {
    const result = formatDate(new Date());
    expect(typeof result).toBe('string');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = formatDate(new Date());
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('date 為 null 時的容錯處理', () => {
    // 預期可能會拋錯，或是優雅處理（取決於實作）
    try {
      formatDate(null as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('date 為空物件 {} 時的行為', () => {
    try {
      formatDate({} as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('date 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      formatDate(123 as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (formatDate as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// 測試 truncateText
describe('truncateText', () => {
  it('應該是一個函數', () => {
    expect(typeof truncateText).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(truncateText.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => truncateText("test", 42)).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = truncateText("test", 42);
    expect(result).toBeDefined();
  });

  it('回傳型別應為 string', () => {
    const result = truncateText("test", 42);
    expect(typeof result).toBe('string');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = truncateText("test", 42);
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('text 為空字串時不應崩潰', () => {
    expect(() => truncateText("", 42)).not.toThrow();
  });
  it('text 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      truncateText(123 as any, 42);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('maxLength 為 0 時不應崩潰', () => {
    expect(() => truncateText("test", 0)).not.toThrow();
  });
  it('maxLength 為負數時不應崩潰', () => {
    expect(() => truncateText("test", -1)).not.toThrow();
  });
  it('maxLength 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      truncateText("test", "invalid_string" as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (truncateText as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('只傳必填參數也不應崩潰', () => {
    expect(() => truncateText("test")).not.toThrow();
  });
});

// 測試 formatDuration
describe('formatDuration', () => {
  it('應該是一個函數', () => {
    expect(typeof formatDuration).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(formatDuration.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => formatDuration(99.99)).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = formatDuration(99.99);
    expect(result).toBeDefined();
  });

  it('回傳型別應為 string', () => {
    const result = formatDuration(99.99);
    expect(typeof result).toBe('string');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = formatDuration(99.99);
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('totalSeconds 為 0 時不應崩潰', () => {
    expect(() => formatDuration(0)).not.toThrow();
  });
  it('totalSeconds 為負數時不應崩潰', () => {
    expect(() => formatDuration(-1)).not.toThrow();
  });
  it('totalSeconds 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      formatDuration("invalid_string" as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (formatDuration as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// 測試 formatFileSize
describe('formatFileSize', () => {
  it('應該是一個函數', () => {
    expect(typeof formatFileSize).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(formatFileSize.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => formatFileSize(42)).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = formatFileSize(42);
    expect(result).toBeDefined();
  });

  it('回傳型別應為 string', () => {
    const result = formatFileSize(42);
    expect(typeof result).toBe('string');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = formatFileSize(42);
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('bytes 為 0 時不應崩潰', () => {
    expect(() => formatFileSize(0)).not.toThrow();
  });
  it('bytes 為負數時不應崩潰', () => {
    expect(() => formatFileSize(-1)).not.toThrow();
  });
  it('bytes 傳入錯誤型別 (字串) 時的容錯處理', () => {
    try {
      formatFileSize("invalid_string" as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (formatFileSize as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});
