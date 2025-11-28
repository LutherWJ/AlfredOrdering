<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const decrement = () => {
  const newValue = props.modelValue - 1
  if (newValue >= (props.min ?? 1)) {
    emit('update:modelValue', newValue)
  }
}

const increment = () => {
  const newValue = props.modelValue + 1
  if (!props.max || newValue <= props.max) {
    emit('update:modelValue', newValue)
  }
}
</script>

<template>
  <div class="inline-flex items-center border border-gray-300 rounded-lg">
    <button
      @click="decrement"
      :disabled="modelValue <= (min ?? 1)"
      class="px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-lg"
      aria-label="Decrease quantity"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
      </svg>
    </button>

    <div class="px-6 py-2 font-semibold text-gray-900 min-w-[3rem] text-center">
      {{ modelValue }}
    </div>

    <button
      @click="increment"
      :disabled="max !== undefined && modelValue >= max"
      class="px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-lg"
      aria-label="Increase quantity"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* Ensure proper touch targets on mobile */
button {
  min-height: 44px;
  min-width: 44px;
}
</style>