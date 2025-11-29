<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '../store/cartStore'
import { useMenuStore } from '../store/menuStore'
import type { MenuItem, SelectedExtra, MenuExtra } from '../../shared/types'
import NavigationHeader from '../components/NavigationHeader.vue'
import QuantitySelector from '../components/QuantitySelector.vue'
import ExtraSelector from '../components/ExtraSelector.vue'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const menuStore = useMenuStore()

const quantity = ref(1)
const selectedExtras = ref<SelectedExtra[]>([])

const restaurantId = computed(() => route.params.restaurantId as string)
const itemId = computed(() => route.params.itemId as string)

// Get menu from store
const menu = computed(() => menuStore.getMenuByRestaurantId(restaurantId.value))

// Find the selected item
const selectedItem = computed<MenuItem | undefined>(() => {
  if (!menu.value) return undefined
  for (const group of menu.value.groups) {
    const item = group.items.find(i => i.item_id === itemId.value)
    if (item) return item
  }
  return undefined
})

// Filter available extras (top-level only for display)
const availableExtras = computed(() => {
  if (!selectedItem.value) return []
  return selectedItem.value.extras.filter(extra => extra.is_available)
})

// Recursively check if all required extras are selected
function checkRequiredExtras(menuExtras: MenuExtra[], selected: SelectedExtra[]): boolean {
  for (const menuExtra of menuExtras) {
    if (menuExtra.is_required && menuExtra.is_available) {
      const isSelected = selected.some(se => se.extra_id === menuExtra.extra_id)
      if (!isSelected) return false

      // If this required extra has nested extras, check them too
      if (menuExtra.extras && menuExtra.extras.length > 0) {
        const selectedExtra = selected.find(se => se.extra_id === menuExtra.extra_id)
        if (selectedExtra && selectedExtra.extras) {
          const nestedValid = checkRequiredExtras(menuExtra.extras, selectedExtra.extras)
          if (!nestedValid) return false
        }
      }
    }
  }
  return true
}

// Check if all required extras are selected
const allRequiredSelected = computed(() => {
  if (!selectedItem.value) return false
  return checkRequiredExtras(selectedItem.value.extras, selectedExtras.value)
})

// Recursively calculate total from nested extras
function calculateExtrasTotal(menuExtras: MenuExtra[], selected: SelectedExtra[]): number {
  let total = 0

  for (const selectedExtra of selected) {
    const menuExtra = menuExtras.find(me => me.extra_id === selectedExtra.extra_id)
    if (menuExtra) {
      total += menuExtra.price_delta

      // Add nested extras total
      if (menuExtra.extras && selectedExtra.extras) {
        total += calculateExtrasTotal(menuExtra.extras, selectedExtra.extras)
      }
    }
  }

  return total
}

// Calculate total price
const totalPrice = computed(() => {
  if (!selectedItem.value) return 0

  const extrasTotal = calculateExtrasTotal(selectedItem.value.extras, selectedExtras.value)
  return (selectedItem.value.base_price + extrasTotal) * quantity.value
})

onMounted(async () => {
  // Fetch menu from store (will use cache if available)
  await menuStore.fetchMenuByRestaurantId(restaurantId.value)
})

const addToCart = () => {
  if (!selectedItem.value || !allRequiredSelected.value) return

  cartStore.addItem(
    selectedItem.value.item_id,
    quantity.value,
    selectedExtras.value
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
      <div v-if="menuStore.loading" class="space-y-4">
        <div class="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div class="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="menuStore.error || !selectedItem" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-lg font-semibold text-red-900 mb-2">Unable to Load Item</h2>
        <p class="text-red-700 mb-4">{{ menuStore.error || 'Item not found' }}</p>
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

        <!-- Extras Section (supports nested extras recursively) -->
        <div v-if="availableExtras.length > 0" class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-1">Customize Your Order</h3>
          <p class="text-sm text-gray-600 mb-4">
            <span class="text-red-600">*</span> Required selections
          </p>
          <div class="space-y-3">
            <ExtraSelector
              v-for="extra in availableExtras"
              :key="extra.extra_id"
              :extra="extra"
              v-model="selectedExtras"
              :depth="0"
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