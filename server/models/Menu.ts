import mongoose, { InferSchemaType } from 'mongoose';

// Extra option schema (embedded in menu items)
// Note: This schema is recursive - extras can contain nested extras
const extraSchema = new mongoose.Schema({
    extra_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
    },
    extra_name: {
        type: String,
        required: true
    },
    extra_description: String,
    price_delta: {
        type: Number,
        required: true,
        min: 0,
        default: 0  // Most nested extras are $0
    },
    is_available: {
        type: Boolean,
        default: true
    },
    is_required: {
        type: Boolean,
        default: false
    },
    max_selectable: {
        type: Number,
        min: 1,
        default: 1  // Default to 1 for radio button groups (entree, side, drink)
    },
    display_order: {
        type: Number,
        default: 0
    }
}, { _id: false });

// Add recursive self-reference for nested extras (e.g., meals with entree/side/drink)
// This allows extras to have their own extras (e.g., "Entree" -> "Cheeseburger" -> "No Pickles")
extraSchema.add({
    extras: {
        type: [extraSchema],
        default: []
    }
});

// Menu item schema (embedded in menu groups)
const menuItemSchema = new mongoose.Schema({
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
    },
    item_name: {
        type: String,
        required: true
    },
    description: String,
    base_price: {
        type: Number,
        required: true,
        min: 0
    },
    image_url: {
        type: String,
        default: '/images/menu/default.jpg'
    },
    is_available: {
        type: Boolean,
        default: true
    },
    is_vegetarian: {
        type: Boolean,
        default: false
    },
    is_vegan: {
        type: Boolean,
        default: false
    },
    is_gluten_free: {
        type: Boolean,
        default: false
    },
    prep_time: {
        type: Number,
        min: 0
    },
    max_per_order: {
        type: Number,
        min: 1,
        default: 10
    },
    extras: [extraSchema]
}, { _id: false });

// Menu group schema (embedded in menu)
const menuGroupSchema = new mongoose.Schema({
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
    },
    group_name: {
        type: String,
        required: true
    },
    display_order: {
        type: Number,
        required: true,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    items: [menuItemSchema]
}, { _id: false });

// Main menu schema (one per restaurant)
const menuSchema = new mongoose.Schema({
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    restaurant_name: {
        type: String,
        required: true
    },
    restaurant_location: {
        type: String,
        required: true
    },
    restaurant_phone: String,
    is_active: {
        type: Boolean,
        default: true
    },
    groups: [menuGroupSchema],
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
menuSchema.pre('save', function() {
    this.updated_at = new Date();
});

// Index for quick restaurant lookup
menuSchema.index({ restaurant_id: 1 });

// Export inferred types for sync script
export type MenuExtraDocument = InferSchemaType<typeof extraSchema>;
export type MenuItemDocument = InferSchemaType<typeof menuItemSchema>;
export type MenuGroupDocument = InferSchemaType<typeof menuGroupSchema>;
export type MenuDocument = InferSchemaType<typeof menuSchema>;

export default mongoose.model('Menus', menuSchema);
