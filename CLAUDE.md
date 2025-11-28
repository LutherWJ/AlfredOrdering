# Campus Ordering App - Database Architecture Documentation

## Project Overview

This is a mobile ordering application for Alfred State College campus dining that solves real-world problems with the current system:

**Problems Being Solved:**
1. **No real-time availability** - Current app doesn't show when items are out of stock, leading to order substitutions
2. **Rigid menu structure** - Can't dynamically add/remove items or modify extras (e.g., can't disable american cheese when kitchen runs out)
3. **Poor user experience** - Students order items that aren't available and receive substitutions without notification

**Solution Approach:**
- Dynamic menu management with real-time availability tracking
- Flexible extras system that can be enabled/disabled independently
- Denormalized MongoDB database for fast queries and simple updates

## Database Architecture

### Two-Database Design (Academic Context)

This project demonstrates understanding of both normalized relational databases and denormalized document databases:

**MySQL Database: `campus_ordering_operational`**
- Normalized relational schema (8 tables)
- Maintains referential integrity with foreign keys
- Academic reference showing traditional database design
- **NOT implemented in the actual application** - exists for theoretical batch sync pattern discussed in database class

**MongoDB Database: `campus_ordering`**
- Denormalized document database (3 collections)
- What the application actually uses
- Optimized for read performance and simple updates
- Embedded documents eliminate need for JOINs

### Why This Hybrid Approach?

1. **Academic Requirements** - Database class emphasized materialized views and sync patterns
2. **Real-world Applicability** - Demonstrates understanding of both paradigms
3. **Practical Implementation** - MongoDB alone is simpler and more appropriate for this prototype
4. **Learning Value** - Shows trade-offs between normalized vs denormalized approaches

## MongoDB Schema (Application Database)

**Database Name:** `campus_ordering`

### Collection 1: `customers`

Simple customer records - kept separate because they're referenced by orders.

```javascript
{
  _id: ObjectId("..."),
  fname: "Luther",
  lname: "Student",
  email: "luther@alfred.edu",
  phone: "+1-607-555-0123",
  student_id: "STU20240001",
  preferred_name: "Luke",
  is_active: true,
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}
```

**Key Features:**
- Email is unique and indexed
- Student ID is unique but sparse (allows null)
- Simple CRUD operations

### Collection 2: `menus`

**One document per restaurant** with entire menu structure embedded. This is the core of solving the availability problem.

```javascript
{
  _id: ObjectId("..."),
  restaurant_id: ObjectId("..."),
  restaurant_name: "Campus Grill",
  restaurant_location: "Powell Campus Center",
  restaurant_phone: "+1-607-555-0200",
  is_active: true,
  
  groups: [
    {
      group_id: ObjectId("..."),
      group_name: "Burgers & Sandwiches",
      display_order: 2,
      is_active: true,
      items: [
        {
          item_id: ObjectId("..."),
          item_name: "Cheeseburger Deluxe",
          description: "Quarter pound beef patty with cheese",
          base_price: 8.99,
          image_url: "/images/menu/cheeseburger.jpg",
          
          // AVAILABILITY MANAGEMENT (solves real-world problem)
          is_available: true,
          
          // Dietary filters
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
          
          prep_time: 15,
          max_per_order: 10,
          
          // FLEXIBLE EXTRAS (solves real-world problem)
          extras: [
            {
              extra_id: ObjectId("..."),
              extra_name: "Extra Cheese",
              extra_description: "Add extra melted cheese",
              price_delta: 1.50,
              is_available: true,  // Can disable extras independently!
              is_required: false,
              max_selectable: 3,
              display_order: 1
            },
            {
              extra_id: ObjectId("..."),
              extra_name: "No Pickles",
              extra_description: "Remove pickles",
              price_delta: 0.00,
              is_available: true,
              is_required: false,
              max_selectable: 1,
              display_order: 2
            }
          ]
        }
      ]
    }
  ],
  
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}
```

