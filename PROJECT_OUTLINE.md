# Alfred Ordering - Mobile Ordering App
## MEVB Stack (MongoDB, Express, Vue, Bun)

---

## Project Overview
A campus/institution mobile ordering application that allows students and staff to browse menus, place orders, and manage their food delivery/pickup from various campus vendors.

---

## Tech Stack

### Backend (Server)
- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Express.js 5.x
- **Database**: MongoDB 7.0
- **ODM**: Mongoose 9.x
- **Language**: TypeScript
- **API Style**: RESTful API

### Frontend (Client)
- **Framework**: Vue 3 (to be added)
- **Build Tool**: Vite (to be added)
- **Styling**: Tailwind CSS 3.x
- **Mobile Framework**: Capacitor/Cordova (to be determined)
- **Language**: TypeScript

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Container**: MongoDB 7.0
- **Environment Management**: dotenv

---

## Project Structure

```
AlfredOrdering/
├── client/                    # Frontend mobile app
│   ├── src/
│   │   ├── assets/           # Images, fonts, static files
│   │   ├── components/       # Reusable Vue components
│   │   ├── views/            # Page-level components
│   │   ├── router/           # Vue Router configuration
│   │   ├── store/            # State management (Pinia/Vuex)
│   │   ├── services/         # API service layer
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # TypeScript type definitions
│   │   ├── App.vue           # Root component
│   │   └── main.ts           # App entry point
│   ├── public/               # Static assets
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                   # Backend API
│   ├── config/
│   │   ├── connection.ts     # MongoDB connection
│   │   └── env.ts            # Environment variables config
│   ├── models/               # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Vendor.ts
│   │   ├── menu.ts
│   │   ├── Order.ts
│   │   └── Category.ts
│   ├── routes/               # API route handlers
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── vendors.ts
│   │   ├── menu.ts
│   │   └── orders.ts
│   ├── controllers/          # Business logic
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── vendorController.ts
│   │   ├── menuController.ts
│   │   └── orderController.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── utils/                # Helper functions
│   │   ├── jwt.ts
│   │   ├── passwordHash.ts
│   │   └── validators.ts
│   ├── types/                # TypeScript interfaces
│   │   └── index.ts
│   └── index.ts              # Server entry point
│
├── shared/                   # Shared types/utils (optional)
│   └── types/
│
├── docker-compose.yml
├── Dockerfile
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Features

### 1. User Management
- User registration and authentication
- User profiles (student/staff)
- Order history
- Saved payment methods
- Favorites/Quick reorder

### 2. Vendor Management
- Vendor profiles
- Operating hours
- Location information
- Vendor ratings and reviews

### 3. Menu System
- Browse menus by vendor
- Category-based organization
- Item details (price, description, images)
- Dietary information (vegetarian, vegan, allergens)
- Item availability status
- Customization options (size, toppings, etc.)

### 4. Order Management
- Shopping cart
- Order placement
- Real-time order status tracking
- Order notifications
- Pickup/delivery options
- Estimated preparation time

### 5. Payment Integration
- Multiple payment methods
- Order total calculation
- Transaction history
- Digital receipts

### 6. Search & Filtering
- Search menu items
- Filter by category, dietary preferences
- Sort by price, popularity, rating

### 7. Notifications
- Order confirmation
- Order ready alerts
- Special offers/promotions

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  passwordHash: String,
  role: String (enum: 'student', 'staff', 'vendor', 'admin'),
  phoneNumber: String,
  profileImage: String,
  favorites: [ObjectId], // MenuItem references
  createdAt: Date,
  updatedAt: Date
}
```

### Vendors Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  logo: String,
  location: {
    building: String,
    room: String,
    coordinates: { lat: Number, lng: Number }
  },
  operatingHours: [{
    day: String,
    open: String,
    close: String
  }],
  contactInfo: {
    phone: String,
    email: String
  },
  rating: Number,
  totalReviews: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### MenuItems Collection
```javascript
{
  _id: ObjectId,
  vendorId: ObjectId,
  name: String,
  description: String,
  category: String,
  price: Number,
  images: [String],
  dietary: {
    vegetarian: Boolean,
    vegan: Boolean,
    glutenFree: Boolean,
    allergens: [String]
  },
  customizations: [{
    name: String,
    options: [{ name: String, price: Number }]
  }],
  isAvailable: Boolean,
  preparationTime: Number, // minutes
  popularity: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  vendorId: ObjectId,
  items: [{
    menuItemId: ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    customizations: Object
  }],
  status: String (enum: 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'),
  totalAmount: Number,
  orderType: String (enum: 'pickup', 'delivery'),
  specialInstructions: String,
  paymentMethod: String,
  paymentStatus: String,
  estimatedReadyTime: Date,
  actualReadyTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Categories Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  icon: String,
  sortOrder: Number
}
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/favorites` - Get user favorites
- `POST /api/users/favorites/:itemId` - Add to favorites
- `DELETE /api/users/favorites/:itemId` - Remove from favorites

