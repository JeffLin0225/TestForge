// ===========================
// API 服務層
// ===========================

const API_BASE = '/api';

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

/**
 * 取得所有使用者
 */
export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  return res.json();
}

/**
 * 取得特定使用者
 */
export async function getUserById(id: string): Promise<User> {
  const res = await fetch(`${API_BASE}/users/${id}`);
  if (!res.ok) throw new Error('User not found');
  return res.json();
}

/**
 * 建立新使用者
 */
export async function createUser(data: Omit<User, 'id'>): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

/**
 * 更新使用者
 */
export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

/**
 * 刪除使用者
 */
export async function deleteUser(id: string): Promise<void> {
  await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
}

/**
 * 建構查詢字串
 */
export function buildQueryString(params: Record<string, string | number | boolean>): string {
  return Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}
