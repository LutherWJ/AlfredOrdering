<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cartStore'
import type { Menu } from '../../shared/types'
import { getMenus } from '../services/menuService'
import { SALES_TAX } from '../../shared/constants'
import NavigationHeader from '../components/NavigationHeader.vue'
import api from '../services/api'

const router = useRouter()
const cartStore = useCartStore()

const menu = ref<Menu | null>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const pickupTime = ref<string>('')
const specialInstructions = ref<string>('')

// Calculate totals using same logic as Cart
const subtotal = computed(() => {
  if (!menu.value) return 0

  return cartStore.items.reduce((sum, cartItem) => {
    // Find menu item
    let menuItem
    for (const group of menu.value!.groups) {
      menuItem = group.items.find(i => i.item_id === cartItem.item_id)
      if (menuItem) break
    }
    if (!menuItem) return sum

    // Calculate extras total
    const extrasTotal = cartItem.extras.reduce((eSum, extraId) => {
      const extra = menuItem.extras.find(e => e.extra_id === extraId)
      return eSum + (extra?.price_delta || 0)
    }, 0)

    return sum + (menuItem.base_price + extrasTotal) * cartItem.quantity
  }, 0)
})

const tax = computed(() => subtotal.value * SALES_TAX)
const total = computed(() => subtotal.value + tax.value)

onMounted(async () => {
  if (!cartStore.hasItems || !cartStore.restaurant_id) {
    router.push('/cart')
    return
  }

  try {
    const data = await getMenus(cartStore.restaurant_id)
    if (data && data.length > 0) {
      menu.value = data[0]
    }
  } catch (e) {
    console.error('Failed to load menu:', e)
    error.value = 'Unable to load order details'
  } finally {
    loading.value = false
  }
})

const submitOrder = async () => {
  if (!cartStore.hasItems) return

  submitting.value = true
  error.value = null

  try {
    // Update cart store with optional fields
    if (pickupTime.value) {
      cartStore.setPickupTime(new Date(pickupTime.value).toISOString())
    }
    if (specialInstructions.value.trim()) {
      cartStore.setSpecialInstructions(specialInstructions.value.trim())
    }

    // Build order request
    const orderRequest = cartStore.buildOrderRequest()

    // Submit order
    const response = await api.post('/orders', orderRequest)

    if (response.status === 201) {
      // Order created successfully
      const order = response.data

      // Clear cart
      cartStore.clearCart()

      // Navigate to order confirmation or success page
      // For now, just go back to menus with alert
      alert(`Order placed successfully! Order #${order.order_number}`)
      router.push('/menus')
    } else {
      error.value = 'Failed to place order. Please try again.'
    }
  } catch (e: any) {
    console.error('Order submission failed:', e)
    error.value = e.response?.data?.error || 'Failed to place order. Please try again.'
  } finally {
    submitting.value = false
  }
}

const formatPrice = (price: number) => {
  return `$${price.toFixed(2)}`
}

// Get minimum pickup time (30 minutes from now)
const minPickupTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 30)
  return now.toISOString().slice(0, 16)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-32">
    <NavigationHeader
      title="Checkout"
      :show-back="true"
    />

    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="n in 3" :key="n" class="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else class="space-y-6">
        <!-- Error Alert -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800 text-sm">{{ error }}</p>
        </div>

        <!-- Restaurant Info -->
        <div v-if="menu" class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Pickup Location</h3>
          <div>
            <p class="font-medium text-gray-900">{{ menu.restaurant_name }}</p>
            <p class="text-sm text-gray-600">{{ menu.restaurant_location }}</p>
            <p v-if="menu.restaurant_phone" class="text-sm text-gray-600">{{ menu.restaurant_phone }}</p>
          </div>
        </div>

        <!-- Order Items Summary -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          <p class="text-sm text-gray-600 mb-2">{{ cartStore.itemCount }} item{{ cartStore.itemCount !== 1 ? 's' : '' }}</p>
          <button
            @click="router.push('/cart')"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit cart
          </button>
        </div>

        <!-- Pickup Time (Optional) -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Pickup Time (Optional)</h3>
          <input
            v-model="pickupTime"
            type="datetime-local"
            :min="minPickupTime"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="text-xs text-gray-500 mt-2">Leave blank for ASAP pickup (approx. 15-20 min)</p>
        </div>

        <!-- Special Instructions (Optional) -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Special Instructions (Optional)</h3>
          <textarea
            v-model="specialInstructions"
            rows="3"
            placeholder="Any special requests or dietary notes..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          ></textarea>
        </div>

        <!-- Order Total -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Order Total</h3>
          <div class="space-y-2">
            <div class="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{{ formatPrice(subtotal) }}</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>Tax ({{ (SALES_TAX * 100).toFixed(0) }}%)</span>
              <span>{{ formatPrice(tax) }}</span>
            </div>
            <div class="border-t border-gray-200 pt-2 mt-2">
              <div class="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>{{ formatPrice(total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Fixed Bottom Button -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
      <div class="max-w-2xl mx-auto p-4">
        <button
          @click="submitOrder"
          :disabled="submitting || !cartStore.hasItems"
          class="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="submitting">Placing Order...</span>
          <span v-else>Place Order - {{ formatPrice(total) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>