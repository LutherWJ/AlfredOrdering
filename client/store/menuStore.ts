import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { getMenus } from "../services/menuService"
import type { Menu } from "../../shared/types"

export const useMenuStore = defineStore("menuStore", () => {
    const menus = ref<Menu[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const lastFetched = ref<number | null>(null)
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

    // Getters
    const activeMenus = computed(() =>
        menus.value.filter(menu => menu.is_active)
    )

    const getMenuByRestaurantId = computed(() => {
        return (restaurantId: string) =>
            menus.value.find(menu => menu.restaurant_id === restaurantId)
    })

    const isCacheValid = computed(() => {
        if (!lastFetched.value) return false
        return Date.now() - lastFetched.value < CACHE_DURATION
    })

    // Actions
    async function fetchMenus() {
        // Return cached data if valid
        if (isCacheValid.value && menus.value.length > 0) {
            return menus.value
        }

        loading.value = true
        error.value = null

        try {
            const data = await getMenus()
            if (data) {
                menus.value = data
                lastFetched.value = Date.now()
                return data
            } else {
                error.value = 'Failed to load menus'
                return null
            }
        } catch (e) {
            error.value = 'Unable to connect to server'
            console.error(e)
            return null
        } finally {
            loading.value = false
        }
    }

    async function fetchMenuByRestaurantId(restaurantId: string) {
        // Check if we already have this menu and cache is valid
        const cachedMenu = getMenuByRestaurantId.value(restaurantId)
        if (cachedMenu && isCacheValid.value) {
            return cachedMenu
        }

        // If we don't have any menus or cache is invalid, fetch all menus
        await fetchMenus()

        return getMenuByRestaurantId.value(restaurantId)
    }

    function clearCache() {
        menus.value = []
        lastFetched.value = null
        error.value = null
    }

    return {
        menus,
        loading,
        error,
        lastFetched,
        activeMenus,
        getMenuByRestaurantId,
        isCacheValid,
        fetchMenus,
        fetchMenuByRestaurantId,
        clearCache
    }
})
