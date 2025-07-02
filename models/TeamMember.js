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

teamMemberSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

teamMemberSchema.index({ firstName: 1, lastName: 1 }, { unique: true });

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

teamMemberSchema.methods.getDisplayName = function() {
    return `${this.firstName} ${this.lastName}`;
};

module.exports = mongoose.model('TeamMember', teamMemberSchema);