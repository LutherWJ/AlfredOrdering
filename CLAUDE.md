# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Campus ordering application for Alfred State College dining. Built with MEVB stack (MongoDB, Express, Vue, Bun).

**Core Problems Solved:**
1. Real-time availability tracking (no more ordering out-of-stock items)
2. Dynamic menu management (add/remove items, toggle extras independently)
3. Historical price snapshots (orders preserve what customer actually paid)

**Key Architecture Pattern:** Denormalized MongoDB with 4-level nested documents (menu → groups → items → extras) and historical snapshots in orders.

## Essential Commands

### Development
```bash
# Start full development (database + server + client)
bun run dev              # Runs both server and client concurrently

# Start components individually
bun run dev:server       # Backend only (auto-reload with --watch)
bun run dev:client       # Frontend only (Vite HMR on :5173)
bun run db:start         # MongoDB container only

# Type checking
bun run typecheck        # Check both client and server
bun run typecheck:client # Vue + TypeScript client
bun run typecheck:server # Server TypeScript only
```

### Building & Production
```bash
bun run build:client     # Builds Vue app to dist/client
bun run build:server     # Compiles TypeScript server
bun run production       # Docker Compose production build
```

### Database Operations
```bash
bun run seed:menu        # Populates menu collection with sample data
bun run docker:clean     # Remove containers AND volumes (fresh start)
```

### Docker
```bash
bun run docker:up        # Start all containers
bun run docker:down      # Stop containers (keeps data)
bun run docker:logs      # View container logs
bun run docker:restart   # Restart containers
```

## Code Architecture

### Backend Structure (`server/`)

**Entry Point:** `server/index.ts`
- Express 5 app with CORS, cookie-parser, JSON middleware
- Routes mounted at `/api/{auth,menu,order,customer}`
- Global error handler and 404 handler
- Waits for MongoDB connection before listening

**Models (`server/models/`):**
- Mongoose schemas with deeply nested subdocuments
- `Menu.ts`: 4-level nesting (menu → groups → items → extras)
- `Order.ts`: Embedded snapshots (customer, restaurant, items)
- `Customer.ts`: Simple standalone collection
- Embedded schemas use `{ _id: false }` to prevent extra ObjectIds

**Services (`server/services/`):**
- `orderService.ts`: Core order creation logic ⭐ CRITICAL
  - `createOrder()` at line 174 - Main orchestration function
  - `validateItemAvailability()` - THE ENTIRE PROBLEM WE'RE SOLVING
  - Builds historical snapshots, calculates tax, generates order numbers

**Routes (`server/routes/`):**
- Thin route handlers that delegate to services
- `auth.ts`: Login/logout with JWT
- `menu.ts`: Fetch menus
- `order.ts`: Create orders, view history
- `customer.ts`: CRUD operations

**Middleware (`server/middleware/`):**
- `auth.ts`: JWT token validation, extracts customer_id from token

**Utilities (`server/utils/`):**
- `validation.ts`: Zod schemas for request validation

### Frontend Structure (`client/`)

**Entry Point:** `client/main.ts`
- Initializes Vue 3 app with Pinia and Vue Router
- Mounts to `#app` in `client/index.html`

**Routing Flow (`client/router/index.ts`):**
```
Home → Login → MenuSelect → MenuGroupSelect → MenuItemSelect
     → ItemExtraSelect → Cart → Checkout
```
- Auth guard redirects to `/login` if not authenticated
- Prevents logged-in users from accessing login page

**State Management (`client/store/`):**
- **Pinia stores (Composition API pattern)**
- `authStore.ts`: JWT auth, login/logout, check auth status
- `menuStore.ts`: Menu caching with 5-minute TTL, smart cache invalidation
- `cartStore.ts`: Shopping cart state, builds `CreateOrderRequest` for API

**Services (`client/services/`):**
- `api.ts`: Axios instance with credentials and base URL
- `authService.ts`: Authentication API calls
- `menuService.ts`: Fetch menus from backend
- `orderService.ts`: Create orders, fetch order history

