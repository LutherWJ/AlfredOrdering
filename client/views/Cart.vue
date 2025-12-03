<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cartStore'
import { useMenuStore } from '../store/menuStore'
import type { Menu, MenuItem, MenuExtra, SelectedExtra } from '../../shared/types'
import { SALES_TAX } from '../../shared/constants'
import NavigationHeader from '../components/NavigationHeader.vue'
import QuantitySelector from '../components/QuantitySelector.vue'

const router = useRouter()
const cartStore = useCartStore()
const menuStore = useMenuStore()

const menu = computed(() => {
  if (!cartStore.restaurant_id) return null
  return menuStore.getMenuByRestaurantId(cartStore.restaurant_id)
})

// Enriched cart items with display data from menu
interface CartItemDisplay {
  index: number
  item_id: string
  quantity: number
  extras: SelectedExtra[]
  // Looked up from menu:
  item_name: string
  base_price: number
  image_url?: string
  max_per_order: number
  extra_details: Array<{
    extra_name: string
    price_delta: number
    nested?: Array<{
      extra_name: string
      price_delta: number
    }>
  }>
  extras_total: number
}

// Recursively find a menu extra by ID in nested structure
function findMenuExtra(extras: MenuExtra[], extraId: string): MenuExtra | undefined {
  for (const extra of extras) {
    if (extra.extra_id === extraId) {
      return extra
    }
    if (extra.extras && extra.extras.length > 0) {
      const found = findMenuExtra(extra.extras, extraId)
      if (found) return found
    }
  }
  return undefined
}

// Recursively calculate total from nested extras
function calculateExtrasTotal(menuExtras: MenuExtra[], selectedExtras: SelectedExtra[]): number {
  let total = 0

  for (const selected of selectedExtras) {
    const menuExtra = findMenuExtra(menuExtras, selected.extra_id)
    if (menuExtra) {
      total += menuExtra.price_delta

      // Add nested extras total
      if (selected.extras && selected.extras.length > 0) {
        total += calculateExtrasTotal(menuExtras, selected.extras)
      }
    }
  }

  return total
}

// Recursively build extra display details
function buildExtraDetails(menuExtras: MenuExtra[], selectedExtras: SelectedExtra[]): any[] {
  const details: any[] = []

  for (const selected of selectedExtras) {
    const menuExtra = findMenuExtra(menuExtras, selected.extra_id)
    if (menuExtra) {
      const detail: any = {
        extra_name: menuExtra.extra_name,
        price_delta: menuExtra.price_delta
      }

      // Add nested extras
      if (selected.extras && selected.extras.length > 0) {
        detail.nested = buildExtraDetails(menuExtras, selected.extras)
      }

      details.push(detail)
    }
  }

  return details
}

const cartItemsDisplay = computed<CartItemDisplay[]>(() => {
  if (!menu.value) {
    console.log('[Cart] No menu loaded yet')
    return []
  }

  console.log('[Cart] Processing cart items:', {
    cartItemCount: cartStore.items.length,
    menuGroups: menu.value.groups.length
  })

  return cartStore.items.map((cartItem, index) => {
    // Find the menu item
    let menuItem: MenuItem | undefined
    for (const group of menu.value!.groups) {
      menuItem = group.items.find(i => i.item_id === cartItem.item_id)
      if (menuItem) break
    }

    if (!menuItem) {
      // Item not found in menu - shouldn't happen but handle gracefully
      return {
        index,
        ...cartItem,
        item_name: 'Unknown Item',
        base_price: 0,
        max_per_order: 10,
        extra_details: [],
        extras_total: 0
      }
    }

    // Calculate extras total and build display details
    const extras_total = calculateExtrasTotal(menuItem.extras, cartItem.extras)
    const extra_details = buildExtraDetails(menuItem.extras, cartItem.extras)

    return {
      index,
      item_id: cartItem.item_id,
      quantity: cartItem.quantity,
      extras: cartItem.extras,
      item_name: menuItem.item_name,
      base_price: menuItem.base_price,
      image_url: menuItem.image_url,
      max_per_order: menuItem.max_per_order,
      extra_details,
      extras_total
    }
  })
})

const subtotal = computed(() => {
  return cartItemsDisplay.value.reduce((sum, item) => {
    return sum + (item.base_price + item.extras_total) * item.quantity
  }, 0)
})

const tax = computed(() => subtotal.value * SALES_TAX)
const total = computed(() => subtotal.value + tax.value)