**Why This Structure?**
- **Single query loads entire menu** - perfect for mobile app browsing
- **Easy to update availability** - staff can mark items/extras unavailable with single update
- **No JOINs needed** - everything nested in one document
- **Flexible** - can add/remove items and extras dynamically

**Common Operations:**

```javascript
// Get entire menu (mobile app browsing)
db.menus.findOne({ restaurant_id: restaurantId })

// Mark item unavailable (kitchen runs out)
db.menus.updateOne(
  { "groups.items.item_id": itemId },
  { 
    $set: { 
      "groups.$[].items.$[item].is_available": false 
    }
  },
  { arrayFilters: [{ "item.item_id": itemId }] }
)

// Disable specific extra (e.g., out of american cheese)
db.menus.updateOne(
  { "groups.items.extras.extra_id": extraId },
  { 
    $set: { 
      "groups.$[].items.$[].extras.$[extra].is_available": false 
    }
  },
  { arrayFilters: [{ "extra.extra_id": extraId }] }
)

// Add new item to group
db.menus.updateOne(
  { "groups.group_id": groupId },
  {
    $push: {
      "groups.$.items": {
        item_id: new ObjectId(),
        item_name: "New Item",
        base_price: 9.99,
        is_available: true,
        extras: []
      }
    }
  }
)
```

### Collection 3: `orders`

**One document per order** with complete snapshots of customer, restaurant, and items at order time.

```javascript
{
  _id: ObjectId("..."),
  order_number: "ORD-20241124-0123",
  
  // CUSTOMER SNAPSHOT (denormalized at order time)
  customer: {
    customer_id: ObjectId("..."),
    name: "Luther Student",
    preferred_name: "Luke",
    email: "luther@alfred.edu",
    phone: "+1-607-555-0123",
    student_id: "STU20240001"
  },
  
  // RESTAURANT SNAPSHOT (denormalized)
  restaurant: {
    restaurant_id: ObjectId("..."),
    name: "Campus Grill",
    location: "Powell Campus Center",
    phone: "+1-607-555-0200"
  },
  
  // COMPLETE ORDER ITEMS (with price snapshots)
  items: [
    {
      order_item_id: ObjectId("..."),
      menu_item_id: ObjectId("..."), // Reference for analytics
      item_name: "Cheeseburger Deluxe",
      description: "Quarter pound beef patty with cheese",
      unit_price: 8.99, // SNAPSHOT - preserves historical price
      quantity: 2,
      
      extras: [
        {
          extra_id: ObjectId("..."),
          extra_name: "Extra Cheese",
          extra_price: 1.50 // SNAPSHOT - preserves historical price
        }
      ],
      
      item_subtotal: 20.98
    }
  ],
  
  // Order status
  status: "pending", // pending | preparing | ready | completed | cancelled
  
  // Timing
  order_datetime: ISODate("2024-11-24T12:30:00Z"),
  pickup_time_requested: ISODate("2024-11-24T13:00:00Z"),
  pickup_time_ready: null,
  
  // Money
  subtotal_amount: 20.98,
  tax_amount: 1.68,
  total_amount: 22.66,
  
  special_instructions: "Extra napkins please",
  
  is_cancelled: false,
  cancelled_at: null,
  
  created_at: ISODate("2024-11-24T12:30:00Z"),
  updated_at: ISODate("2024-11-24T12:30:00Z")
}
```

**Why Snapshots?**
- Menu prices can change, but orders preserve what customer actually paid
- Customer name can change, but order shows name at time of order
- Historical accuracy for accounting and legal purposes

**Common Operations:**

```javascript
// Get complete order (single query, no JOINs)
db.orders.findOne({ _id: orderId })

// Customer order history
db.orders.find({ "customer.customer_id": customerId })
  .sort({ created_at: -1 })

// Kitchen display (pending/preparing orders)
db.orders.find({ 
  status: { $in: ["pending", "preparing"] } 
}).sort({ created_at: 1 })

// Update order status
db.orders.updateOne(
  { _id: orderId },
  { 
    $set: { 
      status: "ready",
      pickup_time_ready: new Date()
    }
  }
)
```

