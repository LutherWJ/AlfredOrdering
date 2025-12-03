<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders } from '../services/orderService'
import { useCartStore } from '../store/cartStore'
import type { Order, OrderStatus } from '../../shared/types'

const router = useRouter()
const cartStore = useCartStore()
const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const activeOrders = computed(() =>
  orders.value.filter(order =>
    ['pending', 'preparing', 'ready'].includes(order.status) && !order.is_cancelled
  )
)

const completedOrders = computed(() =>
  orders.value.filter(order =>
    order.status === 'completed' || order.is_cancelled
  )
)

const fetchOrders = async () => {
  loading.value = true
  error.value = null
  try {
    orders.value = await getMyOrders()
  } catch (e) {
    error.value = 'Failed to load orders. Please try again.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrders()
})

const goToMenus = () => {
  router.push('/menus')
}

const getStatusColor = (status: OrderStatus, isCancelled: boolean) => {
  if (isCancelled) return 'bg-gray-100 text-gray-700'
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-700'
    case 'preparing': return 'bg-blue-100 text-blue-700'
    case 'ready': return 'bg-green-100 text-green-700'
    case 'completed': return 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getStatusText = (status: OrderStatus, isCancelled: boolean) => {
  if (isCancelled) return 'Cancelled'
  switch (status) {
    case 'pending': return 'Order Received'
    case 'preparing': return 'Being Prepared'
    case 'ready': return 'Ready for Pickup'
    case 'completed': return 'Completed'
    default: return status
  }
}

const formatDate = (date: Date) => {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const formatPrice = (amount: number) => {
  return `$${amount.toFixed(2)}`
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-2xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Alfred Ordering</h1>
            <p class="text-sm text-gray-600 mt-1">Your order history</p>
          </div>
          <router-link to="/cart" class="relative">
            <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span
              v-if="cartStore.itemCount > 0"
              class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
            >
              {{ cartStore.itemCount }}
            </span>
          </router-link>
        </div>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- Order Food Button (Always Visible) -->
      <button
        @click="goToMenus"
        class="w-full bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 p-6 mb-6 active:scale-98 flex items-center justify-center gap-3"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="text-lg font-semibold">Order Food</span>
      </button>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="n in 3" :key="n" class="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-lg font-semibold text-red-900 mb-2">Unable to Load Orders</h2>
        <p class="text-red-700 mb-4">{{ error }}</p>
        <button
          @click="fetchOrders"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="orders.length === 0" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
        <p class="text-gray-600">Place your first order to see it here</p>
      </div>

      <!-- Orders List -->
      <div v-else class="space-y-6">
        <!-- Active Orders Section -->
        <div v-if="activeOrders.length > 0">
          <h2 class="text-lg font-bold text-gray-900 mb-3 px-1">Active Orders</h2>
          <div class="space-y-4">
            <div
              v-for="order in activeOrders"
              :key="order.id"
              class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <!-- Order Header -->
              <div class="p-4 bg-gray-50 border-b border-gray-200">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <div class="text-sm font-semibold text-gray-900">{{ order.order_number }}</div>
                    <div class="text-xs text-gray-600 mt-1">
                      {{ formatDate(order.order_datetime) }} at {{ formatTime(order.order_datetime) }}
                    </div>
                  </div>
                  <span :class="['px-3 py-1 rounded-full text-xs font-semibold', getStatusColor(order.status, order.is_cancelled)]">
                    {{ getStatusText(order.status, order.is_cancelled) }}
                  </span>
                </div>
                <div class="text-sm font-medium text-gray-800">{{ order.restaurant.name }}</div>
                <div class="text-xs text-gray-600">{{ order.restaurant.location }}</div>
              </div>

              <!-- Order Items -->
              <div class="p-4">
                <div class="space-y-3">
                  <div v-for="item in order.items" :key="item.order_item_id" class="flex justify-between text-sm">
                    <div class="flex-1">
                      <div class="font-medium text-gray-900">
                        {{ item.quantity }}x {{ item.item_name }}
                      </div>
                      <div v-if="item.extras.length > 0" class="text-xs text-gray-600 mt-1 ml-4">
                        <div v-for="extra in item.extras" :key="extra.extra_id">
                          + {{ extra.extra_name }}
                        </div>
                      </div>
                    </div>
                    <div class="text-gray-700 font-medium ml-4">
                      {{ formatPrice(item.line_subtotal) }}
                    </div>
                  </div>
                </div>

                <!-- Special Instructions -->
                <div v-if="order.special_instructions" class="mt-3 pt-3 border-t border-gray-200">
                  <div class="text-xs text-gray-600">Note:</div>
                  <div class="text-sm text-gray-800">{{ order.special_instructions }}</div>
                </div>

                <!-- Order Total -->
                <div class="mt-4 pt-3 border-t border-gray-200 space-y-1">
                  <div class="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{{ formatPrice(order.subtotal_amount) }}</span>
                  </div>
                  <div class="flex justify-between text-sm text-gray-600">
                    <span>Tax</span>
                    <span>{{ formatPrice(order.tax_amount) }}</span>
                  </div>
                  <div class="flex justify-between text-base font-bold text-gray-900 pt-1">
                    <span>Total</span>
                    <span>{{ formatPrice(order.total_amount) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed Orders Section -->
        <div v-if="completedOrders.length > 0">
          <h2 class="text-lg font-bold text-gray-900 mb-3 px-1">Previous Orders</h2>
          <div class="space-y-4">
            <div
              v-for="order in completedOrders"
              :key="order.id"
              class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden opacity-90"
            >
              <!-- Order Header -->
              <div class="p-4 bg-gray-50 border-b border-gray-200">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <div class="text-sm font-semibold text-gray-900">{{ order.order_number }}</div>
                    <div class="text-xs text-gray-600 mt-1">
                      {{ formatDate(order.order_datetime) }} at {{ formatTime(order.order_datetime) }}
                    </div>
                  </div>
                  <span :class="['px-3 py-1 rounded-full text-xs font-semibold', getStatusColor(order.status, order.is_cancelled)]">
                    {{ getStatusText(order.status, order.is_cancelled) }}
                  </span>
                </div>
                <div class="text-sm font-medium text-gray-800">{{ order.restaurant.name }}</div>
                <div class="text-xs text-gray-600">{{ order.restaurant.location }}</div>
              </div>

              <!-- Order Items -->
              <div class="p-4">
                <div class="space-y-3">
                  <div v-for="item in order.items" :key="item.order_item_id" class="flex justify-between text-sm">
                    <div class="flex-1">
                      <div class="font-medium text-gray-900">
                        {{ item.quantity }}x {{ item.item_name }}
                      </div>
                      <div v-if="item.extras.length > 0" class="text-xs text-gray-600 mt-1 ml-4">
                        <div v-for="extra in item.extras" :key="extra.extra_id">
                          + {{ extra.extra_name }}
                        </div>
                      </div>
                    </div>
                    <div class="text-gray-700 font-medium ml-4">
                      {{ formatPrice(item.line_subtotal) }}
                    </div>
                  </div>
                </div>

                <!-- Order Total -->
                <div class="mt-4 pt-3 border-t border-gray-200">
                  <div class="flex justify-between text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span>{{ formatPrice(order.total_amount) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.active\:scale-98:active {
  transform: scale(0.98);
}

@media (max-width: 640px) {
  button {
    min-height: 44px;
  }
}
</style>
