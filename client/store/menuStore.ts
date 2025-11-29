import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { getMenus } from "../services/menuService"
import type { Menu } from "../../shared/types"

export const useMenuStore = defineStore("menuStore", () => {
    // State
    const menus = ref<Menu[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const lastFetched = ref<number | null>(null)
    // Cache duration in milliseconds (5 minutes)
    const CACHE_DURATION = 5 * 60 * 1000

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
    async function fetchMenus(force = false) {
        // Return cached data if valid and not forced
        if (isCacheValid.value && !force && menus.value.length > 0) {
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

    async function fetchMenuByRestaurantId(restaurantId: string, force = false) {
        // Check if we already have this menu and cache is valid
        const cachedMenu = getMenuByRestaurantId.value(restaurantId)
        if (cachedMenu && isCacheValid.value && !force) {
            return cachedMenu
        }

        // If we don't have any menus or cache is invalid, fetch all menus
        await fetchMenus(force)

        return getMenuByRestaurantId.value(restaurantId)
    }

    function clearCache() {
        menus.value = []
        lastFetched.value = null
        error.value = null
    }

    return {
        // State
        menus,
        loading,
        error,
        lastFetched,

        // Getters
        activeMenus,
        getMenuByRestaurantId,
        isCacheValid,

        // Actions
        fetchMenus,
        fetchMenuByRestaurantId,
        clearCache
    }
})
