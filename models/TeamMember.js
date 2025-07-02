const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
teamMemberSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Compound index for unique name combination
teamMemberSchema.index({ firstName: 1, lastName: 1 }, { unique: true });

// Pre-save middleware to handle case-insensitive uniqueness
teamMemberSchema.pre('save', async function(next) {
    if (this.isModified('firstName') || this.isModified('lastName')) {
        const existingMember = await this.constructor.findOne({
            firstName: { $regex: new RegExp(`^${this.firstName}$`, 'i') },
            lastName: { $regex: new RegExp(`^${this.lastName}$`, 'i') },
            _id: { $ne: this._id }
        });
        
        if (existingMember) {
            const error = new Error('Team member with this name already exists');
            error.code = 'DUPLICATE_MEMBER';
            return next(error);
        }
    }
    next();
});

// Instance method to get display name
teamMemberSchema.methods.getDisplayName = function() {
    return `${this.firstName} ${this.lastName}`;
};

module.exports = mongoose.model('TeamMember', teamMemberSchema);