## MySQL Schema (Reference Only)

**Database Name:** `campus_ordering_operational`

This normalized schema exists for academic purposes to demonstrate understanding of traditional relational design. **It is NOT implemented in the actual application.**

### Tables

```sql
-- 8 normalized tables with foreign key relationships

1. customers
2. restaurants
3. menu_groups
4. menu_items
5. menu_item_extras
6. orders
7. order_items
8. order_item_extras
```

**Key Differences from MongoDB:**
- Normalized (3NF) - no data duplication
- Foreign key constraints enforce referential integrity
- Requires JOINs to reconstruct complete data
- Updates propagate through relationships
- Better for complex transactions and data integrity

**Theoretical Sync Pattern:**
- MySQL would be the "source of truth"
- MongoDB would be synced via batch jobs (e.g., nightly)
- Accepts potential data loss in MongoDB (eventual consistency)
- Common in enterprise systems (operational DB → analytics DB)

**Why We're Not Implementing This:**
- Overkill for a prototype
- MongoDB alone is simpler and sufficient
- Sync complexity distracts from core learning goals
- Real campus ordering app doesn't need this level of complexity

## Technology Stack

**Backend:**
- **Runtime:** Bun (JavaScript runtime, faster than Node.js)
- **Language:** TypeScript
- **Framework:** Express.js 5
- **Database:** MongoDB (with Mongoose ODM)
- **Docker:** MongoDB in container for easy dev environment

**Frontend:**
- **Framework:** Vue.js 3
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Router:** Vue Router 4

**Shared:**
- **Type Safety:** Shared TypeScript types between client and server

**Stack Acronym:** MEVB (MySQL-optional, Express, Vue, Bun) with full TypeScript

## File Structure

```
project-root/
├── docker-compose.yml          # MongoDB container setup
├── Dockerfile                  # Docker configuration
├── CLAUDE.md                   # This file (architecture docs)
├── README.md                   # Project README
├── package.json                # Dependencies and scripts
├── tsconfig.json               # Root TypeScript config
├── vite.config.ts              # Vite configuration
├── postcss.config.js           # PostCSS/Tailwind config
├── .env                        # Environment variables (gitignored)
├── .env.example                # Environment template
│
├── shared/                     # Shared types between client & server
│   └── types.ts               # Common TypeScript types
│
├── server/                     # Backend (Express + MongoDB)
│   ├── index.ts               # Main Express server entry point
│   ├── tsconfig.json          # Server TypeScript config
│   ├── config/
│   │   └── connection.ts      # MongoDB connection setup
│   ├── models/
│   │   ├── customer.ts        # Customer Mongoose model
│   │   ├── menus.ts           # Menu Mongoose model (nested schemas)
│   │   └── orders.ts          # Order Mongoose model (nested schemas)
│   ├── routes/                # API route handlers (to be implemented)
│   ├── controllers/           # Route controllers (to be implemented)
│   ├── middleware/            # Express middleware (to be implemented)
│   ├── types/                 # Server-specific types (to be implemented)
│   └── utils/                 # Utility functions (to be implemented)
│
├── client/                     # Frontend (Vue.js)
│   ├── index.html             # Entry HTML
│   ├── tsconfig.json          # Client TypeScript config
│   ├── tsconfig.node.json     # Node-specific TypeScript config
│   ├── tailwind.config.js     # TailwindCSS configuration
│   └── src/
│       ├── main.ts            # Vue app entry point
│       ├── App.vue            # Root Vue component
│       ├── style.css          # Global styles
│       ├── components/        # Reusable Vue components
│       ├── views/             # Page-level Vue components
│       ├── router/            # Vue Router setup
│       ├── store/             # State management
│       ├── services/          # API service layer
│       ├── types/             # Client-specific types
│       └── utils/             # Client utility functions
│
└── operationalDatabase/        # MySQL schema files (reference only)
    └── schema.sql             # Normalized MySQL schema for academic reference
```

