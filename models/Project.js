const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    clientCode: {
        type: String,
        required: [true, 'Client code is required'],
        trim: true,
        unique: true,
        maxlength: [20, 'Client code cannot exceed 20 characters']
    },
    companyLogo: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v) return true;
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Company logo must be a valid URL'
        }
    },
    companyLogoPublicId: {
        type: String,
        trim: true,
    },
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    projectName: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true,
        maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    typeOfProject: {
        type: String,
        required: true,
        enum: ['Based on client', 'Internal project', 'Research & Development', 'Maintenance'],
        default: 'Based on client'
    },
    pvProjectManager: {
        type: String,
        required: [true, 'PV Project Manager is required'],
        trim: true,
        maxlength: [100, 'PV Project Manager name cannot exceed 100 characters']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function(value) {
                return this.startDate < value;
            },
            message: 'End date must be after start date'
        }
    },
    allottedBillingHours: {
        type: Number,
        required: [true, 'Allotted billing hours is required'],
        min: [0.5, 'Allotted billing hours must be at least 0.5'],
        max: [10000, 'Allotted billing hours cannot exceed 10000']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['IT', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']
    },
    teamMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeamMember'
    }]
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.companyLogoPublicId;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

projectSchema.virtual('durationInDays').get(function() {
    if (this.startDate && this.endDate) {
        const timeDiff = this.endDate - this.startDate;
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    }
    return 0;
});

projectSchema.virtual('hoursUtilization').get(function() {
    if (this.allottedBillingHours > 0) {
        return Math.round((this.actualHoursSpent / this.allottedBillingHours) * 100);
    }
    return 0;
});

projectSchema.index({ clientCode: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ department: 1 });

projectSchema.pre('save', function(next) {
    if (this.isNew && this.startDate < new Date().setHours(0, 0, 0, 0)) {
        const error = new Error('Start date cannot be in the past');
        return next(error);
    }
    next();
});

projectSchema.pre('remove', async function(next) {
    try {
        if (this.companyLogoPublicId) {
            const cloudinary = require('../config/cloudinary');
            await cloudinary.uploader.destroy(this.companyLogoPublicId);
        }
        next();
    } catch (error) {
        console.error('Error cleaning up Cloudinary image:', error);
        next();
    }
});

projectSchema.statics.findByStatus = function(status) {
    return this.find({ status }).populate('teamMembers', 'firstName lastName');
};

projectSchema.statics.findByDateRange = function(startDate, endDate) {
    return this.find({
        $or: [
            { startDate: { $gte: startDate, $lte: endDate } },
            { endDate: { $gte: startDate, $lte: endDate } },
            { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
        ]
    }).populate('teamMembers', 'firstName lastName');
};

projectSchema.methods.addTeamMember = function(memberId) {
    if (!this.teamMembers.includes(memberId)) {
        this.teamMembers.push(memberId);
    }
    return this.save();
};

projectSchema.methods.removeTeamMember = function(memberId) {
    this.teamMembers = this.teamMembers.filter(id => !id.equals(memberId));
    return this.save();
};

module.exports = mongoose.model('Project', projectSchema);