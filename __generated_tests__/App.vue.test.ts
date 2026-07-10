// ============================================
// 🟩 自動產生的 Vue 元件測試 — by TestForge
// 來源：App.vue
// 產生時間：2026-07-10T09:45:31.120Z
// ============================================
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

// Mock Props 資料
const defaultProps = {};

// 輔助函數：快速掛載元件
function mountComponent(overrideProps = {}) {
  return mount(App, {
    props: { ...defaultProps, ...overrideProps },
  });
}

describe('App.vue', () => {
  // ===== 基本掛載 =====
  it('應該能正常掛載', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it('掛載後不應有 console 錯誤', () => {
    expect(() => mountComponent()).not.toThrow();
  });

  // ===== 快照測試 =====
  it('渲染結果應與快照一致', () => {
    const wrapper = mountComponent();
    expect(wrapper.html()).toMatchSnapshot();
  });
});
