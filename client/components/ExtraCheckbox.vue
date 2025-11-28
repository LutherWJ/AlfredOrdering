<script setup lang="ts">
import type { MenuExtra } from '../../shared/types'

defineProps<{
  extra: MenuExtra
  selected: boolean
  disabled?: boolean
}>()

defineEmits<{
  toggle: []
}>()

const formatPrice = (price: number) => {
  if (price === 0) return 'Free'
  return price > 0 ? `+$${price.toFixed(2)}` : `-$${Math.abs(price).toFixed(2)}`
}
</script>

<template>
  <button
    @click="$emit('toggle')"
    :disabled="disabled || !extra.is_available"
    class="w-full p-4 border rounded-lg text-left transition-all"
    :class="{
      'border-blue-500 bg-blue-50': selected && extra.is_available,
      'border-gray-300 bg-white hover:border-gray-400': !selected && extra.is_available && !disabled,
      'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed': !extra.is_available || disabled
    }"
  >
    <div class="flex items-start gap-3">
      <!-- Checkbox -->
      <div class="flex-shrink-0 mt-0.5">
        <div
          class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
          :class="{
            'bg-blue-600 border-blue-600': selected,
            'border-gray-300 bg-white': !selected
          }"
        >
          <svg
            v-if="selected"
            class="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1">
            <h4 class="font-medium text-gray-900">
              {{ extra.extra_name }}
              <span v-if="extra.is_required" class="text-red-600 text-sm ml-1">*</span>
            </h4>
            <p v-if="extra.extra_description" class="text-sm text-gray-600 mt-0.5">
              {{ extra.extra_description }}
            </p>
            <p v-if="!extra.is_available" class="text-sm text-red-600 mt-1">
              Currently unavailable
            </p>
          </div>
          <span class="text-sm font-semibold text-gray-900 flex-shrink-0">
            {{ formatPrice(extra.price_delta) }}
          </span>
        </div>
      </div>
    </div>
  </button>
</template>

<style scoped>
/* Ensure proper touch targets on mobile */
button {
  min-height: 44px;
}
</style>