### Vendors
- `GET /api/vendors` - Get all vendors
- `GET /api/vendors/:id` - Get vendor details
- `GET /api/vendors/:id/menu` - Get vendor menu
- `GET /api/vendors/:id/hours` - Get operating hours

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get menu item details
- `GET /api/menu/search?q=query` - Search menu items
- `GET /api/menu/category/:category` - Filter by category

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/:id/status` - Track order status

### Categories
- `GET /api/categories` - Get all categories

---

## Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up development environment
- [ ] Configure MongoDB with Docker
- [ ] Create basic Express server
- [ ] Implement database connection
- [ ] Define Mongoose schemas
- [ ] Set up TypeScript configuration

### Phase 2: Backend API (Weeks 3-5)
- [ ] Implement authentication system (JWT)
- [ ] Create user management endpoints
- [ ] Build vendor management system
- [ ] Develop menu management API
- [ ] Implement order processing logic
- [ ] Add input validation and error handling
- [ ] Write API documentation

### Phase 3: Frontend Setup (Weeks 6-7)
- [ ] Initialize Vue 3 project with Vite
- [ ] Set up Vue Router
- [ ] Configure state management (Pinia)
- [ ] Implement Tailwind CSS styling
- [ ] Create reusable UI components
- [ ] Set up API service layer

### Phase 4: Core Features (Weeks 8-10)
- [ ] Build authentication screens (login/register)
- [ ] Create vendor browsing interface
- [ ] Develop menu browsing and item details
- [ ] Implement shopping cart functionality
- [ ] Build order placement flow
- [ ] Create order tracking interface
- [ ] Implement user profile management

### Phase 5: Advanced Features (Weeks 11-12)
- [ ] Add search and filtering
- [ ] Implement favorites system
- [ ] Create order history view
- [ ] Add real-time notifications
- [ ] Implement rating and review system
- [ ] Add payment integration

### Phase 6: Mobile Optimization (Weeks 13-14)
- [ ] Set up Capacitor for mobile deployment
- [ ] Optimize for mobile performance
- [ ] Implement native mobile features
- [ ] Add offline capability
- [ ] Test on iOS and Android

### Phase 7: Testing & Deployment (Weeks 15-16)
- [ ] Write unit tests
- [ ] Perform integration testing
- [ ] Conduct user acceptance testing
- [ ] Set up production environment
- [ ] Deploy to production
- [ ] Monitor and fix bugs

---

## Environment Variables

Create `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://admin:securepassword@localhost:27017/alfred_ordering_db?authSource=admin
MONGODB_TEST_URI=mongodb://localhost:27017/alfred_ordering_test

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Payment Gateway (future)
PAYMENT_API_KEY=your-payment-api-key
```

---

## Getting Started

### Prerequisites
- Bun runtime installed
- Docker and Docker Compose
- Node.js (for tooling compatibility)
- Git

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd AlfredOrdering
```

2. Install dependencies
```bash
bun install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB with Docker
```bash
docker-compose up -d
```

5. Run the development server
```bash
# Backend
bun run dev

# Frontend (in separate terminal)
cd client
bun run dev
```

---

## Testing Strategy

### Backend Testing
- Unit tests for controllers and utilities
- Integration tests for API endpoints
- Database testing with test containers
- Authentication and authorization tests

### Frontend Testing
- Component unit tests with Vitest
- E2E tests with Playwright/Cypress
- Mobile responsiveness testing
- Cross-browser testing

---

## Security Considerations

- [ ] Implement rate limiting
- [ ] Add request validation and sanitization
- [ ] Use HTTPS in production
- [ ] Implement CORS properly
- [ ] Hash passwords with bcrypt
- [ ] Use JWT with refresh tokens
- [ ] Protect against SQL/NoSQL injection
- [ ] Implement CSRF protection
- [ ] Add helmet.js for security headers
- [ ] Regular dependency updates

---

## Performance Optimization

- [ ] Implement database indexing
- [ ] Use caching (Redis)
- [ ] Optimize image delivery
- [ ] Code splitting in frontend
- [ ] Lazy loading of components
- [ ] API response compression
- [ ] CDN for static assets

---

## Future Enhancements

- Push notifications for order updates
- Admin dashboard for vendors
- Analytics and reporting
- Loyalty program
- Group ordering functionality
- Social features (share favorites)
- Integration with campus ID cards
- Multi-language support
- Dark mode
- Accessibility improvements

---

## Documentation

- API documentation (Swagger/OpenAPI)
- Component documentation (Storybook)
- Database schema documentation
- Deployment guide
- User manual
- Contributing guidelines

---

## License

[Specify your license here]

---

## Contributors

[List contributors here]

---

## Support

For support, email: [your-email@example.com]
