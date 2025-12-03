<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '../store/cartStore'
import { useMenuStore } from '../store/menuStore'
import type { MenuGroup } from '../../shared/types'
import NavigationHeader from '../components/NavigationHeader.vue'
import SelectionCard from '../components/SelectionCard.vue'
import FloatingCheckoutButton from '../components/FloatingCheckoutButton.vue'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const menuStore = useMenuStore()

const restaurantId = computed(() => route.params.restaurantId as string)

// Get menu from store
const menu = computed(() => menuStore.getMenuByRestaurantId(restaurantId.value))

// Filter and sort active groups
const activeGroups = computed(() => {
  if (!menu.value) return []
  return menu.value.groups
    .filter(group => group.is_active)
    .sort((a, b) => a.display_order - b.display_order)
})

onMounted(async () => {
  // Fetch menu from store (will use cache if available)
  const fetchedMenu = await menuStore.fetchMenuByRestaurantId(restaurantId.value)

  if (fetchedMenu) {
    // Set restaurant in cart store
    cartStore.setRestaurant(fetchedMenu.restaurant_id)
  }
})

const selectGroup = (group: MenuGroup) => {
  router.push(`/menu/${restaurantId.value}/group/${group.group_id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <NavigationHeader
      :title="menu?.restaurant_name || 'Menu'"
      :show-back="true"
      back-route="/menus"
    />

    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- Restaurant Info -->
      <div v-if="menu" class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h2 class="font-semibold text-gray-900 mb-1">{{ menu.restaurant_name }}</h2>
        <p class="text-sm text-gray-600">{{ menu.restaurant_location }}</p>
        <p v-if="menu.restaurant_phone" class="text-sm text-gray-600">{{ menu.restaurant_phone }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="menuStore.loading" class="space-y-4">
        <div v-for="n in 4" :key="n" class="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="menuStore.error || !menu" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-lg font-semibold text-red-900 mb-2">Unable to Load Menu</h2>
        <p class="text-red-700 mb-4">{{ menuStore.error || 'Menu not found' }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="activeGroups.length === 0" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">No Categories Available</h2>
        <p class="text-gray-600">This menu has no active categories at the moment</p>
      </div>

      <!-- Menu Groups List -->
      <div v-else class="space-y-3">
        <p class="text-sm text-gray-600 mb-4">Select a category to view items</p>
        <SelectionCard
          v-for="group in activeGroups"
          :key="group.group_id"
          :title="group.group_name"
          :subtitle="`${group.items.length} items`"
          @click="selectGroup(group)"
        />
      </div>
    </main>

    <!-- Floating Checkout Button -->
    <FloatingCheckoutButton />
  </div>
</template>