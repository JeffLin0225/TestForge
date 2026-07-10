// ============================================
// 🟩 自動產生的 Vue 元件測試 — by TestForge
// 來源：UserCard.vue
// 產生時間：2026-07-10T09:13:16.298Z
// ============================================
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UserCard from '../../src/components/UserCard.vue';

// Mock Props 資料
const defaultProps = {
    'user': {
        'id': 'user-1',
        'name': 'Test User',
        'email': 'test@example.com',
        'isActive': true,
        'age': 25
    }
};

// 輔助函數：快速掛載元件
function mountComponent(overrideProps = {}) {
  return mount(UserCard, {
    props: { ...defaultProps, ...overrideProps },
  });
}

describe('UserCard.vue', () => {
  // ===== 基本掛載 =====
  it('應該能正常掛載', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it('掛載後不應有 console 錯誤', () => {
    expect(() => mountComponent()).not.toThrow();
  });

  // ===== Props 渲染 =====
  it('應該渲染 user.name', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Test User');
  });

  it('應該渲染 user.email', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('test@example.com');
  });

  // ===== 按鈕互動 =====
  it('按鈕「編輯」應該存在', () => {
    const wrapper = mountComponent();
    const button = wrapper.findAll('button').at(0);
    expect(button.exists()).toBe(true);
  });

  it('點擊「編輯」應觸發 edit 事件', async () => {
    const wrapper = mountComponent();
    const button = wrapper.findAll('button').at(0);
    await button.trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')).toHaveLength(1);
  });

  it('按鈕「刪除」應該存在', () => {
    const wrapper = mountComponent();
    const button = wrapper.find('button.danger');
    expect(button.exists()).toBe(true);
  });

  it('點擊「刪除」應觸發 delete 事件', async () => {
    const wrapper = mountComponent();
    const button = wrapper.find('button.danger');
    await button.trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')).toHaveLength(1);
  });

  // ===== 事件 Emits =====
  // ===== 快照測試 =====
  it('渲染結果應與快照一致', () => {
    const wrapper = mountComponent();
    expect(wrapper.html()).toMatchSnapshot();
  });
});
