import { Router } from "express";
import { authenticateToken } from "../middleware/auth.ts";
import { getMyOrders, createOrderController } from "../controllers/orderController.ts";

const router = Router();

router.get('/my-orders', authenticateToken, getMyOrders);

router.post('/', authenticateToken, createOrderController);

export default router;
