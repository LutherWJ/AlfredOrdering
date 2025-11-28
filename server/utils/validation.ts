import mongoose from 'mongoose';
import type { CreateOrderRequest } from '../../shared/types';
import { type Result, ok, err } from '../../shared/types';

export function isValidObjectId(id: unknown): id is string {
    return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

export function validateOrder(body: unknown): Result<CreateOrderRequest, string> {
    if (!body || typeof body !== 'object') {
        return err('Request body must be an object');
    }

    const data = body as Record<string, unknown>;

    if (!data.restaurant_id || typeof data.restaurant_id !== 'string') {
        return err('restaurant_id is required and must be a string');
    }
    if (!isValidObjectId(data.restaurant_id)) {
        return err('restaurant_id must be a valid ObjectId');
    }

    if (!Array.isArray(data.items)) {
        return err('items must be an array');
    }
    if (data.items.length === 0) {
        return err('items array cannot be empty');
    }

    // Validate each item
    for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];

        if (!item || typeof item !== 'object') {
            return err(`items[${i}] must be an object`);
        }

        const itemData = item as Record<string, unknown>;

        if (!itemData.item_id || typeof itemData.item_id !== 'string') {
            return err(`items[${i}].item_id is required and must be a string`);
        }
        if (!isValidObjectId(itemData.item_id)) {
            return err(`items[${i}].item_id must be a valid ObjectId`);
        }

        if (typeof itemData.quantity !== 'number') {
            return err(`items[${i}].quantity is required and must be a number`);
        }
        if (!Number.isInteger(itemData.quantity) || itemData.quantity < 1) {
            return err(`items[${i}].quantity must be a positive integer`);
        }

        // Validate extras
        if (!Array.isArray(itemData.extras)) {
            return err(`items[${i}].extras must be an array`);
        }

        for (let j = 0; j < itemData.extras.length; j++) {
            const extra = itemData.extras[j];
            if (typeof extra !== 'string') {
                return err(`items[${i}].extras[${j}] must be a string`);
            }
            if (!isValidObjectId(extra)) {
                return err(`items[${i}].extras[${j}] must be a valid ObjectId`);
            }
        }
    }

    if (data.pickup_time_requested !== undefined) {
        if (typeof data.pickup_time_requested !== 'string') {
            return err('pickup_time_requested must be a string (ISO date format)');
        }
        // Check if it's a valid ISO date string
        const date = new Date(data.pickup_time_requested);
        if (isNaN(date.getTime())) {
            return err('pickup_time_requested must be a valid ISO date string');
        }
    }

    if (data.special_instructions !== undefined) {
        if (typeof data.special_instructions !== 'string') {
            return err('special_instructions must be a string');
        }
        if (data.special_instructions.length > 500) {
            return err('special_instructions must be 500 characters or less');
        }
    }

    const validatedRequest: CreateOrderRequest = {
        restaurant_id: data.restaurant_id as string,
        items: data.items.map((item: any) => ({
            item_id: item.item_id,
            quantity: item.quantity,
            extras: item.extras
        })),
        pickup_time_requested: data.pickup_time_requested as string | undefined,
        special_instructions: data.special_instructions as string | undefined
    };

    return ok(validatedRequest);
}
