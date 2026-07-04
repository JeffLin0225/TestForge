<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Vue 3 TestForge Demo</h1>
      <p>一個用來測試 AST 分析與自動生成測試的 Vue 3 範例專案</p>
    </header>

    <main class="app-main">
      <section class="demo-section">
        <h2>元件 1: LoginForm</h2>
        <div class="card">
          <LoginForm 
            :show-remember="true" 
            :is-loading="isLoggingIn" 
            :error-message="loginError"
            @submit="handleLoginSubmit"
            @forgot-password="handleForgotPassword"
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>元件 2: UserCard</h2>
        <div class="card user-list">
          <UserCard 
            v-for="user in users" 
            :key="user.id" 
            :user="user" 
            @edit="handleEditUser"
            @delete="handleDeleteUser"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LoginForm from './components/LoginForm.vue';
import UserCard from './components/UserCard.vue';

// 登入狀態
const isLoggingIn = ref(false);
const loginError = ref('');

// 使用者列表
const users = ref([
  { id: '1', name: '王小明', email: 'xiaoming@example.com', isActive: true },
  { id: '2', name: '李四', email: 'lisi@example.com', isActive: false },
  { id: '3', name: '張三', email: 'zhangsan@example.com', isActive: true },
]);

function handleLoginSubmit(email: string, password: string, remember: boolean) {
  isLoggingIn.value = true;
  loginError.value = '';
  
  setTimeout(() => {
    isLoggingIn.value = false;
    if (email === 'admin@example.com' && password === '123456') {
      alert(`登入成功！記住我: ${remember}`);
    } else {
      loginError.value = '帳號或密碼錯誤 (提示: admin@example.com / 123456)';
    }
  }, 1000);
}

function handleForgotPassword() {
  alert('觸發忘記密碼事件！');
}

function handleEditUser(id: string) {
  const user = users.value.find(u => u.id === id);
  if (user) {
    const newName = prompt('請輸入新的姓名：', user.name);
    if (newName) user.name = newName;
  }
}

function handleDeleteUser(id: string) {
  if (confirm('確定要刪除此使用者嗎？')) {
    users.value = users.value.filter(u => u.id !== id);
  }
}
</script>

<style scoped>
.app-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}
.app-header {
  margin-bottom: 40px;
  text-align: center;
}
.app-header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #42b883, #35495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.app-header p {
  color: #666;
  font-size: 1.1rem;
}
.app-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}
@media (max-width: 768px) {
  .app-main {
    grid-template-columns: 1fr;
  }
}
.demo-section h2 {
  margin-bottom: 15px;
  font-size: 1.5rem;
  border-left: 4px solid #42b883;
  padding-left: 10px;
}
.card {
  background: var(--card-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  padding: 20px;
  min-height: 350px;
}
.user-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 450px;
  overflow-y: auto;
}
</style>
