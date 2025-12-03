import api from "./api";
import type {CreateOrderRequest, Order} from "../../shared/types";

export const postOrder = async (order: CreateOrderRequest) => {
    try {
        const res = await api.post('/order', order);
        return res.data;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}

export const getMyOrders = async (): Promise<Order[]> => {
    try{
        const res = await api.get('/order/my-orders');
        if (res.status === 200) {
            return res.data;
        }
        return [];
    } catch (e) {
        console.error(e);
        return [];
    }
}
