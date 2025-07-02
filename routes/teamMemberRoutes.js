const express = require('express');
const { body } = require('express-validator');
const { 
    getAllTeamMembers, 
    getTeamMemberById, 
    createTeamMember, 
    createTeamMembers 
} = require('../controllers/teamMemberController');

const router = express.Router();

// Validation middleware for team member creation
const validateTeamMember = [
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ max: 50 })
        .withMessage('First name cannot exceed 50 characters')
        .trim()
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters')
        .trim()
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
];

// Routes
router.get('/', getAllTeamMembers);
router.post('/', validateTeamMember, createTeamMember);
router.post('/batch', createTeamMembers);
router.get('/:id', getTeamMemberById);

module.exports = router;