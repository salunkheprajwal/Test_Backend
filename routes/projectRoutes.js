const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { 
    getAllProjects, 
    getProjectById, 
    createProject
} = require('../controllers/projectController');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/temp';
        require('fs').mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, 
    }
});

const validateProject = [
    body('clientCode')
        .notEmpty()
        .withMessage('Client code is required')
        .isLength({ max: 20 })
        .withMessage('Client code cannot exceed 20 characters')
        .trim(),
    
    body('companyName')
        .notEmpty()
        .withMessage('Company name is required')
        .isLength({ max: 100 })
        .withMessage('Company name cannot exceed 100 characters')
        .trim(),
    
    body('projectName')
        .notEmpty()
        .withMessage('Project name is required')
        .isLength({ max: 100 })
        .withMessage('Project name cannot exceed 100 characters')
        .trim(),
    
    body('typeOfProject')
        .isIn(['Based on client', 'Internal project', 'Research & Development', 'Maintenance'])
        .withMessage('Invalid project type'),
    
    body('pvProjectManager')
        .notEmpty()
        .withMessage('PV Project Manager is required')
        .isLength({ max: 100 })
        .withMessage('PV Project Manager name cannot exceed 100 characters')
        .trim(),
    
    body('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    
    body('endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('End date must be a valid date')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    
    body('allottedBillingHours')
        .notEmpty()
        .withMessage('Allotted billing hours is required')
        .isFloat({ min: 0.5, max: 10000 })
        .withMessage('Allotted billing hours must be between 0.5 and 10000'),
    
    body('department')
        .isIn(['IT', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'])
        .withMessage('Invalid department'),
    
    body('teamMembers')
        .optional()
        .custom((value) => {
            if (!value) return true;
            
            let teamMembers = value;
            
            if (typeof value === 'string') {
                try {
                    teamMembers = JSON.parse(value);
                } catch (error) {
                    throw new Error('Team members must be a valid JSON array');
                }
            }
            
            if (!Array.isArray(teamMembers)) {
                throw new Error('Team members must be an array');
            }
            
            if (teamMembers.length > 0) {
                const isValidObjectIds = teamMembers.every(id => 
                    typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)
                );
                if (!isValidObjectIds) {
                    throw new Error('All team member IDs must be valid ObjectIds');
                }
            }
            return true;
        })
];

const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size allowed is 5MB.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field. Only companyLogo is allowed.'
            });
        }
    }
    
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({
            success: false,
            message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed for company logo.'
        });
    }
    
    next(error);
};

router.get('/', getAllProjects);

router.get('/:id', getProjectById);

router.post('/', 
    upload.single('companyLogo'), 
    handleMulterError,
    validateProject, 
    createProject
);

module.exports = router;