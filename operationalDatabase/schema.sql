-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
                           customer_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                           fname VARCHAR(50) NOT NULL,
                           lname VARCHAR(50) NOT NULL,
                           email VARCHAR(100) NOT NULL UNIQUE,
                           phone VARCHAR(15),
                           student_id VARCHAR(20) UNIQUE,
                           preferred_name VARCHAR(50),
                           is_active BOOLEAN NOT NULL DEFAULT TRUE,
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                           INDEX idx_email (email),
                           INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RESTAURANTS TABLE
-- ============================================
CREATE TABLE restaurants (
                             restaurant_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                             restaurant_name VARCHAR(100) NOT NULL,
                             campus_location VARCHAR(100) NOT NULL,
                             phone_num VARCHAR(15),
                             is_active BOOLEAN NOT NULL DEFAULT TRUE,
                             created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                             INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MENU GROUPS TABLE
-- ============================================
CREATE TABLE menu_groups (
                             menu_group_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                             restaurant_id INT UNSIGNED NOT NULL,
                             group_name VARCHAR(100) NOT NULL,
                             display_order INT NOT NULL DEFAULT 0,
                             is_active BOOLEAN NOT NULL DEFAULT TRUE,
                             created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                             FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
                             INDEX idx_restaurant (restaurant_id),
                             INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MENU ITEMS TABLE
-- ============================================
CREATE TABLE menu_items (
                            menu_item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                            menu_group_id INT UNSIGNED NOT NULL,
                            item_name VARCHAR(100) NOT NULL,
                            description TEXT,
                            base_price DECIMAL(10,2) NOT NULL,
                            image_url VARCHAR(255),
                            is_available BOOLEAN NOT NULL DEFAULT TRUE,
                            is_vegetarian BOOLEAN NOT NULL DEFAULT FALSE,
                            is_vegan BOOLEAN NOT NULL DEFAULT FALSE,
                            is_gluten_free BOOLEAN NOT NULL DEFAULT FALSE,
                            prep_time INT UNSIGNED,
                            max_per_order INT UNSIGNED DEFAULT 10,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                            FOREIGN KEY (menu_group_id) REFERENCES menu_groups(menu_group_id) ON DELETE CASCADE,
                            INDEX idx_menu_group (menu_group_id),
                            INDEX idx_available (is_available),
                            INDEX idx_dietary (is_vegetarian, is_vegan, is_gluten_free)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MENU ITEM EXTRAS TABLE
-- ============================================
CREATE TABLE menu_item_extras (
                                  menu_item_extra_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                  menu_item_id INT UNSIGNED NOT NULL,
                                  extra_name VARCHAR(100) NOT NULL,
                                  extra_description TEXT,
                                  price_delta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                                  is_available BOOLEAN NOT NULL DEFAULT TRUE,
                                  is_required BOOLEAN NOT NULL DEFAULT FALSE,
                                  max_selectable INT UNSIGNED,
                                  display_order INT NOT NULL DEFAULT 0,
                                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                                  FOREIGN KEY (menu_item_id) REFERENCES menu_items(menu_item_id) ON DELETE CASCADE,
                                  INDEX idx_menu_item (menu_item_id),
                                  INDEX idx_available (is_available),
                                  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
                        order_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        order_number VARCHAR(20) NOT NULL UNIQUE,
                        customer_id INT UNSIGNED NOT NULL,
                        restaurant_id INT UNSIGNED NOT NULL,
                        status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
                        order_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        pickup_time_requested TIMESTAMP NULL,
                        pickup_time_ready TIMESTAMP NULL,
                        subtotal_amount DECIMAL(10,2) NOT NULL,
                        tax_amount DECIMAL(10,2) NOT NULL,
                        total_amount DECIMAL(10,2) NOT NULL,
                        special_instructions TEXT,
                        is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
                        cancelled_at TIMESTAMP NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
                        FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id),
                        INDEX idx_order_number (order_number),
                        INDEX idx_customer (customer_id),
                        INDEX idx_status (status),
                        INDEX idx_order_datetime (order_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
                             order_item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                             order_id INT UNSIGNED NOT NULL,
                             menu_item_id INT UNSIGNED NOT NULL,
                             item_name_snapshot VARCHAR(100) NOT NULL,
                             unit_price_snapshot DECIMAL(10,2) NOT NULL,
                             quantity INT UNSIGNED NOT NULL,
                             line_subtotal DECIMAL(10,2) NOT NULL,
                             created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                             FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
                             FOREIGN KEY (menu_item_id) REFERENCES menu_items(menu_item_id),
                             INDEX idx_order (order_id),
                             INDEX idx_menu_item (menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDER ITEM EXTRAS TABLE
-- ============================================
CREATE TABLE order_item_extras (
                                   order_item_extra_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                   order_item_id INT UNSIGNED NOT NULL,
                                   menu_item_extra_id INT UNSIGNED NOT NULL,
                                   extra_name_snapshot VARCHAR(100) NOT NULL,
                                   extra_price_snapshot DECIMAL(10,2) NOT NULL,
                                   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                   FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id) ON DELETE CASCADE,
                                   FOREIGN KEY (menu_item_extra_id) REFERENCES menu_item_extras(menu_item_extra_id),
                                   INDEX idx_order_item (order_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
