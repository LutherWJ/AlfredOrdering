<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cartStore'

const props = defineProps<{
  title: string
  showBack?: boolean
  backRoute?: string
}>()

const router = useRouter()
const cartStore = useCartStore()

const goBack = () => {
  if (props.backRoute) {
    router.push(props.backRoute)
  } else {
    router.back()
  }
}

const goToCart = () => {
  router.push('/cart')
}
</script>

<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
    <div class="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
      <!-- Left: Back button -->
      <button
        v-if="showBack"
        @click="goBack"
        class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Go back"
      >
        <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div v-else class="w-10"></div> <!-- Spacer for alignment -->

      <!-- Center: Title -->
      <h1 class="text-xl font-bold text-gray-900 truncate mx-4">{{ title }}</h1>

      <!-- Right: Cart button with badge -->
      <button
        @click="goToCart"
        class="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors relative"
        aria-label="View cart"
      >
        <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <!-- Badge showing item count -->
        <span
          v-if="cartStore.itemCount > 0"
          class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
        >
          {{ cartStore.itemCount > 9 ? '9+' : cartStore.itemCount }}
        </span>
      </button>
    </div>
  </header>
</template>