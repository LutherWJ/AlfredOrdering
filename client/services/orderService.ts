import api from "./api";
import {CreateOrderRequest, type Order} from "../../shared/types";

export const postOrder = async (order: CreateOrderRequest) => {
    try {
        const res = await api.post('/orders', order);
    }
    catch (e) {
        console.error(e);
    }
}

export const getMyOrders = async (): Promise<Order | null> => {
    try{
        const res = await api.get('/my-orders');
        if (res.status === 200) {
            return res.data;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}
