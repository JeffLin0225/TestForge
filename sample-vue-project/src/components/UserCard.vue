<template>
  <div class="user-card">
    <img :src="avatarUrl" :alt="user.name" class="avatar" />
    <div class="info">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      <span class="badge" :class="statusClass">{{ statusText }}</span>
    </div>
    <button @click="$emit('edit', user.id)">編輯</button>
    <button @click="$emit('delete', user.id)" class="danger">刪除</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

const props = defineProps<{
  user: User;
}>();

defineEmits<{
  edit: [id: string];
  delete: [id: string];
}>();

/**
 * 產生頭像 URL
 */
function getAvatarUrl(email: string): string {
  const hash = email.toLowerCase().trim();
  return `https://gravatar.com/avatar/${hash}?d=identicon`;
}

const avatarUrl = computed(() => getAvatarUrl(props.user.email));
const statusClass = computed(() => props.user.isActive ? 'active' : 'inactive');
const statusText = computed(() => props.user.isActive ? '啟用' : '停用');
</script>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}
.badge.active { color: green; }
.badge.inactive { color: red; }
.danger { color: red; }
</style>