**Views (`client/views/`):**
- Selection flow uses route params to navigate nested menu structure
- Each level passes IDs to next level via Vue Router params
- Cart and Checkout handle order submission and confirmation

**Components (`client/components/`):**
- `NavigationHeader.vue`: Back navigation with cart badge
- `SelectionCard.vue`: Reusable card for menu items/groups
- `QuantitySelector.vue`: +/- quantity controls
- `ExtraCheckbox.vue`: Extra option selection with price display

### Shared Types (`shared/types.ts`)

TypeScript interfaces shared between client and server:
- Domain models: `Menu`, `MenuItem`, `MenuExtra`, `Order`, `Customer`
- API requests: `CreateOrderRequest`, `LoginRequest`, etc.
- API responses: `LoginResponse`, `HealthResponse`, etc.
- `Result<T,E>` type for explicit error handling
- **Ensures end-to-end type safety**

## Key Implementation Patterns

### Order Creation Flow ⭐ CRITICAL

**This is the most important operation in the system.**

Located in: `server/services/orderService.ts:174` - `createOrder()`

**Flow:**
1. **Fetch Phase:**
   - Get customer document by ID
   - Get menu document by restaurant_id

2. **Validation Phase:**
   - For each ordered item, verify `is_available: true` in current menu
   - For each extra, verify `is_available: true`
   - Throw error if ANY item/extra is unavailable (prevents substitutions!)

3. **Snapshot Phase:**
   - Create customer snapshot (name, email, phone, student_id)
   - Create restaurant snapshot (name, location, phone)
   - Create item snapshots with CURRENT prices (preserves historical pricing)

4. **Order Creation:**
   - Generate unique `order_number` (format: ORD-timestamp-random)
   - Calculate subtotal, tax, total
   - Create Order document with all snapshots
   - Save to database
   - Return complete order

**Why Snapshots?** Menu prices change over time, but orders must reflect what customer actually paid at order time. Customer names can change, but historical orders preserve the name at time of order.

### Menu Caching Strategy

Frontend `menuStore` implements smart caching:
- `fetchMenus(force?)` - Fetches all menus, respects 5-minute cache unless `force=true`
- `fetchMenuByRestaurantId()` - Returns cached menu if valid, else fetches all
- `clearCache()` - Invalidates cache (call after admin menu updates)
- `isCacheValid` computed property checks if last fetch was within TTL

### Authentication Pattern

- JWT tokens stored in **httpOnly cookies** (set by server, prevents XSS)
- `authenticateToken` middleware extracts `customer_id` from JWT payload
- Frontend `authStore` checks auth status on app initialization
- Router guards prevent unauthenticated access to protected routes
- Token refresh not implemented (tokens expire after 24h)

### Nested Menu Updates

Updating deeply nested fields requires MongoDB **array filters**:

```javascript
// Mark item unavailable (3 levels deep)
await Menu.updateOne(
  { "groups.items.item_id": itemId },
  { $set: { "groups.$[].items.$[item].is_available": false } },
  { arrayFilters: [{ "item.item_id": itemId }] }
)

// Disable specific extra (4 levels deep)
await Menu.updateOne(
  { "groups.items.extras.extra_id": extraId },
  { $set: { "groups.$[].items.$[].extras.$[extra].is_available": false } },
  { arrayFilters: [{ "extra.extra_id": extraId }] }
)

// Add new item to group
await Menu.updateOne(
  { "groups.group_id": groupId },
  { $push: { "groups.$.items": newItemObject } }
)
```

## Database Architecture

### MongoDB Collections (3)

**Database Name:** `campus_ordering`

#### 1. `customers` Collection
Simple customer records - kept separate (not embedded in orders) because:
- Customers exist before their first order
- Customer info updates shouldn't affect all historical orders
- Reasonable collection size (one doc per customer)

```javascript
{
  _id: ObjectId,
  fname: "Luther",
  lname: "Student",
  email: "luther@alfred.edu",        // Unique index
  phone: "+1-607-555-0123",
  student_id: "STU20240001",         // Unique sparse index
  preferred_name: "Luke",
  is_active: true,
  created_at: ISODate,
  updated_at: ISODate
}
```

