<script setup lang="ts">
import {ref} from 'vue';
import {login} from './../services/authService'
import {useRouter} from 'vue-router';
import {isValidEmail} from "../../shared/utils";
import {useToast} from 'vue-toastification';

const router = useRouter();
const toast = useToast();
const email = ref('');
const isLoading = ref(false);

const handleSubmit = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  if (!isValidEmail(email.value)) {
    toast.error('Please enter a valid email address');
    isLoading.value = false;
    return;
  }
  const success = await login(email.value);
  if (success) {
    router.push('/');
    return;
  }
  toast.error('Login failed. Please check your email and try again.');
  isLoading.value = false;
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleSubmit();
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">Log in</h2>
      <input
        type="email"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        v-model="email"
        @keydown="handleKeyPress"
        name="email"
        placeholder="Email"
      />
      <button
          @click="handleSubmit"
          type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150"
      >
        Log In</button>
    </div>
  </div>
</template>
