<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '../store/cartStore'
import type { Menu, MenuItem } from '../../shared/types'
import { getMenus } from '../services/menuService'
import NavigationHeader from '../components/NavigationHeader.vue'
import QuantitySelector from '../components/QuantitySelector.vue'
import ExtraCheckbox from '../components/ExtraCheckbox.vue'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()

const menu = ref<Menu | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const quantity = ref(1)
const selectedExtraIds = ref<Set<string>>(new Set())

const restaurantId = computed(() => route.params.restaurantId as string)
const itemId = computed(() => route.params.itemId as string)

// Find the selected item
const selectedItem = computed<MenuItem | undefined>(() => {
  if (!menu.value) return undefined
  for (const group of menu.value.groups) {
    const item = group.items.find(i => i.item_id === itemId.value)
    if (item) return item
  }
  return undefined
})

// Filter available extras
const availableExtras = computed(() => {
  if (!selectedItem.value) return []
  return selectedItem.value.extras.filter(extra => extra.is_available)
})

// Check if all required extras are selected
const allRequiredSelected = computed(() => {
  if (!selectedItem.value) return false
  const requiredExtras = selectedItem.value.extras.filter(e => e.is_required && e.is_available)
  return requiredExtras.every(extra => selectedExtraIds.value.has(extra.extra_id))
})

// Calculate total price
const totalPrice = computed(() => {
  if (!selectedItem.value) return 0

  let extrasTotal = 0
  selectedExtraIds.value.forEach(extraId => {
    const extra = selectedItem.value!.extras.find(e => e.extra_id === extraId)
    if (extra) {
      extrasTotal += extra.price_delta
    }
  })

  return (selectedItem.value.base_price + extrasTotal) * quantity.value
})

onMounted(async () => {
  try {
    const data = await getMenus(restaurantId.value)
    if (data && data.length > 0) {
      menu.value = data[0]

      // Verify item exists
      if (!selectedItem.value) {
        error.value = 'Item not found'
      }
    } else {
      error.value = 'Menu not found'
    }
  } catch (e) {
    error.value = 'Unable to load item details'
    console.error(e)
  } finally {
    loading.value = false
  }
})

const toggleExtra = (extraId: string) => {
  if (selectedExtraIds.value.has(extraId)) {
    selectedExtraIds.value.delete(extraId)
  } else {
    selectedExtraIds.value.add(extraId)
  }
}

const addToCart = () => {
  if (!selectedItem.value || !allRequiredSelected.value) return

  cartStore.addItem(
    selectedItem.value.item_id,
    quantity.value,
    Array.from(selectedExtraIds.value)
  )

  // Navigate back to items list to allow adding more items
  router.back()
}

const formatPrice = (price: number) => {
  return `$${price.toFixed(2)}`
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-32">
    <NavigationHeader
      :title="selectedItem?.item_name || 'Customize Item'"
      :show-back="true"
    />

    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div class="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-lg font-semibold text-red-900 mb-2">Unable to Load Item</h2>
        <p class="text-red-700 mb-4">{{ error }}</p>
      </div>

      <!-- Item Details -->
      <div v-else-if="selectedItem" class="space-y-6">
        <!-- Item Info Card -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <img
            v-if="selectedItem.image_url"
            :src="selectedItem.image_url"
            :alt="selectedItem.item_name"
            class="w-full h-48 object-cover"
          />
          <div class="p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ selectedItem.item_name }}</h2>
            <p v-if="selectedItem.description" class="text-gray-600 mb-4">{{ selectedItem.description }}</p>
            <div class="flex items-center justify-between">
              <span class="text-2xl font-bold text-gray-900">{{ formatPrice(selectedItem.base_price) }}</span>
              <div class="flex gap-2">
                <span
                  v-if="selectedItem.is_vegan"
                  class="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded"
                >
                  Vegan
                </span>
                <span
                  v-else-if="selectedItem.is_vegetarian"
                  class="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded"
                >
                  Vegetarian
                </span>
                <span
                  v-if="selectedItem.is_gluten_free"
                  class="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded"
                >
                  Gluten-Free
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Extras Section -->
        <div v-if="availableExtras.length > 0" class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-1">Customize Your Order</h3>
          <p class="text-sm text-gray-600 mb-4">
            <span class="text-red-600">*</span> Required selections
          </p>
          <div class="space-y-2">
            <ExtraCheckbox
              v-for="extra in availableExtras"
              :key="extra.extra_id"
              :extra="extra"
              :selected="selectedExtraIds.has(extra.extra_id)"
              @toggle="toggleExtra(extra.extra_id)"
            />
          </div>
        </div>

        <!-- Quantity Selector -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Quantity</h3>
          <QuantitySelector
            v-model="quantity"
            :min="1"
            :max="selectedItem.max_per_order"
          />
        </div>
      </div>
    </main>

    <!-- Fixed Bottom Bar -->
    <div v-if="selectedItem" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
      <div class="max-w-2xl mx-auto p-4">
        <button
          @click="addToCart"
          :disabled="!allRequiredSelected"
          class="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-between"
        >
          <span>Add to Cart</span>
          <span class="text-lg">{{ formatPrice(totalPrice) }}</span>
        </button>
        <p v-if="!allRequiredSelected" class="text-sm text-red-600 text-center mt-2">
          Please select all required options
        </p>
      </div>
    </div>
  </div>
</template>