import {useAuthStore} from './../store/authStore'
import api from './../services/api'

export async function login(email: string): Promise<boolean> {
    const authStore = useAuthStore()
    try {
        const res = await api.post('/auth/login', {email: email})
        if (res.status === 200) {
            authStore.isLoggedIn = true;
            authStore.userID = res.data.customer._id;
            authStore.email = res.data.customer.email;
        }
        return true;
    } catch (error) {
        console.error(error)
        return false;
    }
}

export function logout() {
    const authStore = useAuthStore()
    authStore.$reset();
}