## Setup Instructions

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017/campus_ordering
# PORT=3000
# NODE_ENV=development
# CORS_ORIGIN=http://localhost:5173
```

### 2. Start MongoDB

```bash
# Start MongoDB container
docker-compose up -d
# or just MongoDB service
bun run db:start

# Verify it's running
docker-compose ps
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Start Development Servers

```bash
# Terminal 1: Start backend server (with auto-reload)
bun run dev

# Terminal 2: Start frontend dev server (with Vite HMR)
bun run dev:client
```

### 5. Verify Setup

```bash
# Check backend health
curl http://localhost:3000/health

# Should return: {"status":"ok","message":"Alfred Ordering API is running"}
```

**Production Build:**

```bash
# Build client and server
bun run build:client
bun run build:server

# Or use Docker
bun run production
```

## API Endpoints

### Menus

```javascript
// GET /api/menu - Get complete menu
// Returns entire menu document with all groups, items, and extras

// PUT /api/admin/items/:id/availability - Update item availability
// Body: { is_available: false }

// PUT /api/admin/extras/:id/availability - Update extra availability
// Body: { is_available: false }

// POST /api/admin/items - Add new menu item
// Body: { menu_group_id, item_name, base_price, ... }
```

### Orders

```javascript
// POST /api/orders - Place new order
// Body: { customer_id, restaurant_id, items: [...], ... }
// Validates availability before creating order

// GET /api/orders/:id - Get order details
// Returns complete order with all embedded data

// GET /api/orders/customer/:customerId - Get customer order history

// PUT /api/orders/:id/status - Update order status
// Body: { status: "preparing" | "ready" | "completed" }
```

### Customers

```javascript
// GET /api/customers - Get all customers
// POST /api/customers - Create customer
// GET /api/customers/:id - Get customer details
// PUT /api/customers/:id - Update customer
// DELETE /api/customers/:id - Delete customer
```

## Order Creation Flow (Critical)

This is the most important operation - it must validate availability and create snapshots:

```javascript
async function createOrder(orderData) {
  // 1. Fetch current menu
  const menu = await Menu.findOne({ restaurant_id: orderData.restaurant_id });
  
  // 2. Validate ALL items are available
  for (const orderedItem of orderData.items) {
    const menuItem = menu.groups
      .flatMap(g => g.items)
      .find(i => i.item_id.equals(orderedItem.item_id));
    
    if (!menuItem.is_available) {
      throw new Error(`${menuItem.item_name} is currently unavailable`);
    }
    
    // 3. Validate extras are available
    for (const orderedExtra of orderedItem.extras) {
      const menuExtra = menuItem.extras
        .find(e => e.extra_id.equals(orderedExtra.extra_id));
      
      if (!menuExtra || !menuExtra.is_available) {
        throw new Error(`${menuExtra?.extra_name || 'Extra'} is unavailable`);
      }
    }
  }
  
  // 4. Fetch customer for snapshot
  const customer = await Customer.findById(orderData.customer_id);
  if (!customer) {
    throw new Error('Customer not found');
  }
  
  // 5. Build order with snapshots
  const order = new Order({
    order_number: generateOrderNumber(),
    
    // Snapshot customer info
    customer: {
      customer_id: customer._id,
      name: `${customer.fname} ${customer.lname}`,
      preferred_name: customer.preferred_name,
      email: customer.email,
      phone: customer.phone,
      student_id: customer.student_id
    },
    
    // Snapshot restaurant info
    restaurant: {
      restaurant_id: menu.restaurant_id,
      name: menu.restaurant_name,
      location: menu.restaurant_location,
      phone: menu.restaurant_phone
    },
    
    // Snapshot items with current prices
    items: orderData.items.map(orderedItem => {
      const menuItem = menu.groups
        .flatMap(g => g.items)
        .find(i => i.item_id.equals(orderedItem.item_id));
      
      return {
        order_item_id: new mongoose.Types.ObjectId(),
        menu_item_id: menuItem.item_id,
        item_name: menuItem.item_name,
        description: menuItem.description,
        unit_price: menuItem.base_price, // SNAPSHOT
        quantity: orderedItem.quantity,
        extras: orderedItem.extras.map(orderedExtra => {
          const menuExtra = menuItem.extras
            .find(e => e.extra_id.equals(orderedExtra.extra_id));
          return {
            extra_id: menuExtra.extra_id,
            extra_name: menuExtra.extra_name,
            extra_price: menuExtra.price_delta // SNAPSHOT
          };
        }),
        item_subtotal: calculateItemSubtotal(menuItem, orderedItem)
      };
    }),
    
    status: 'pending',
    order_datetime: new Date(),
    pickup_time_requested: orderData.pickup_time_requested,
    subtotal_amount: calculateSubtotal(orderData.items),
    tax_amount: calculateTax(subtotal),
    total_amount: subtotal + tax,
    special_instructions: orderData.special_instructions
  });
  
  // 6. Save order
  await order.save();
  
  return order;
}
```

