// ===========================
// 購物車 Composable
// ===========================
import { ref, computed } from 'vue';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * 計算單項小計
 */
export function calcItemSubtotal(item: CartItem): number {
  return item.price * item.quantity;
}

/**
 * 計算購物車總金額
 */
export function calcCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + calcItemSubtotal(item), 0);
}

/**
 * 計算折扣金額
 */
export function applyDiscount(total: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) return total;
  return total * (1 - discountPercent / 100);
}

/**
 * 判斷是否免運費
 */
export function isFreeShipping(total: number, threshold: number = 1000): boolean {
  return total >= threshold;
}

/**
 * Vue Composable — 購物車狀態管理
 */
export function useCart() {
  const items = ref<CartItem[]>([]);

  const total = computed(() => calcCartTotal(items.value));
  const itemCount = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0));

  function addItem(item: Omit<CartItem, 'quantity'>) {
    const existing = items.value.find(i => i.id === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      items.value.push({ ...item, quantity: 1 });
    }
  }

  function removeItem(id: string) {
    items.value = items.value.filter(i => i.id !== id);
  }

  function clearCart() {
    items.value = [];
  }

  return { items, total, itemCount, addItem, removeItem, clearCart };
}
