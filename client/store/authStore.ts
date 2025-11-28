import {defineStore} from "pinia";
import api from "../services/api";

export const useAuthStore = defineStore("useAuth", {
    state: () => {
        return {
            isLoggedIn: false as boolean,
            userID: null as string | null,
            email: null as string | null,
            authChecked: false as boolean, // Track if we've checked auth status
        }
    },
    actions: {
        async checkAuth() {
            try {
                const res = await api.get('/auth/me');
                if (res.status === 200 && res.data) {
                    this.isLoggedIn = true;
                    this.userID = res.data._id || res.data.id;
                    this.email = res.data.email;
                }
            } catch (error) {
                // Not logged in or token expired
                this.isLoggedIn = false;
                this.userID = null;
                this.email = null;
            } finally {
                this.authChecked = true;
            }
        }
    }
})