## Design Decisions & Trade-offs

### 1. Denormalized MongoDB vs Normalized MySQL

**Decision:** Use denormalized MongoDB for the application

**Reasoning:**
- Menu browsing requires entire menu → single document query is fastest
- Orders are immutable after creation → snapshots prevent issues with changing data
- Updates are infrequent (staff changing availability) → no write contention issues
- Mobile app benefits from simple queries → better user experience

**Trade-off:**
- Data duplication (orders contain copies of customer/item data)
- No foreign key constraints (must validate in application code)
- Harder to update historical data if needed

### 2. Embedded Arrays vs References

**Decision:** Embed groups → items → extras in menu document

**Reasoning:**
- Menu is always accessed as a complete unit
- Groups/items/extras are never queried independently
- Eliminates multiple queries and JOINs
- Array size is bounded (reasonable number of menu items)

**Trade-off:**
- Updating nested items requires array filters
- Document size grows with menu complexity (but well under 16MB limit)
- Can't easily query "all items across all restaurants" (not a requirement)

### 3. Snapshots in Orders

**Decision:** Copy all data into order at creation time

**Reasoning:**
- Preserves historical accuracy (what customer ordered at what price)
- Order display doesn't require lookups
- Menu changes don't affect past orders
- Accounting/legal requirement

**Trade-off:**
- Data duplication
- Customer name changes won't update in historical orders
- Can't easily update prices retroactively (feature, not bug)

### 4. Image Storage

**Decision:** Store image URLs/paths in database, files in `/public/images/menu/`

**Reasoning:**
- Simple for prototype
- Express serves static files easily
- Database stays lean

**Production Alternative:**
- Use S3/CloudFront for images
- Store CDN URLs in database
- Same pattern, different storage backend

### 5. No Real-Time Sync

**Decision:** Skip MySQL → MongoDB sync implementation

**Reasoning:**
- Prototype scope - demonstrate understanding, not full implementation
- MongoDB alone is simpler and sufficient
- Can always add sync later if needed
- Class discussion covered the pattern conceptually

**If Implemented:**
- Nightly batch sync from MySQL to MongoDB
- MySQL = source of truth, MongoDB = read-optimized cache
- Accept data loss in MongoDB (eventual consistency)
- Common enterprise pattern (operational → analytics DB)

## Common Queries & Patterns

### Check Item Availability Before Ordering

```javascript
const menu = await Menu.findOne({ restaurant_id });
const item = menu.groups
  .flatMap(g => g.items)
  .find(i => i.item_id.equals(itemId));

if (!item.is_available) {
  throw new Error('Item unavailable');
}
```

