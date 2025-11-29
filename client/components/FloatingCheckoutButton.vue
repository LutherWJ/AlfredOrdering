<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cartStore'

const router = useRouter()
const cartStore = useCartStore()

const itemCount = computed(() => cartStore.itemCount)

const goToCart = () => {
  router.push('/cart')
}
</script>

<template>
  <div
    v-if="cartStore.hasItems"
    class="fixed bottom-6 left-0 right-0 z-30 px-4 pointer-events-none"
  >
    <div class="max-w-2xl mx-auto pointer-events-auto">
      <button
        @click="goToCart"
        class="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            {{ itemCount }}
          </div>
          <span class="text-lg">View Cart</span>
        </div>
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Add subtle pulsing animation */
@keyframes pulse-subtle {
  0%, 100% {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  50% {
    box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.3), 0 10px 10px -5px rgba(37, 99, 235, 0.2);
  }
}

button {
  animation: pulse-subtle 2s ease-in-out infinite;
}
</style>