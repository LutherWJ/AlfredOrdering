import db from "./connection";
import mongoose from "mongoose";
import Order from "../server/models/Order";
import type {DenormalizedOrder, MenuExtraRow, NormalizedEntry, OrderRow, RestaurantRow} from './types';


async function connectToMongo() {
    const MONGO_URI = process.env.MONGODB_URI || '';

    if (!MONGO_URI) {
        throw new Error('MONGODB_URI environment variable is not set.');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected.');
}


const getAllOrders = async (): Promise<DenormalizedOrder[]> => {
    try {
        const orders = await Order.find().lean<OrderRow[]>();
        return mapDenormalizedData(orders);
    } catch (error) {
        throw new Error(`Failed to fetch orders from Mongo: ${error}`);
    }
}

const mapDenormalizedData = (orders: OrderRow[]): DenormalizedOrder[] => {
    return orders.map(order => ({
        order: {
            order_id: order._id,
            order_number: order.order_number,
            customer_id: order.customer.customer_id,
            restaurant_id: order.restaurant.restaurant_id,
            status: order.status,
            order_datetime: order.order_datetime,
            pickup_time_requested: order.pickup_time_requested,
            pickup_time_ready: order.pickup_time_ready,
            subtotal_amount: order.subtotal_amount,
            tax_amount: order.tax_amount,
            total_amount: order.total_amount,
            special_instructions: order.special_instructions,
            is_cancelled: order.is_cancelled,
            cancelled_at: order.cancelled_at,
            created_at: order.created_at,
            updated_at: order.updated_at
        },
        customer_snapshot: {
            order_id: order._id,
            customer_id: order.customer.customer_id,
            name: order.customer.name,
            preferred_name: order.customer.preferred_name,
            email: order.customer.email,
            phone: order.customer.phone,
            student_id: order.customer.student_id
        },
        restaurant_snapshot: {
            order_id: order._id,
            restaurant_id: order.restaurant.restaurant_id,
            name: order.restaurant.name,
            location: order.restaurant.location,
            phone: order.restaurant.phone
        },
        items: order.items.map(item => ({
            order_item_id: item.order_item_id,
            order_id: order._id,
            menu_item_id: item.menu_item_id,
            item_name: item.item_name,
            description: item.description,
            unit_price: item.unit_price,
            quantity: item.quantity,
            line_subtotal: item.line_subtotal,
            created_at: order.created_at
        })),
        extras: order.items.flatMap(item =>
            flattenExtras(item.extras, item.order_item_id, null, order.created_at)
        )
    }));
}

//Recursively flatten nested extras into flat array for relational table
const flattenExtras = (
    extras: OrderRow['items'][0]['extras'],
    orderItemId: string,
    parentExtraId: string | null,
    createdAt: Date
): DenormalizedOrder['extras'] => {
    return extras.flatMap(extra => {
        const extraRow = {
            order_extra_id: extra.extra_id,
            order_item_id: orderItemId,
            parent_order_extra_id: parentExtraId,
            menu_extra_id: extra.extra_id,
            extra_name: extra.extra_name,
            extra_price: extra.extra_price,
            created_at: createdAt
        };
        const nestedExtras = extra.extras?.length > 0
            ? flattenExtras(extra.extras, orderItemId, extra.extra_id, createdAt)
            : [];
        return [extraRow, ...nestedExtras];
    });
}

// Insert a single order into MySQL with all related data in one transaction
const insertOrder = async (order: DenormalizedOrder): Promise<void> => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute(
            `INSERT INTO orders (
                order_id, order_number, customer_id, restaurant_id, status,
                order_datetime, pickup_time_requested, pickup_time_ready,
                subtotal_amount, tax_amount, total_amount,
                special_instructions, is_cancelled, cancelled_at,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                order.order.order_id,
                order.order.order_number,
                order.order.customer_id,
                order.order.restaurant_id,
                order.order.status,
                order.order.order_datetime,
                order.order.pickup_time_requested,
                order.order.pickup_time_ready,
                order.order.subtotal_amount,
                order.order.tax_amount,
                order.order.total_amount,
                order.order.special_instructions,
                order.order.is_cancelled,
                order.order.cancelled_at,
                order.order.created_at,
                order.order.updated_at
            ]
        );

        await connection.execute(
            `INSERT INTO order_customer_snapshots (
                order_id, customer_id, name, preferred_name, email, phone, student_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                order.customer_snapshot.order_id,
                order.customer_snapshot.customer_id,
                order.customer_snapshot.name,
                order.customer_snapshot.preferred_name,
                order.customer_snapshot.email,
                order.customer_snapshot.phone,
                order.customer_snapshot.student_id
            ]
        );

        await connection.execute(
            `INSERT INTO order_restaurant_snapshots (
                order_id, restaurant_id, name, location, phone
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                order.restaurant_snapshot.order_id,
                order.restaurant_snapshot.restaurant_id,
                order.restaurant_snapshot.name,
                order.restaurant_snapshot.location,
                order.restaurant_snapshot.phone
            ]
        );

        for (const item of order.items) {
            await connection.execute(
                `INSERT INTO order_items (
                    order_item_id, order_id, menu_item_id, item_name, description,
                    unit_price, quantity, line_subtotal, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.order_item_id,
                    item.order_id,
                    item.menu_item_id,
                    item.item_name,
                    item.description,
                    item.unit_price,
                    item.quantity,
                    item.line_subtotal,
                    item.created_at
                ]
            );
        }

        // Parent extras must be inserted before their children
        await insertExtrasHierarchy(connection, order.extras);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw new Error(`Failed to insert order ${order.order.order_number}: ${error}`);
    } finally {
        connection.release();
    }
}

