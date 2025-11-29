import type { Types } from 'mongoose';
import type { CustomerDocument } from '../server/models/Customer';
import type {
    MenuDocument,
    MenuGroupDocument,
    MenuItemDocument,
    MenuExtraDocument
} from '../server/models/Menu';
import type {
    OrderDocument,
    OrderItemDocument,
    OrderExtraDocument,
    CustomerSnapshotDocument,
    RestaurantSnapshotDocument
} from '../server/models/Order';

type ObjectIdToString<T> = {
    [K in keyof T]: T[K] extends Types.ObjectId
        ? string
        : T[K] extends Types.ObjectId | undefined
        ? string | undefined
        : T[K] extends Array<infer U>
        ? Array<ObjectIdToString<U>>
        : T[K] extends object
        ? ObjectIdToString<T[K]>
        : T[K];
};

type WithId<T> = T & { _id: string };

export interface CustomerRow extends Omit<ObjectIdToString<CustomerDocument>, '_id'> {
    customer_id: string;
}

export interface RestaurantRow {
    restaurant_id: string;
    restaurant_name: string;
    restaurant_location: string;
    restaurant_phone: string | undefined;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface MenuGroupRow {
    group_id: string;
    restaurant_id: string;
    group_name: string;
    display_order: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface MenuItemRow {
    item_id: string;
    group_id: string;
    item_name: string;
    description: string | undefined;
    base_price: number;
    image_url: string;
    is_available: boolean;
    is_vegetarian: boolean;
    is_vegan: boolean;
    is_gluten_free: boolean;
    prep_time: number | undefined;
    max_per_order: number;
    created_at: Date;
    updated_at: Date;
}

export interface MenuExtraRow {
    extra_id: string;
    item_id: string;
    parent_extra_id: string | null;
    extra_name: string;
    extra_description: string | undefined;
    price_delta: number;
    is_available: boolean;
    is_required: boolean;
    max_selectable: number;
    display_order: number;
    created_at: Date;
    updated_at: Date;
}

export interface OrderRow {
    order_id: string;
    order_number: string;
    customer_id: string;
    restaurant_id: string;
    status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    order_datetime: Date;
    pickup_time_requested: Date | undefined;
    pickup_time_ready: Date | undefined;
    subtotal_amount: number;
    tax_amount: number;
    total_amount: number;
    special_instructions: string | undefined;
    is_cancelled: boolean;
    cancelled_at: Date | undefined;
    created_at: Date;
    updated_at: Date;
}

export interface OrderCustomerSnapshotRow {
    order_id: string;
    customer_id: string;
    name: string;
    preferred_name: string | undefined;
    email: string;
    phone: string | undefined;
    student_id: string | undefined;
}

export interface OrderRestaurantSnapshotRow {
    order_id: string;
    restaurant_id: string;
    name: string;
    location: string;
    phone: string | undefined;
}

export interface OrderItemRow {
    order_item_id: string;
    order_id: string;
    menu_item_id: string;
    item_name: string;
    description: string | undefined;
    unit_price: number;
    quantity: number;
    line_subtotal: number;
    created_at: Date;
}

export interface OrderItemExtraRow {
    order_extra_id: string;
    order_item_id: string;
    parent_order_extra_id: string | null;
    menu_extra_id: string;
    extra_name: string;
    extra_price: number;
    created_at: Date;
}

export interface DenormalizedMenu {
    restaurant: RestaurantRow;
    groups: MenuGroupRow[];
    items: MenuItemRow[];
    extras: MenuExtraRow[];
}

export interface DenormalizedOrder {
    order: OrderRow;
    customer_snapshot: OrderCustomerSnapshotRow;
    restaurant_snapshot: OrderRestaurantSnapshotRow;
    items: OrderItemRow[];
    extras: OrderItemExtraRow[];
}

export interface SyncStats {
    customers_synced: number;
    restaurants_synced: number;
    menu_groups_synced: number;
    menu_items_synced: number;
    menu_extras_synced: number;
    orders_synced: number;
    order_items_synced: number;
    order_extras_synced: number;
    errors: string[];
    started_at: Date;
    completed_at?: Date;
}