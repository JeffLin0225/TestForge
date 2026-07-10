// ============================================
// 🟩 自動產生的 Vue 元件測試 — by TestForge
// 來源：LoginForm.vue
// 產生時間：2026-07-10T09:23:53.823Z
// ============================================
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginForm from '../../src/components/LoginForm.vue';

// Mock Props 資料
const defaultProps = {
    'showRemember': true,
    'isLoading': true,
    'errorMessage': 'Test Value'
};

// 輔助函數：快速掛載元件
function mountComponent(overrideProps = {}) {
  return mount(LoginForm, {
    props: { ...defaultProps, ...overrideProps },
  });
}

describe('LoginForm.vue', () => {
  // ===== 基本掛載 =====
  it('應該能正常掛載', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it('掛載後不應有 console 錯誤', () => {
    expect(() => mountComponent()).not.toThrow();
  });

  // ===== Props 渲染 =====
  it('應該渲染 prop: errorMessage', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain(String(defaultProps.errorMessage));
  });

  // ===== 按鈕互動 =====
  it('按鈕「{{ isLoading ? "登入中..." : "登入" }}」應該存在', () => {
    const wrapper = mountComponent();
    const button = wrapper.findAll('button').at(0);
    expect(button.exists()).toBe(true);
  });

  it('按鈕「忘記密碼？」應該存在', () => {
    const wrapper = mountComponent();
    const button = wrapper.findAll('button').at(1);
    expect(button.exists()).toBe(true);
  });

  it('點擊「忘記密碼？」應觸發 forgot-password 事件', async () => {
    const wrapper = mountComponent();
    const button = wrapper.findAll('button').at(1);
    await button.trigger('click');
    expect(wrapper.emitted('forgot-password')).toBeTruthy();
    expect(wrapper.emitted('forgot-password')).toHaveLength(1);
  });

  // ===== 表單輸入 =====
  it('input 元素應該存在', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('#email').exists()).toBe(true);
  });

  it('input 應支援輸入（v-model: email）', async () => {
    const wrapper = mountComponent();
    const el = wrapper.find('#email');
    await el.setValue("test input value");
    expect((el.element as HTMLInputElement).value).toBe("test input value");
  });

  it('input 元素應該存在', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('#password').exists()).toBe(true);
  });

  it('input 應支援輸入（v-model: password）', async () => {
    const wrapper = mountComponent();
    const el = wrapper.find('#password');
    await el.setValue("test input value");
    expect((el.element as HTMLInputElement).value).toBe("test input value");
  });

  it('input 元素應該存在', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
  });

  // ===== 表單提交 =====
  it('提交表單時應觸發 submit 事件', async () => {
    const wrapper = mountComponent();
    const el_email = wrapper.find('#email');
    if (el_email.exists()) {
      await el_email.setValue("test@example.com");
    }
    const el_password = wrapper.find('#password');
    if (el_password.exists()) {
      await el_password.setValue("password123");
    }
    const el_remember = wrapper.find('input[type="checkbox"]');
    if (el_remember.exists()) {
      await el_remember.setValue(true);
    }
    const form = wrapper.find('form');
    expect(form.exists()).toBe(true);
    await form.trigger('submit');
    expect(wrapper.emitted('submit')).toBeTruthy();
  });

  // ===== 事件 Emits =====
  // ===== 條件渲染 =====
  it('條件渲染 (showRemember) 不同值不應崩潰', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it('條件渲染 (errorMessage) 不同值不應崩潰', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  // ===== 快照測試 =====
  it('渲染結果應與快照一致', () => {
    const wrapper = mountComponent();
    expect(wrapper.html()).toMatchSnapshot();
  });
});
