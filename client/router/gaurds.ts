import {useAuthStore} from "../store/authStore";
import router from "./index";

router.beforeEach(async (to, from) => {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn && to.name !== 'Login') {
        return { name: 'Login' }
    }
    if (authStore.isLoggedIn && to.name === 'Login') {
        return { name: 'Home' }
    }
});
