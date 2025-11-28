<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Menu, MenuGroup, MenuItem } from '../../shared/types'
import { getMenus } from '../services/menuService'
import NavigationHeader from '../components/NavigationHeader.vue'
import SelectionCard from '../components/SelectionCard.vue'

const router = useRouter()
const route = useRoute()

const menu = ref<Menu | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const restaurantId = computed(() => route.params.restaurantId as string)
const groupId = computed(() => route.params.groupId as string)

// Find the selected group
const selectedGroup = computed<MenuGroup | undefined>(() => {
  if (!menu.value) return undefined
  return menu.value.groups.find(g => g.group_id === groupId.value)
})

// Filter available items
const availableItems = computed(() => {
  if (!selectedGroup.value) return []
  return selectedGroup.value.items.filter(item => item.is_available)
})

onMounted(async () => {
  try {
    const data = await getMenus(restaurantId.value)
    if (data && data.length > 0) {
      menu.value = data[0]

      // Verify group exists
      if (!selectedGroup.value) {
        error.value = 'Category not found'
      }
    } else {
      error.value = 'Menu not found'
    }
  } catch (e) {
    error.value = 'Unable to load menu items'
    console.error(e)
  } finally {
    loading.value = false
  }
})

const selectItem = (item: MenuItem) => {
  router.push(`/menu/${restaurantId.value}/item/${item.item_id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <NavigationHeader
      :title="selectedGroup?.group_name || 'Menu Items'"
      :show-back="true"
    />

    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="n in 5" :key="n" class="bg-white rounded-lg shadow-sm p-4 animate-pulse flex gap-4">
          <div class="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
          <div class="flex-1">
            <div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-lg font-semibold text-red-900 mb-2">Unable to Load Items</h2>
        <p class="text-red-700 mb-4">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="availableItems.length === 0" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">No Items Available</h2>
        <p class="text-gray-600">This category has no available items at the moment</p>
      </div>

      <!-- Menu Items List -->
      <div v-else class="space-y-3">
        <SelectionCard
          v-for="item in availableItems"
          :key="item.item_id"
          :title="item.item_name"
          :subtitle="item.description"
          :image-url="item.image_url"
          :price="item.base_price"
          :is-available="item.is_available"
          :is-vegetarian="item.is_vegetarian"
          :is-vegan="item.is_vegan"
          :is-gluten-free="item.is_gluten_free"
          @click="selectItem(item)"
        >
          <div v-if="item.extras.length > 0" class="mt-2">
            <span class="text-xs text-gray-500">{{ item.extras.length }} customization{{ item.extras.length !== 1 ? 's' : '' }} available</span>
          </div>
        </SelectionCard>
      </div>
    </main>
  </div>
</template>