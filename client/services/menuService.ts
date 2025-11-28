import api from "./api";
import type {Menu} from "../../shared/types";

export const getMenus = async (id?: string): Promise<Menu[] | null> => {
    try {
        const res = await api.get('/menu',{params: id ? { id } : undefined});
        if (res.status !== 200) {
            console.error(res.statusText);
            return null;
        }
        return res.data;
    } catch (e) {
        console.error(e);
        return null;
    }
}