onMounted(async () => {
  if (!cartStore.restaurant_id) {
    router.push('/menus')
    return
  }

  // Fetch menu from store (will use cache if available)
  await menuStore.fetchMenuByRestaurantId(cartStore.restaurant_id)
})

const updateQuantity = (index: number, quantity: number) => {
  cartStore.updateItemQuantity(index, quantity)
}

const removeItem = (index: number) => {
  cartStore.removeItem(index)
}

const continueShopping = () => {
  router.push(`/menu/${cartStore.restaurant_id}`)
}

const proceedToCheckout = () => {
  router.push('/checkout')
}

const formatPrice = (price: number) => {
  return `$${price.toFixed(2)}`
}

const calculateItemTotal = (item: CartItemDisplay) => {
  return (item.base_price + item.extras_total) * item.quantity
}

// Recursively render extra details
function renderExtras(extras: any[], depth = 0): string {
  return extras.map(extra => {
    const indent = '  '.repeat(depth)
    let text = `${indent}+ ${extra.extra_name}`
    if (extra.price_delta !== 0) {
      text += ` (${formatPrice(extra.price_delta)})`
    }
    if (extra.nested && extra.nested.length > 0) {
      text += '\n' + renderExtras(extra.nested, depth + 1)
    }
    return text
  }).join('\n')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-32">
    <NavigationHeader
      title="Your Cart"
      :show-back="true"
      back-route="/"
    />

    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="menuStore.loading" class="space-y-4">
        <div v-for="n in 3" :key="n" class="bg-white rounded-lg shadow-sm p-4 animate-pulse">
          <div class="flex gap-4">
            <div class="w-20 h-20 bg-gray-200 rounded-lg"></div>
            <div class="flex-1">
              <div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty Cart -->
      <div v-else-if="!cartStore.hasItems" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Your Cart is Empty</h2>
        <p class="text-gray-600 mb-6">Add some delicious items to get started!</p>
        <button
          @click="continueShopping"
          class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Menu
        </button>
      </div>

      <!-- Cart Items -->
      <div v-else class="space-y-6">
        <!-- Items List -->
        <div class="space-y-4">
          <div
            v-for="item in cartItemsDisplay"
            :key="item.index"
            class="bg-white rounded-lg shadow-sm p-4"
          >
            <div class="flex gap-4">
              <!-- Image -->
              <img
                v-if="item.image_url"
                :src="item.image_url"
                :alt="item.item_name"
                class="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />

              <!-- Details -->
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 mb-1">{{ item.item_name }}</h3>
                <p class="text-sm text-gray-600">{{ formatPrice(item.base_price) }}</p>

                <!-- Extras (Nested) -->
                <div v-if="item.extra_details.length > 0" class="mt-2 space-y-1">
                  <template v-for="(extra, idx) in item.extra_details" :key="idx">
                    <p class="text-xs text-gray-500">
                      + {{ extra.extra_name }}
                      <span v-if="extra.price_delta !== 0">({{ formatPrice(extra.price_delta) }})</span>
                    </p>
                    <!-- Nested extras -->
                    <template v-if="extra.nested">
                      <p
                        v-for="(nested, nestedIdx) in extra.nested"
                        :key="nestedIdx"
                        class="text-xs text-gray-400 ml-3"
                      >
                        + {{ nested.extra_name }}
                        <span v-if="nested.price_delta !== 0">({{ formatPrice(nested.price_delta) }})</span>
                      </p>
                    </template>
                  </template>
                </div>

                <!-- Quantity and Remove -->
                <div class="mt-3 flex items-center justify-between">
                  <QuantitySelector
                    :model-value="item.quantity"
                    :min="1"
                    :max="item.max_per_order"
                    @update:model-value="updateQuantity(item.index, $event)"
                  />
                  <button
                    @click="removeItem(item.index)"
                    class="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <!-- Item Total -->
              <div class="text-right flex-shrink-0">
                <p class="font-semibold text-gray-900">{{ formatPrice(calculateItemTotal(item)) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
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
              <div class="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>{{ formatPrice(total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Fixed Bottom Buttons -->
    <div v-if="cartStore.hasItems" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
      <div class="max-w-2xl mx-auto p-4 flex gap-3">
        <button
          @click="continueShopping"
          class="flex-1 bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Add More Items
        </button>
        <button
          @click="proceedToCheckout"
          class="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Checkout
        </button>
      </div>
    </div>
  </div>
</template>