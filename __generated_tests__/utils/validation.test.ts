// ============================================
// 🧪 TS 自動產生的測試 — by TestForge
// 來源：validation.ts
// 產生時間：2026-07-10T09:13:16.311Z
// ============================================
import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPhone, isStrongPassword, isValidUrl, isValidTWID } from '../../src/utils/validation';

// 測試 isValidEmail
describe('isValidEmail', () => {
  it('應該是一個函數', () => {
    expect(typeof isValidEmail).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(isValidEmail.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => isValidEmail("test@example.com")).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = isValidEmail("test@example.com");
    expect(result).toBeDefined();
  });

  it('回傳型別應為 boolean', () => {
    const result = isValidEmail("test@example.com");
    expect(typeof result).toBe('boolean');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = isValidEmail("test@example.com");
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('email 為空字串時不應崩潰', () => {
    expect(() => isValidEmail("")).not.toThrow();
  });
  it('email 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      isValidEmail(123 as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (isValidEmail as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// 測試 isValidPhone
describe('isValidPhone', () => {
  it('應該是一個函數', () => {
    expect(typeof isValidPhone).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(isValidPhone.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => isValidPhone("0912345678")).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = isValidPhone("0912345678");
    expect(result).toBeDefined();
  });

  it('回傳型別應為 boolean', () => {
    const result = isValidPhone("0912345678");
    expect(typeof result).toBe('boolean');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = isValidPhone("0912345678");
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('phone 為空字串時不應崩潰', () => {
    expect(() => isValidPhone("")).not.toThrow();
  });
  it('phone 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      isValidPhone(123 as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (isValidPhone as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// 測試 isStrongPassword
describe('isStrongPassword', () => {
  it('應該是一個函數', () => {
    expect(typeof isStrongPassword).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(isStrongPassword.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => isStrongPassword("Password123")).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = isStrongPassword("Password123");
    expect(result).toBeDefined();
  });

  it('回傳型別應為 boolean', () => {
    const result = isStrongPassword("Password123");
    expect(typeof result).toBe('boolean');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = isStrongPassword("Password123");
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('password 為空字串時不應崩潰', () => {
    expect(() => isStrongPassword("")).not.toThrow();
  });
  it('password 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      isStrongPassword(123 as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (isStrongPassword as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// 測試 isValidUrl
describe('isValidUrl', () => {
  it('應該是一個函數', () => {
    expect(typeof isValidUrl).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(isValidUrl.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => isValidUrl("https://example.com")).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = isValidUrl("https://example.com");
    expect(result).toBeDefined();
  });

  it('回傳型別應為 boolean', () => {
    const result = isValidUrl("https://example.com");
    expect(typeof result).toBe('boolean');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = isValidUrl("https://example.com");
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('url 為空字串時不應崩潰', () => {
    expect(() => isValidUrl("")).not.toThrow();
  });
  it('url 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      isValidUrl(123 as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (isValidUrl as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// 測試 isValidTWID
describe('isValidTWID', () => {
  it('應該是一個函數', () => {
    expect(typeof isValidTWID).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(isValidTWID.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => isValidTWID("test-id")).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = isValidTWID("test-id");
    expect(result).toBeDefined();
  });

  it('回傳型別應為 boolean', () => {
    const result = isValidTWID("test-id");
    expect(typeof result).toBe('boolean');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = isValidTWID("test-id");
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('id 為空字串時不應崩潰', () => {
    expect(() => isValidTWID("")).not.toThrow();
  });
  it('id 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      isValidTWID(123 as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (isValidTWID as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});
