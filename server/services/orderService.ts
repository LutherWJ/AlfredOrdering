import mongoose from "mongoose";
import Menu from "../models/Menu.ts";
import Customer from "../models/Customer.ts";
import Order from "../models/Order.ts";
import { SALES_TAX } from "../../shared/constants.ts";

/**
 * Finds a menu item by ID within a menu's nested group structure
 */
export function findMenuItem(menu: any, itemId: string) {
    for (const group of menu.groups) {
        const menuItem = group.items.find((item: any) =>
            item.item_id.toString() === itemId.toString()
        );
        if (menuItem) return menuItem;
    }
    return null;
}

/**
 * Recursively finds an extra within a menu extra array
 * Searches the current level and all nested levels
 */
export function findMenuExtraRecursive(menuExtras: any[], extraId: string): any {
    for (const extra of menuExtras) {
        if (extra.extra_id.toString() === extraId.toString()) {
            return extra;
        }
        // Search nested extras recursively
        if (extra.extras && extra.extras.length > 0) {
            const found = findMenuExtraRecursive(extra.extras, extraId);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Validates that an item is available for ordering
 * Throws an error if unavailable
 */
export function validateItemAvailability(menuItem: any) {
    if (!menuItem.is_available) {
        throw new Error(`${menuItem.item_name} is currently unavailable`);
    }
}

/**
 * Validates that an extra is available for ordering
 * Throws an error if unavailable
 */
export function validateExtraAvailability(menuExtra: any) {
    if (!menuExtra.is_available) {
        throw new Error(`${menuExtra.extra_name} is currently unavailable`);
    }
}

/**
 * Recursively validates that required extras at a level have been selected
 * Throws an error if any required extras are missing
 */
export function validateRequiredExtras(menuExtras: any[], orderedExtras: any[] = []) {
    for (const menuExtra of menuExtras) {
        if (menuExtra.is_required) {
            const selected = orderedExtras.some(
                (oe: any) => oe.extra_id === menuExtra.extra_id.toString()
            );
            if (!selected) {
                throw new Error(`${menuExtra.extra_name} is required`);
            }
        }
    }
}

/**
 * Recursively processes ordered extras, validates availability, and creates snapshot objects
 * Supports nested extras for complex menu structures (e.g., meals with entrees that have toppings)
 * Returns array of extra snapshots and total price of all extras (including nested)
 */
export function processOrderExtras(menuExtras: any[], orderedExtras: any[] = []): { orderExtras: any[], extrasTotal: number } {
    const orderExtras = [];
    let extrasTotal = 0;

    // Validate required extras at this level
    validateRequiredExtras(menuExtras, orderedExtras);

    for (const orderedExtra of orderedExtras) {
        // Find the menu extra at this level
        const menuExtra = menuExtras.find((extra: any) =>
            extra.extra_id.toString() === orderedExtra.extra_id.toString()
        );

        if (!menuExtra) {
            throw new Error(`Extra ${orderedExtra.extra_id} not found`);
        }

        // Validate availability
        validateExtraAvailability(menuExtra);

        // Recursively process nested extras
        const nestedResult = processOrderExtras(
            menuExtra.extras || [],
            orderedExtra.extras || []
        );

        // Create snapshot with nested extras
        orderExtras.push({
            extra_id: menuExtra.extra_id,
            extra_name: menuExtra.extra_name,
            extra_price: menuExtra.price_delta,
            extras: nestedResult.orderExtras  // Include nested snapshots
        });

        // Add this extra's price plus all nested prices
        extrasTotal += menuExtra.price_delta + nestedResult.extrasTotal;
    }

    return { orderExtras, extrasTotal };
}

/**
 * Processes a single ordered item: validates availability, processes extras,
 * calculates totals, and creates order item snapshot
 */
export function processOrderItem(menu: any, orderedItem: any) {
    const menuItem = findMenuItem(menu, orderedItem.item_id);

    if (!menuItem) {
        throw new Error(`Item ${orderedItem.item_id} not found`);
    }

    // THE ENTIRE PROBLEM WE'RE TRYING TO SOLVE: DON'T FORGET!!!
    validateItemAvailability(menuItem);

    const { orderExtras, extrasTotal } = processOrderExtras(
        menuItem.extras,
        orderedItem.extras
    );

    const itemTotal = (menuItem.base_price + extrasTotal) * orderedItem.quantity;

    return {
        orderItem: {
            order_item_id: new mongoose.Types.ObjectId(),
            menu_item_id: menuItem.item_id,
            item_name: menuItem.item_name,
            description: menuItem.description,
            unit_price: menuItem.base_price,
            quantity: orderedItem.quantity,
            extras: orderExtras,
            line_subtotal: itemTotal
        },
        itemTotal
    };
}

/**
 * Processes all items in an order, returns orderItem array and subtotal
 */
export function processOrderItems(menu: any, items: any[]) {
    const orderItems = [];
    let subtotal = 0;

    for (const orderedItem of items) {
        const { orderItem, itemTotal } = processOrderItem(menu, orderedItem);
        orderItems.push(orderItem);
        subtotal += itemTotal;
    }

    return { orderItems, subtotal };
}

/**
 * Calculates tax amount from subtotal
 */
export function calculateTax(subtotal: number): number {
    return Math.round(subtotal * SALES_TAX * 100) / 100;
}

/**
 * Generates a unique order number
 */
export function generateOrderNumber(): string {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Creates a customer snapshot for the order
 */
export function createCustomerSnapshot(customer: any) {
    return {
        customer_id: customer._id,
        name: `${customer.fname} ${customer.lname}`,
        preferred_name: customer.preferred_name,
        email: customer.email,
        phone: customer.phone,
        student_id: customer.student_id
    };
}

/**
 * Creates a restaurant snapshot for the order
 */
export function createRestaurantSnapshot(menu: any) {
    return {
        restaurant_id: menu.restaurant_id,
        name: menu.restaurant_name,
        location: menu.restaurant_location,
        phone: menu.restaurant_phone
    };
}

/**
 * Main service function to create a complete order
 * Orchestrates all validation, processing, and order creation
 */
export async function createOrder(orderData: {
    customer_id: string;
    restaurant_id: string;
    items: any[];
    pickup_time_requested?: string;
    special_instructions?: string;
}) {
    const customer = await Customer.findById(orderData.customer_id);
    const menu = await Menu.findOne({ restaurant_id: orderData.restaurant_id });

    if (!customer) {
        throw new Error('Customer not found');
    }

    if (!menu) {
        throw new Error('Menu not found');
    }

    const { orderItems, subtotal } = processOrderItems(menu, orderData.items);
    const taxAmount = calculateTax(subtotal);
    const totalAmount = subtotal + taxAmount;

    const orderNumber = generateOrderNumber();
    const order = new Order({
        order_number: orderNumber,
        customer: createCustomerSnapshot(customer),
        restaurant: createRestaurantSnapshot(menu),
        items: orderItems,
        status: 'pending',
        order_datetime: new Date(),
        pickup_time_requested: orderData.pickup_time_requested
            ? new Date(orderData.pickup_time_requested)
            : null,
        subtotal_amount: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        special_instructions: orderData.special_instructions
    });

    await order.save();
    return order;
}