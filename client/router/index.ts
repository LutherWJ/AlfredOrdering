import { createWebHistory, createRouter } from 'vue-router'
import Login from "../views/Login.vue";
import Home from "../views/Home.vue";
import MenuSelect from "../views/MenuSelect.vue";
import MenuGroupSelect from "../views/MenuGroupSelect.vue";
import MenuItemSelect from "../views/MenuItemSelect.vue";
import ItemExtraSelect from "../views/ItemExtraSelect.vue";
import Cart from "../views/Cart.vue";
import Checkout from "../views/Checkout.vue";
import { useAuthStore } from '../store/authStore';


const routes = [
    { path: '/login', name: 'Login', component: Login },
    { path: '/', name: 'Home', component: Home },
    { path: '/menus', name: 'MenuSelect', component: MenuSelect },
    { path: '/menu/:restaurantId', name: 'MenuGroupSelect', component: MenuGroupSelect },
    { path: '/menu/:restaurantId/group/:groupId', name: 'MenuItemSelect', component: MenuItemSelect },
    { path: '/menu/:restaurantId/item/:itemId', name: 'ItemExtraSelect', component: ItemExtraSelect },
    { path: '/cart', name: 'Cart', component: Cart },
    { path: '/checkout', name: 'Checkout', component: Checkout },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Navigation guards
router.beforeEach(async (to, from) => {
    const authStore = useAuthStore();

    // Check auth status on first navigation if not already checked
    if (!authStore.authChecked) {
        await authStore.checkAuth();
    }

    // Redirect to login if not authenticated
    if (!authStore.isLoggedIn && to.name !== 'Login') {
        return { name: 'Login' }
    }

    // Redirect to home if already logged in and trying to access login
    if (authStore.isLoggedIn && to.name === 'Login') {
        return { name: 'Home' }
    }
});

export default router

