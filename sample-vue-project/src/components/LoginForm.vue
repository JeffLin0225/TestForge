<template>
  <form class="login-form" @submit.prevent="handleSubmit">
    <h2>登入</h2>
    
    <div class="field">
      <label for="email">Email</label>
      <input 
        id="email"
        v-model="email" 
        type="email" 
        placeholder="請輸入 Email"
        required
      />
    </div>
    
    <div class="field">
      <label for="password">密碼</label>
      <input 
        id="password"
        v-model="password" 
        type="password" 
        placeholder="請輸入密碼"
        required
      />
    </div>

    <div class="field" v-if="showRemember">
      <label>
        <input type="checkbox" v-model="remember" />
        記住我
      </label>
    </div>

    <p class="error" v-if="errorMessage">{{ errorMessage }}</p>

    <button type="submit" :disabled="isLoading">
      {{ isLoading ? '登入中...' : '登入' }}
    </button>
    
    <button type="button" class="secondary" @click="$emit('forgot-password')">
      忘記密碼？
    </button>

    <a href="/register">還沒有帳號？立即註冊</a>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  showRemember?: boolean;
  isLoading?: boolean;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  submit: [email: string, password: string, remember: boolean];
  'forgot-password': [];
}>();

const email = ref('');
const password = ref('');
const remember = ref(false);

/**
 * 驗證 email 格式
 */
function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 表單是否可送出
 */
const canSubmit = computed(() => {
  return isEmailValid(email.value) && password.value.length >= 6;
});

function handleSubmit() {
  if (!canSubmit.value) return;
  emit('submit', email.value, password.value, remember.value);
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
}
.field {
  margin-bottom: 1rem;
}
.error {
  color: red;
}
.secondary {
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
}
</style>
