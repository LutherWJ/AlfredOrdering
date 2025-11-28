<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  imageUrl?: string
  price?: number
  isAvailable?: boolean
  isVegetarian?: boolean
  isVegan?: boolean
  isGlutenFree?: boolean
}>()

defineEmits<{
  click: []
}>()

const formatPrice = (price: number) => {
  return `$${price.toFixed(2)}`
}
</script>

<template>
  <button
    @click="$emit('click')"
    class="w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 text-left border border-gray-200 hover:border-blue-500 active:scale-98 relative overflow-hidden"
    :class="{ 'opacity-60': isAvailable === false }"
  >
    <!-- Unavailable overlay -->
    <div
      v-if="isAvailable === false"
      class="absolute inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-10"
    >
      <span class="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm">
        Out of Stock
      </span>
    </div>

    <div class="flex items-start gap-4">
      <!-- Image (if provided) -->
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="title"
        class="w-20 h-20 object-cover rounded-lg flex-shrink-0"
        loading="lazy"
      />

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Title and Price -->
        <div class="flex items-start justify-between gap-2 mb-1">
          <h3 class="text-lg font-semibold text-gray-900 truncate">{{ title }}</h3>
          <span v-if="price !== undefined" class="text-lg font-bold text-gray-900 flex-shrink-0">
            {{ formatPrice(price) }}
          </span>
        </div>

        <!-- Subtitle/Description -->
        <p v-if="subtitle" class="text-sm text-gray-600 line-clamp-2 mb-2">
          {{ subtitle }}
        </p>

        <!-- Dietary badges -->
        <div
          v-if="isVegetarian || isVegan || isGlutenFree"
          class="flex flex-wrap gap-1 mt-2"
        >
          <span
            v-if="isVegan"
            class="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded"
          >
            Vegan
          </span>
          <span
            v-else-if="isVegetarian"
            class="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded"
          >
            Vegetarian
          </span>
          <span
            v-if="isGlutenFree"
            class="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded"
          >
            Gluten-Free
          </span>
        </div>

        <!-- Slot for additional content -->
        <slot></slot>
      </div>

      <!-- Arrow icon -->
      <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
</template>

<style scoped>
.active\:scale-98:active {
  transform: scale(0.98);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Ensure proper touch targets on mobile */
@media (max-width: 640px) {
  button {
    min-height: 44px;
  }
}
</style>