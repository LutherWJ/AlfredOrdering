<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMenuStore } from '../store/menuStore'

const router = useRouter()
const menuStore = useMenuStore()

onMounted(async () => {
  await menuStore.fetchMenus()
})

const selectMenu = (restaurantId: string) => {
  router.push(`/menu/${restaurantId}`)
}

const reloadPage = async () => {
  await menuStore.fetchMenus(true) // Force refresh
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-2xl mx-auto px-4 py-4">
        <h1 class="text-2xl font-bold text-gray-900">Alfred Ordering</h1>
        <p class="text-sm text-gray-600 mt-1">Select a restaurant to order from</p>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="menuStore.loading" class="space-y-4">
        <div v-for="n in 3" :key="n" class="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="menuStore.error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-lg font-semibold text-red-900 mb-2">Unable to Load Menus</h2>
        <p class="text-red-700 mb-4">{{ menuStore.error }}</p>
        <button
          @click="reloadPage"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="menuStore.activeMenus.length === 0" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">No Restaurants Available</h2>
        <p class="text-gray-600">Check back later for available menus</p>
      </div>

      <!-- Menu List -->
      <div v-else class="space-y-4">
        <button
          v-for="menu in menuStore.activeMenus"
          :key="menu.id"
          @click="selectMenu(menu.restaurant_id)"
          class="w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6 text-left border border-gray-200 hover:border-blue-500 active:scale-98"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h2 class="text-xl font-bold text-gray-900 mb-2">
                {{ menu.restaurant_name }}
              </h2>

              <div class="flex items-center text-gray-600 mb-2">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="text-sm">{{ menu.restaurant_location }}</span>
              </div>

              <div v-if="menu.restaurant_phone" class="flex items-center text-gray-600">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span class="text-sm">{{ menu.restaurant_phone }}</span>
              </div>

              <!-- Menu Stats -->
              <div class="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span>{{ menu.groups.length }} categories</span>
                <span>•</span>
                <span>{{ menu.groups.reduce((acc, g) => acc + g.items.length, 0) }} items</span>
              </div>
            </div>

            <!-- Arrow Icon -->
            <svg class="w-6 h-6 text-gray-400 ml-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
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
    min-height: 44px; /* Apple's recommended touch target size */
  }
}
</style>