#### 2. `menus` Collection ⭐ CORE PATTERN

**One document per restaurant** with entire menu structure embedded.

```javascript
{
  _id: ObjectId,
  restaurant_id: ObjectId,           // Indexed
  restaurant_name: "Campus Grill",
  restaurant_location: "Powell Campus Center",
  restaurant_phone: "+1-607-555-0200",
  is_active: true,

  groups: [                          // Level 1: Groups
    {
      group_id: ObjectId,
      group_name: "Burgers & Sandwiches",
      display_order: 2,
      is_active: true,

      items: [                       // Level 2: Items
        {
          item_id: ObjectId,
          item_name: "Cheeseburger Deluxe",
          description: "Quarter pound beef patty with cheese",
          base_price: 8.99,
          image_url: "/images/menu/cheeseburger.jpg",
          is_available: true,        // ⭐ AVAILABILITY TRACKING
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
          prep_time: 15,
          max_per_order: 10,

          extras: [                  // Level 3: Extras
            {
              extra_id: ObjectId,
              extra_name: "Extra Cheese",
              extra_description: "Add extra melted cheese",
              price_delta: 1.50,
              is_available: true,    // ⭐ PER-EXTRA AVAILABILITY
              is_required: false,
              max_selectable: 3,
              display_order: 1
            }
          ]
        }
      ]
    }
  ],

  created_at: ISODate,
  updated_at: ISODate
}
```

**Why This Structure?**
- **Single query loads entire menu** - perfect for mobile browsing
- **Easy availability updates** - single update to toggle item/extra
- **No JOINs needed** - everything in one document
- **Flexible** - add/remove items dynamically
- **Document size** - well under 16MB limit even for large menus

#### 3. `orders` Collection

**One document per order** with complete snapshots.

```javascript
{
  _id: ObjectId,
  order_number: "ORD-20241124-0123", // Unique

  customer: {                        // ⭐ SNAPSHOT
    customer_id: ObjectId,
    name: "Luther Student",
    preferred_name: "Luke",
    email: "luther@alfred.edu",
    phone: "+1-607-555-0123",
    student_id: "STU20240001"
  },

  restaurant: {                      // ⭐ SNAPSHOT
    restaurant_id: ObjectId,
    name: "Campus Grill",
    location: "Powell Campus Center",
    phone: "+1-607-555-0200"
  },

  items: [                           // ⭐ SNAPSHOTS
    {
      order_item_id: ObjectId,
      menu_item_id: ObjectId,        // Reference for analytics
      item_name: "Cheeseburger Deluxe",
      description: "Quarter pound beef patty with cheese",
      unit_price: 8.99,              // ⭐ PRICE SNAPSHOT
      quantity: 2,

      extras: [
        {
          extra_id: ObjectId,
          extra_name: "Extra Cheese",
          extra_price: 1.50          // ⭐ PRICE SNAPSHOT
        }
      ],

      item_subtotal: 20.98
    }
  ],

  status: "pending",                 // pending|preparing|ready|completed|cancelled
  order_datetime: ISODate,
  pickup_time_requested: ISODate,
  pickup_time_ready: ISODate,

  subtotal_amount: 20.98,
  tax_amount: 1.68,
  total_amount: 22.66,

  special_instructions: "Extra napkins please",
  is_cancelled: false,
  cancelled_at: null,

  created_at: ISODate,
  updated_at: ISODate
}
```

**Why Snapshots?**
- Preserves historical accuracy (what customer paid)
- Order display doesn't require lookups or JOINs
- Menu changes don't retroactively affect past orders
- Accounting/legal requirement

### Design Decisions & Trade-offs

**1. Denormalized MongoDB (vs Normalized MySQL)**
- ✅ Fast reads (single query for entire menu)
- ✅ Simple updates (no cascading changes)
- ✅ Perfect for read-heavy mobile app
- ❌ Data duplication in orders
- ❌ No foreign key constraints (validate in code)
- ❌ Harder to update historical data

