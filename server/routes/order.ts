import { Router } from "express";
import { authenticateToken } from "../middleware/auth.ts";
import Order from "../models/Order.ts";
import { validateOrder } from "../utils/validation.ts";
import { createOrder } from "../services/orderService.ts";

const router = Router();

router.get('/my-orders', authenticateToken, async (req, res) => {
    // @ts-ignore
    const data = await Order.find({ 'customer.customer_id': req.customer_id })
        .sort({ createdAt: -1 });
    res.json(data);
});

router.post('/', authenticateToken, async (req, res) => {
    const validationResult = validateOrder(req.body);
    if (!validationResult.ok) {
        return res.status(400).json({ message: validationResult.error });
    }

    const orderData = validationResult.value;
    // @ts-ignore
    const customerID = req.customer_id;

    try {
        const order = await createOrder({
            customer_id: customerID,
            restaurant_id: orderData.restaurant_id,
            items: orderData.items,
            pickup_time_requested: orderData.pickup_time_requested,
            special_instructions: orderData.special_instructions
        });

        res.status(201).json(order);

    } catch (error) {
        console.error('Order creation error:', error);

        // Handle specific error types with appropriate status codes
        if (error instanceof Error) {
            if (error.message.includes('Customer not found')) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            if (error.message.includes('Menu not found')) {
                return res.status(404).json({ message: 'Restaurant menu not found' });
            }
            if (error.message.includes('Item') && error.message.includes('not found')) {
                return res.status(400).json({ message: 'One or more items are invalid' });
            }
            if (error.message.includes('Extra') && error.message.includes('not found')) {
                return res.status(400).json({ message: 'One or more extras are invalid' });
            }
            if (error.message.includes('unavailable')) {
                // Extract just the item/extra name if possible, otherwise generic message
                const match = error.message.match(/^(.+?) is currently unavailable$/);
                if (match) {
                    return res.status(400).json({ message: `${match[1]} is currently unavailable` });
                }
                return res.status(400).json({ message: 'One or more items are currently unavailable' });
            }
        }

        res.status(500).json({ message: 'Unable to create order. Please try again later.' });
    }
});

export default router;
