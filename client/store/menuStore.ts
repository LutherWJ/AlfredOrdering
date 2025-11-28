import {defineStore} from "pinia";
import {getMenus} from "../services/menuService";
import {type Menu} from "../../shared/types";

const useMenuStore = defineStore("menuStore", () => ({
    state: () => ({
        menus: [] as Menu[],
    }),

    actions: {
        updateMenuList: async (state: Menu[]) => {
            const data = await getMenus();
            if (!data) return;
            state = data;
        }
    }
}))
