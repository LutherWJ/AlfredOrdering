import mongoose from 'mongoose';

// Order extra schema (snapshot of extra at order time)
const orderExtraSchema = new mongoose.Schema({
    extra_id: mongoose.Schema.Types.ObjectId,
    extra_name: {
        type: String,
        required: true
    },
    extra_price: {
        type: Number,
        required: true
    }
}, { _id: false });

// Order item schema (snapshot of item at order time)
const orderItemSchema = new mongoose.Schema({
    order_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
    },
    menu_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    item_name: {
        type: String,
        required: true
    },
    description: String,
    unit_price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    extras: [orderExtraSchema],
    line_subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

// Customer snapshot schema
const customerSnapshotSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    preferred_name: String,
    email: {
        type: String,
        required: true
    },
    phone: String,
    student_id: String
}, { _id: false });

// Restaurant snapshot schema
const restaurantSnapshotSchema = new mongoose.Schema({
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    phone: String
}, { _id: false });

// Main order schema
const orderSchema = new mongoose.Schema({
    order_number: {
        type: String,
        required: true,
        unique: true
    },
    // Denormalized customer info (snapshot at order time)
    customer: {
        type: customerSnapshotSchema,
        required: true
    },
    // Denormalized restaurant info
    restaurant: {
        type: restaurantSnapshotSchema,
        required: true
    },
    // Complete order items with snapshots
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function(items: any[]) {
                return items.length > 0;
            },
            message: 'Order must contain at least one item'
        }
    },
    // Order status
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
        default: 'pending',
        required: true
    },
    // Timing
    order_datetime: {
        type: Date,
        default: Date.now,
        required: true
    },
    pickup_time_requested: Date,
    pickup_time_ready: Date,
    // Money
    subtotal_amount: {
        type: Number,
        required: true,
        min: 0
    },
    tax_amount: {
        type: Number,
        required: true,
        min: 0
    },
    total_amount: {
        type: Number,
        required: true,
        min: 0
    },
    special_instructions: {
        type: String,
        maxlength: 500
    },
    is_cancelled: {
        type: Boolean,
        default: false
    },
    cancelled_at: Date,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update updated_at on save
orderSchema.pre('save', function() {
    this.updated_at = new Date();
});

orderSchema.index({ order_number: 1 });
orderSchema.index({ 'customer.customer_id': 1, created_at: -1 }); // Customer order history
orderSchema.index({ status: 1, created_at: -1 }); // Kitchen display (pending/preparing orders)
orderSchema.index({ created_at: -1 }); // Recent orders

export default mongoose.model('Orders', orderSchema);
