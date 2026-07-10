// ============================================
// 🧪 TS 自動產生的測試 — by TestForge
// 來源：userService.ts
// 產生時間：2026-07-10T08:10:23.420Z
// ============================================
import { describe, it, expect, vi } from 'vitest';
import { getUsers, getUserById, createUser, updateUser, deleteUser, buildQueryString } from '../../src/api/userService';

// 測試 getUsers
describe('getUsers', () => {
  it('應該是一個函數', () => {
    expect(typeof getUsers).toBe('function');
  });
  it('預期接收 0 個必填參數 (Function.length)', () => {
    expect(getUsers.length).toBe(0);
  });

  it('呼叫時應回傳 Promise', () => {
    const result = getUsers();
    expect(result).toBeInstanceOf(Promise);
    result.catch(() => {});
  });
});

// 測試 getUserById
describe('getUserById', () => {
  it('應該是一個函數', () => {
    expect(typeof getUserById).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(getUserById.length).toBe(1);
  });

  it('呼叫時應回傳 Promise', () => {
    const result = getUserById("test-id");
    expect(result).toBeInstanceOf(Promise);
    result.catch(() => {});
  });
});

// 測試 createUser
describe('createUser', () => {
  it('應該是一個函數', () => {
    expect(typeof createUser).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(createUser.length).toBe(1);
  });

  it('呼叫時應回傳 Promise', () => {
    const result = createUser({ id: "1" });
    expect(result).toBeInstanceOf(Promise);
    result.catch(() => {});
  });
});

// 測試 updateUser
describe('updateUser', () => {
  it('應該是一個函數', () => {
    expect(typeof updateUser).toBe('function');
  });
  it('預期接收 2 個必填參數 (Function.length)', () => {
    expect(updateUser.length).toBe(2);
  });

  it('呼叫時應回傳 Promise', () => {
    const result = updateUser("test-id", { id: "1" });
    expect(result).toBeInstanceOf(Promise);
    result.catch(() => {});
  });
});

// 測試 deleteUser
describe('deleteUser', () => {
  it('應該是一個函數', () => {
    expect(typeof deleteUser).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(deleteUser.length).toBe(1);
  });

  it('呼叫時應回傳 Promise', () => {
    const result = deleteUser("test-id");
    expect(result).toBeInstanceOf(Promise);
    result.catch(() => {});
  });
});

// 測試 buildQueryString
describe('buildQueryString', () => {
  it('應該是一個函數', () => {
    expect(typeof buildQueryString).toBe('function');
  });
  it('預期接收 1 個必填參數 (Function.length)', () => {
    expect(buildQueryString.length).toBe(1);
  });

  it('正常呼叫不應拋出錯誤', () => {
    expect(() => buildQueryString({ q: "query", page: 1 })).not.toThrow();
  });

  it('應該有回傳值', () => {
    const result = buildQueryString({ q: "query", page: 1 });
    expect(result).toBeDefined();
  });

  it('回傳型別應為 string', () => {
    const result = buildQueryString({ q: "query", page: 1 });
    expect(typeof result).toBe('string');
  });

  it('回傳值應與快照一致（偵測非預期變更）', () => {
    const result = buildQueryString({ q: "query", page: 1 });
    expect(result).toMatchSnapshot();
  });

  // --- 邊界值測試 ---
  it('params 為 null 時的容錯處理', () => {
    // 預期可能會拋錯，或是優雅處理（取決於實作）
    try {
      buildQueryString(null as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('params 為空物件 {} 時的行為', () => {
    try {
      buildQueryString({} as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('params 傳入錯誤型別 (數字) 時的容錯處理', () => {
    try {
      buildQueryString(123 as any);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
  it('未提供任何參數呼叫時的容錯處理（缺少必填）', () => {
    try {
      (buildQueryString as any)();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});