**2. Embedded Arrays (vs References)**
- ✅ Menu always accessed as complete unit
- ✅ Eliminates JOINs
- ✅ Bounded size (reasonable # of items)
- ❌ Nested updates require array filters
- ❌ Can't query "all items across restaurants"

**3. Snapshots in Orders**
- ✅ Historical accuracy
- ✅ No lookups needed for order display
- ✅ Immutable after creation
- ❌ Data duplication
- ❌ Customer updates don't affect old orders

### MySQL Reference (Academic Context)

A normalized MySQL schema exists in `operationalDatabase/schema.sql` for academic purposes to demonstrate understanding of traditional relational design. **It is NOT implemented in the application.**

**Key Differences:**
- 8 normalized tables vs 3 MongoDB collections
- Foreign key constraints vs application-level validation
- JOINs required vs embedded documents
- Better for complex transactions vs better for read performance

This demonstrates understanding of both paradigms and making informed architectural decisions.

## Common Development Tasks

### Adding a New API Route
1. Create route handler in `server/routes/{resource}.ts`
2. Define types in `shared/types.ts` (request/response interfaces)
3. Mount route in `server/index.ts`: `app.use('/api/{resource}', router)`
4. Create corresponding service in `client/services/{resource}Service.ts`
5. Update Pinia store if state management needed

### Adding a New Vue View
1. Create component in `client/views/{ViewName}.vue`
2. Add route in `client/router/index.ts`
3. Add navigation link from appropriate view
4. Consider adding to navigation header if top-level page

### Adding a Menu Item Programmatically
```typescript
const menu = await Menu.findOne({ restaurant_id });
const group = menu.groups.find(g => g.group_id.equals(groupId));

group.items.push({
  item_id: new mongoose.Types.ObjectId(),
  item_name: "New Item",
  description: "Description",
  base_price: 9.99,
  is_available: true,
  extras: []
});

await menu.save();
// Clear frontend cache!
```

### Debugging Order Creation Issues
1. Check server logs for validation errors
2. Verify `is_available` flags in menu document (use MongoDB Compass)
3. Ensure `customer_id` exists and JWT token is valid
4. Confirm cart items have valid `item_id` and `extra_id` values
5. Check that `restaurant_id` matches menu document
6. Verify tax calculation in `shared/constants.ts`

### Updating Item Availability
```typescript
// Backend route: PUT /api/admin/items/:itemId/availability
await Menu.updateOne(
  { "groups.items.item_id": itemId },
  {
    $set: {
      "groups.$[].items.$[item].is_available": isAvailable,
      updated_at: new Date()
    }
  },
  { arrayFilters: [{ "item.item_id": itemId }] }
);
// Clear frontend menu cache!
```

## File Reference Guide

**Critical Files:**
- `server/services/orderService.ts:174` - Order creation orchestration
- `server/models/Menu.ts` - 4-level nested menu schema
- `client/store/cartStore.ts` - Shopping cart state & request builder
- `client/router/index.ts:30` - Auth navigation guards
- `shared/types.ts` - All shared TypeScript interfaces

**Configuration:**
- `vite.config.ts` - Frontend build config (root: ./client)
- `docker-compose.yml` - Container orchestration
- `.env.example` - Environment variables template
- `server/config/connection.ts` - MongoDB connection setup

**Seeding:**
- `server/scripts/seedMenu.ts` - Sample menu data generator

## Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://admin:securepassword@localhost:27017/alfred_ordering_db?authSource=admin

# JWT
JWT_SECRET=your-secret-key-here          # Change in production!
JWT_EXPIRE=24h

# CORS
CORS_ORIGIN=http://localhost:5173        # Frontend dev server
```

**MongoDB Connection Strings:**
- Local dev: `mongodb://admin:securepassword@localhost:27017/alfred_ordering_db?authSource=admin`
- Docker containers: `mongodb://alfred_user:alfred_password@mongodb:27017/alfred_ordering_db`

### First-Time Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Install dependencies
bun install

# 3. Start MongoDB
bun run db:start

# 4. Seed sample data (optional)
bun run seed:menu

# 5. Start development servers
bun run dev          # Server on :3000
bun run dev:client   # Client on :5173
```

## Technology-Specific Notes

### Bun Runtime
- Drop-in Node.js replacement with faster startup and native TypeScript
- `bun run --watch` provides hot-reload for server
- All npm scripts work with `bun run`
- No transpilation needed for TypeScript

### Vue 3 Composition API
- All components use `<script setup>` syntax
- Pinia stores use Composition API pattern: `defineStore(() => { ... })`
- TypeScript with `<script setup lang="ts">`
- Reactive state with `ref()` and `computed()`

### Mongoose Patterns
- Use `{ _id: false }` on embedded schemas to prevent extra ObjectIds
- `pre('save')` hooks update `updated_at` timestamps
- Indexes on frequently queried fields: `restaurant_id`, `customer_id`, `status`
- Array filters for updating nested documents

### Vite Configuration
- Root set to `./client` directory
- Dev server on port 5173
- Builds to `../dist/client`
- Vue plugin with JSX support

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login with email (returns JWT in httpOnly cookie)
- `POST /api/auth/logout` - Clear auth cookie
- `GET /api/auth/check` - Check if authenticated

### Menus
- `GET /api/menu` - Get all active menus
- `GET /api/menu/:restaurantId` - Get menu by restaurant ID

### Orders
- `POST /api/order` - Create new order (validates availability)
- `GET /api/order/history` - Get authenticated customer's order history

### Customers
- `GET /api/customer` - Get all customers
- `POST /api/customer` - Create customer
- `GET /api/customer/:id` - Get customer by ID
- `PUT /api/customer/:id` - Update customer
- `DELETE /api/customer/:id` - Delete customer

## Common MongoDB Queries

```javascript
// Get entire menu for restaurant
db.menus.findOne({ restaurant_id: ObjectId("...") })

// Find pending/preparing orders (kitchen display)
db.orders.find({ status: { $in: ["pending", "preparing"] } })
  .sort({ order_datetime: 1 })

// Get customer order history
db.orders.find({ "customer.customer_id": ObjectId("...") })
  .sort({ created_at: -1 })
  .limit(10)

// Mark item unavailable
db.menus.updateOne(
  { "groups.items.item_id": ObjectId("...") },
  { $set: { "groups.$[].items.$[item].is_available": false } },
  { arrayFilters: [{ "item.item_id": ObjectId("...") }] }
)
```

## Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f mongodb

# Stop services (keeps data)
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# MongoDB shell
docker exec -it alfred_ordering_db mongosh -u admin -p securepassword
```

## Known Patterns & Conventions

**Naming:**
- Database fields: `snake_case` (e.g., `restaurant_id`, `is_available`)
- TypeScript/JavaScript: `camelCase` for variables, `PascalCase` for types/components
- Route params: `camelCase` (e.g., `restaurantId`, `groupId`, `itemId`)

**API Responses:**
- Success: `{ ok: true, value: T }`
- Failure: `{ ok: false, error: E }`
- Errors include message and optional details

**ObjectId Handling:**
- MongoDB stores as `ObjectId`
- API converts to strings for JSON serialization
- Frontend receives/sends strings
- Backend converts strings back to `ObjectId` for queries

**Image Paths:**
- Stored as paths in database (e.g., `/images/menu/cheeseburger.jpg`)
- Files in `public/images/menu/` (or future CDN)
- Express serves static files in development

## Academic Context

This project demonstrates understanding of:
1. **Document Database Design** - Denormalization, embedding, array operations
2. **NoSQL Trade-offs** - Performance vs consistency, flexibility vs structure
3. **Schema Design** - Both normalized (MySQL reference) and denormalized (MongoDB actual)
4. **Real-World Problem Solving** - Availability tracking, dynamic menus, historical snapshots
5. **Full-Stack TypeScript** - Shared types, end-to-end type safety

The MySQL schema in `operationalDatabase/schema.sql` exists for academic reference showing understanding of normalized design. The MongoDB implementation is what actually runs, demonstrating an informed architectural decision for this use case.