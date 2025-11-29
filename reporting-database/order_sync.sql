-- Get complete order data for sync
SELECT
    o.order_id,
    o.order_number,
    o.status,
    o.order_datetime,
    o.pickup_time_requested,
    o.pickup_time_ready,
    o.subtotal_amount,
    o.tax_amount,
    o.total_amount,
    o.special_instructions,
    o.created_at,

    -- Customer data
    c.customer_id,
    CONCAT(c.fname, ' ', c.lname) as customer_name,
    c.preferred_name,
    c.email as customer_email,
    c.phone as customer_phone,
    c.student_id,

    -- Restaurant data
    r.restaurant_id,
    r.restaurant_name,
    r.campus_location,
    r.phone_num as restaurant_phone,

    -- Order items
    oi.order_item_id,
    oi.menu_item_id,
    oi.item_name_snapshot,
    oi.unit_price_snapshot,
    oi.quantity,
    oi.line_subtotal,

    -- Order item extras
    oie.order_item_extra_id,
    oie.menu_item_extra_id,
    oie.extra_name_snapshot,
    oie.extra_price_snapshot

FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN restaurants r ON o.restaurant_id = r.restaurant_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN order_item_extras oie ON oi.order_item_id = oie.order_item_id
WHERE o.created_at >= '2024-11-24 00:00:00'
  AND o.created_at < '2024-11-25 00:00:00'
  AND o.status IN ('completed', 'cancelled')
ORDER BY o.order_id, oi.order_item_id, oie.order_item_extra_id;
