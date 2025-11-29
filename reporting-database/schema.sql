-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers
(
    customer_id    VARCHAR(24) PRIMARY KEY,                 -- MongoDB ObjectId
    fname          VARCHAR(50)  NOT NULL,
    lname          VARCHAR(50)  NOT NULL,
    email          VARCHAR(100) NOT NULL UNIQUE,
    phone          VARCHAR(15),
    student_id     VARCHAR(20) UNIQUE,
    preferred_name VARCHAR(50),
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX          idx_email (email),
    INDEX          idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RESTAURANTS TABLE
-- ============================================
CREATE TABLE restaurants
(
    restaurant_id       VARCHAR(24) PRIMARY KEY,                -- MongoDB ObjectId
    restaurant_name     VARCHAR(100) NOT NULL,
    restaurant_location VARCHAR(100) NOT NULL,
    restaurant_phone    VARCHAR(15),
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX               idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MENU GROUPS TABLE
-- ============================================
CREATE TABLE menu_groups
(
    group_id      VARCHAR(24) PRIMARY KEY,                -- MongoDB ObjectId
    restaurant_id VARCHAR(24) NOT NULL,
    group_name    VARCHAR(100) NOT NULL,
    display_order INT          NOT NULL DEFAULT 0,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id) ON DELETE CASCADE,
    INDEX         idx_restaurant (restaurant_id),
    INDEX         idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MENU ITEMS TABLE
-- ============================================
CREATE TABLE menu_items
(
    item_id        VARCHAR(24) PRIMARY KEY,                -- MongoDB ObjectId
    group_id       VARCHAR(24) NOT NULL,
    item_name      VARCHAR(100)   NOT NULL,
    description    TEXT,
    base_price     DECIMAL(10, 2) NOT NULL,
    image_url      VARCHAR(255),
    is_available   BOOLEAN        NOT NULL DEFAULT TRUE,
    is_vegetarian  BOOLEAN        NOT NULL DEFAULT FALSE,
    is_vegan       BOOLEAN        NOT NULL DEFAULT FALSE,
    is_gluten_free BOOLEAN        NOT NULL DEFAULT FALSE,
    prep_time      INT UNSIGNED,
    max_per_order  INT UNSIGNED DEFAULT 10,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id) REFERENCES menu_groups (group_id) ON DELETE CASCADE,
    INDEX          idx_group (group_id),
    INDEX          idx_available (is_available),
    INDEX          idx_dietary (is_vegetarian, is_vegan, is_gluten_free)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MENU ITEM EXTRAS TABLE (Supports Recursive Nesting)
-- ============================================
CREATE TABLE menu_item_extras
(
    extra_id          VARCHAR(24) PRIMARY KEY,                -- MongoDB ObjectId
    item_id           VARCHAR(24) NOT NULL,
    parent_extra_id   VARCHAR(24) NULL,                       -- Self-referencing FK for nested extras
    extra_name        VARCHAR(100)   NOT NULL,
    extra_description TEXT,
    price_delta       DECIMAL(10, 2) NOT NULL DEFAULT 0.00,   -- Most nested selections are $0
    is_available      BOOLEAN        NOT NULL DEFAULT TRUE,
    is_required       BOOLEAN        NOT NULL DEFAULT FALSE,
    max_selectable    INT UNSIGNED DEFAULT 1,                 -- Default 1 for radio button groups
    display_order     INT            NOT NULL DEFAULT 0,
    created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (item_id) REFERENCES menu_items (item_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_extra_id) REFERENCES menu_item_extras (extra_id) ON DELETE CASCADE,
    INDEX             idx_item (item_id),
    INDEX             idx_parent_extra (parent_extra_id),
    INDEX             idx_available (is_available),
    INDEX             idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders
(
    order_id              VARCHAR(24) PRIMARY KEY,                -- MongoDB ObjectId
    order_number          VARCHAR(20)    NOT NULL UNIQUE,
    customer_id           VARCHAR(24) NOT NULL,
    restaurant_id         VARCHAR(24) NOT NULL,
    status                ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    order_datetime        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pickup_time_requested TIMESTAMP NULL,
    pickup_time_ready     TIMESTAMP NULL,
    subtotal_amount       DECIMAL(10, 2) NOT NULL,
    tax_amount            DECIMAL(10, 2) NOT NULL,
    total_amount          DECIMAL(10, 2) NOT NULL,
    special_instructions  TEXT,
    is_cancelled          BOOLEAN        NOT NULL DEFAULT FALSE,
    cancelled_at          TIMESTAMP NULL,
    created_at            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id),
    INDEX                 idx_order_number (order_number),
    INDEX                 idx_customer (customer_id),
    INDEX                 idx_restaurant (restaurant_id),
    INDEX                 idx_status (status),
    INDEX                 idx_order_datetime (order_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDER ITEMS TABLE (Snapshots)
-- ============================================
CREATE TABLE order_items
(
    order_item_id  VARCHAR(24) PRIMARY KEY,                -- MongoDB ObjectId
    order_id       VARCHAR(24) NOT NULL,
    menu_item_id   VARCHAR(24) NOT NULL,                   -- Reference to original menu item
    item_name      VARCHAR(100)   NOT NULL,                -- Snapshot
    description    TEXT,                                   -- Snapshot
    unit_price     DECIMAL(10, 2) NOT NULL,                -- Snapshot
    quantity       INT UNSIGNED NOT NULL,
    line_subtotal  DECIMAL(10, 2) NOT NULL,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items (item_id),
    INDEX          idx_order (order_id),
    INDEX          idx_menu_item (menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDER ITEM EXTRAS TABLE (Snapshots with Recursive Nesting)
-- ============================================
CREATE TABLE order_item_extras
(
    order_extra_id        VARCHAR(24) PRIMARY KEY,                -- MongoDB ObjectId (generated for order)
    order_item_id         VARCHAR(24) NOT NULL,
    parent_order_extra_id VARCHAR(24) NULL,                       -- Self-referencing FK for nested extras
    menu_extra_id         VARCHAR(24) NOT NULL,                   -- Reference to original menu extra
    extra_name            VARCHAR(100)   NOT NULL,                -- Snapshot
    extra_price           DECIMAL(10, 2) NOT NULL,                -- Snapshot
    created_at            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_item_id) REFERENCES order_items (order_item_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_order_extra_id) REFERENCES order_item_extras (order_extra_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_extra_id) REFERENCES menu_item_extras (extra_id),
    INDEX                 idx_order_item (order_item_id),
    INDEX                 idx_parent_order_extra (parent_order_extra_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CUSTOMER SNAPSHOT TABLE (Denormalized from Orders)
-- ============================================
-- This table stores customer information as it was at order time
-- One record per order_id (1:1 relationship)
CREATE TABLE order_customer_snapshots
(
    order_id       VARCHAR(24) PRIMARY KEY,                -- Links to orders table
    customer_id    VARCHAR(24) NOT NULL,
    name           VARCHAR(100) NOT NULL,                  -- Full name at order time
    preferred_name VARCHAR(50),
    email          VARCHAR(100) NOT NULL,
    phone          VARCHAR(15),
    student_id     VARCHAR(20),

    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    INDEX          idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RESTAURANT SNAPSHOT TABLE (Denormalized from Orders)
-- ============================================
-- This table stores restaurant information as it was at order time
-- One record per order_id (1:1 relationship)
CREATE TABLE order_restaurant_snapshots
(
    order_id      VARCHAR(24) PRIMARY KEY,                -- Links to orders table
    restaurant_id VARCHAR(24) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    location      VARCHAR(100) NOT NULL,
    phone         VARCHAR(15),

    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    INDEX         idx_restaurant (restaurant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;