### Mark Item Out of Stock

```javascript
await Menu.updateOne(
  { "groups.items.item_id": itemId },
  { 
    $set: { 
      "groups.$[].items.$[item].is_available": false,
      updated_at: new Date()
    }
  },
  { arrayFilters: [{ "item.item_id": itemId }] }
);
```

### Get Kitchen Display Orders

```javascript
const activeOrders = await Order.find({
  status: { $in: ['pending', 'preparing'] }
}).sort({ order_datetime: 1 });
```

### Get Customer Order History

```javascript
const orderHistory = await Order.find({
  'customer.customer_id': customerId
}).sort({ created_at: -1 }).limit(10);
```

### Add New Menu Item

```javascript
await Menu.updateOne(
  { "groups.group_id": groupId },
  {
    $push: {
      "groups.$.items": {
        item_id: new mongoose.Types.ObjectId(),
        item_name: "New Item",
        description: "Description",
        base_price: 9.99,
        is_available: true,
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
        extras: []
      }
    },
    $set: { updated_at: new Date() }
  }
);
```

## Testing Strategy

### Manual Testing with Compass

1. Use MongoDB Compass GUI to view/edit documents
2. Test availability updates manually
3. Create sample orders and verify snapshots

### API Testing

```bash
# Get menu
curl http://localhost:3000/api/menu

# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "...",
    "restaurant_id": "...",
    "items": [...]
  }'

# Update order status
curl -X PUT http://localhost:3000/api/orders/123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "ready"}'
```

## Academic Context & Learning Goals

This project demonstrates understanding of:

1. **Document Database Design** - Denormalization, embedding, references
2. **NoSQL Trade-offs** - Performance vs consistency, flexibility vs structure
3. **Sync Patterns** - Materialized views, eventual consistency, batch processing
4. **Real-World Problems** - Availability management, dynamic menus, historical accuracy
5. **Schema Design** - Both normalized (MySQL) and denormalized (MongoDB) approaches

## What We Removed from Original Schema

Tell your group these were removed/simplified:

- ❌ `order_status` table → Using string enum in orders
- ❌ `order_history` table → Not tracking status changes (just current state)
- ❌ `opening_hours` / `weekdays` tables → Out of scope for MVP
- ❌ `menu` table → Merged into menu groups/restaurant data
- ❌ Limited-time item tracking → Focusing on availability only
- ❌ Multiple normalized collections → Going fully denormalized for MongoDB

## Key Implementation Notes

1. **Always validate availability** before creating orders
2. **Always snapshot prices** when creating orders
3. **Use array filters** for nested updates in menus
4. **Index frequently queried fields** (customer_id, status, order_datetime)
5. **Keep customer collection separate** - don't embed in every order
6. **Image files in /public/images/menu/** - paths in database
7. **Generate unique order numbers** (e.g., ORD-20241124-0123)

## Docker Commands

```bash
# Start MongoDB
docker-compose up -d

# Stop MongoDB
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# View logs
docker-compose logs -f mongodb

# Connect to MongoDB shell
docker exec -it campus_ordering_mongo mongosh
```

## MongoDB Shell Commands

```javascript
// Connect to database
use campus_ordering

// View collections
show collections

// View all menus
db.menus.find().pretty()

// View all orders
db.orders.find().pretty()

// Count documents
db.orders.countDocuments()

// Find orders by status
db.orders.find({ status: "pending" })

// Drop collection (careful!)
db.orders.drop()
```

## Final Notes

This architecture prioritizes:
- **Simplicity** - Easy to understand and implement
- **Performance** - Fast queries for mobile app
- **Flexibility** - Easy to add/remove/modify menu items
- **Real-world applicability** - Solves actual campus ordering problems
- **Academic rigor** - Demonstrates understanding of both database paradigms

The MySQL schema exists for reference and academic credit, but the MongoDB implementation is what actually runs. This shows you understand both approaches and made an informed decision about which to use.
