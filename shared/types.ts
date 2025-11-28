// ============================================================================
// Explicit Error handling types
// ============================================================================
export type Success<T> = {
    ok: true
    value: T;
}

export type Failure<E> = {
    ok: false
    error: E
}

export type Result<T,E> = Success<T> | Failure<E>;
// helpers
export const ok = <T>(value: T): Success<T> => ({ ok: true, value });
export const err = <E>(error: E): Failure<E> => ({ ok: false, error });

// ============================================================================
// Customer Types
// ============================================================================

/**
 * Customer API response (what frontend receives)
 */
export interface Customer {
    id: string;
    fname: string;
    lname: string;
    email: string;
    phone?: string;
    student_id?: string;
    preferred_name?: string;
    is_active: boolean;
}

/**
 * Customer creation request
 */
export interface CreateCustomerRequest {
    fname: string;
    lname: string;
    email: string;
    phone?: string;
    student_id?: string;
    preferred_name?: string;
}

/**
 * Customer update request (all fields optional)
 */
export interface UpdateCustomerRequest {
    fname?: string;
    lname?: string;
    email?: string;
    phone?: string;
    student_id?: string;
    preferred_name?: string;
    is_active?: boolean;
}

// ============================================================================
// Menu Types
// ============================================================================

/**
 * Menu item extra/add-on option
 */
export interface MenuExtra {
    extra_id: string;
    extra_name: string;
    extra_description?: string;
    price_delta: number;
    is_available: boolean;
    is_required: boolean;
    max_selectable?: number;
    display_order: number;
}

/**
 * Individual menu item
 */
export interface MenuItem {
    item_id: string;
    item_name: string;
    description?: string;
    base_price: number;
    image_url: string;
    is_available: boolean;
    is_vegetarian: boolean;
    is_vegan: boolean;
    is_gluten_free: boolean;
    prep_time?: number;
    max_per_order: number;
    extras: MenuExtra[];
}

/**
 * Menu group/category (e.g., "Burgers", "Salads")
 */
export interface MenuGroup {
    group_id: string;
    group_name: string;
    display_order: number;
    is_active: boolean;
    items: MenuItem[];
}

/**
 * Complete menu for a restaurant
 */
export interface Menu {
    id: string;
    restaurant_id: string;
    restaurant_name: string;
    restaurant_location: string;
    restaurant_phone?: string;
    is_active: boolean;
    groups: MenuGroup[];
}

// ============================================================================
// Order Types
// ============================================================================

/**
 * Order status enum
 */
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

/**
 * Extra snapshot in order (preserves pricing at order time)
 */
export interface OrderExtra {
    extra_id: string;
    extra_name: string;
    extra_price: number;
}

/**
 * Order item (snapshot of menu item at order time)
 */
export interface OrderItem {
    order_item_id: string;
    menu_item_id: string;
    item_name: string;
    description?: string;
    unit_price: number;
    quantity: number;
    extras: OrderExtra[];
    line_subtotal: number;
}

/**
 * Customer snapshot (as they were at order time)
 */
export interface CustomerSnapshot {
    customer_id: string;
    name: string;
    preferred_name?: string;
    email: string;
    phone?: string;
    student_id?: string;
}

/**
 * Restaurant snapshot (as it was at order time)
 */
export interface RestaurantSnapshot {
    restaurant_id: string;
    name: string;
    location: string;
    phone?: string;
}

/**
 * Complete order
 */
export interface Order {
    id: string;
    order_number: string;
    customer: CustomerSnapshot;
    restaurant: RestaurantSnapshot;
    items: OrderItem[];
    status: OrderStatus;
    order_datetime: Date;
    pickup_time_requested?: Date;
    pickup_time_ready?: Date;
    subtotal_amount: number;
    tax_amount: number;
    total_amount: number;
    special_instructions?: string;
    is_cancelled: boolean;
    cancelled_at?: Date;
}

/**
 * Request to create new order (what frontend sends)
 * Note: customer_id comes from JWT token via authenticateToken middleware
 */
export interface CreateOrderRequest {
    restaurant_id: string;
    items: {
        item_id: string;
        quantity: number;
        extras: string[]; // Array of extra_ids
    }[];
    pickup_time_requested?: string; // ISO date string
    special_instructions?: string;
}

/**
 * Request to update order status
 */
export interface UpdateOrderStatusRequest {
    status: OrderStatus;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Login request
 */
export interface LoginRequest {
    email: string;
}

/**
 * Login response with JWT token
 */
export interface LoginResponse {
    token: string;
    customer: Customer;
}

/**
 * JWT payload
 */
export interface JWTPayload {
    customer_id: string;
    email: string;
    iat?: number;
    exp?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API error response
 */
export interface APIError {
    error: string;
    details?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}

/**
 * Health check response
 */
export interface HealthResponse {
    status: 'ok' | 'error';
    message: string;
    timestamp?: string;
}

