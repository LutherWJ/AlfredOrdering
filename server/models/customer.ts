import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    student_id: {
        type: String,
        unique: true,
        sparse: true // Allows null while maintaining uniqueness
    },
    preferred_name: String,
    is_active: {
        type: Boolean,
        default: true
    },
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
customerSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

export default mongoose.model('Customer', customerSchema);