// Insert itemExtras breadth first
const insertExtrasHierarchy = async (
    connection: any,
    extras: DenormalizedOrder['extras']
): Promise<void> => {
    const extrasByParent = new Map<string | null, typeof extras>();

    for (const extra of extras) {
        const parentId = extra.parent_order_extra_id;
        if (!extrasByParent.has(parentId)) {
            extrasByParent.set(parentId, []);
        }
        extrasByParent.get(parentId)!.push(extra);
    }

    const insertLevel = async (parentId: string | null) => {
        const extrasAtLevel = extrasByParent.get(parentId) || [];

        for (const extra of extrasAtLevel) {
            await connection.execute(
                `INSERT INTO order_item_extras (
                    order_extra_id, order_item_id, parent_order_extra_id,
                    menu_extra_id, extra_name, extra_price, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    extra.order_extra_id,
                    extra.order_item_id,
                    extra.parent_order_extra_id,
                    extra.menu_extra_id,
                    extra.extra_name,
                    extra.extra_price,
                    extra.created_at
                ]
            );
            await insertLevel(extra.order_extra_id);
        }
    };

    await insertLevel(null);
}

const insertOrders = async (orders: DenormalizedOrder[]): Promise<void> => {
    let successCount = 0;
    const errors: string[] = [];

    for (const order of orders) {
        try {
            await insertOrder(order);
            successCount++;
        } catch (error) {
            errors.push(`Order ${order.order.order_number}: ${error}`);
        }
    }

    console.log(`Successfully inserted ${successCount}/${orders.length} orders`);
    if (errors.length > 0) {
        console.error(`Failed to insert ${errors.length} orders:`);
        errors.forEach(err => console.error(`  - ${err}`));
    }
}

const main = async () => {
    const orders = await getAllOrders();
    insertOrders(orders);
}

const gracefulExit = async (e) => {
    console.error('CRITICAL SYNC ERROR:', e.message);
    db.destroy();
    await mongoose.connection.close();
    process.exit(1);
};

try {
    main();
} catch (e) {
    gracefulExit(e);
}
