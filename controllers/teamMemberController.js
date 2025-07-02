const TeamMember = require('../models/TeamMember');
const { validationResult } = require('express-validator');

const getAllTeamMembers = async (req, res) => {
    try {
        const teamMembers = await TeamMember.find();

        res.status(200).json({
            success: true,
            data: teamMembers
        });

        console.log("team", teamMembers);
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team members',
            error: error.message
        });
    }
};

const getTeamMemberById = async (req, res) => {
    try {
        const { id } = req.params;
        const teamMember = await TeamMember.findById(id);

        if (!teamMember) {
            return res.status(404).json({
                success: false,
                message: 'Team member not found'
            });
        }

        res.status(200).json({
            success: true,
            data: teamMember
        });
    } catch (error) {
        console.error('Error fetching team member:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team member',
            error: error.message
        });
    }
};

const createTeamMember = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { firstName, lastName } = req.body;
        console.log(req.body);

        const existingMember = await TeamMember.findOne({
            firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
            lastName: { $regex: new RegExp(`^${lastName}$`, 'i') }
        });

        if (existingMember) {
            return res.status(409).json({
                success: false,
                message: 'Team member with this name already exists'
            });
        }

        const teamMember = new TeamMember({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
        });

        await teamMember.save();

        res.status(201).json({
            success: true,
            message: 'Team member created successfully',
            data: teamMember
        });
    } catch (error) {
        console.error('Error creating team member:', error);
        
        if (error.code === 'DUPLICATE_MEMBER') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating team member',
            error: error.message
        });
    }
};

const createTeamMembers = async (req, res) => {
    try {
        const { members } = req.body;
        console.log(members);
        
        if (!Array.isArray(members) || members.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Members array is required and cannot be empty'
            });
        }

        const validationErrors = [];
        const validMembers = [];

        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            
            if (!member.firstName || !member.firstName.trim()) {
                validationErrors.push(`Member ${i + 1}: First name is required`);
                continue;
            }
            
            if (!member.lastName || !member.lastName.trim()) {
                validationErrors.push(`Member ${i + 1}: Last name is required`);
                continue;
            }

            const duplicate = validMembers.find(vm => 
                vm.firstName.toLowerCase() === member.firstName.trim().toLowerCase() &&
                vm.lastName.toLowerCase() === member.lastName.trim().toLowerCase()
            );

            if (duplicate) {
                validationErrors.push(`Member ${i + 1}: Duplicate name in request`);
                continue;
            }

            const existingMember = await TeamMember.findOne({
                firstName: { $regex: new RegExp(`^${member.firstName.trim()}$`, 'i') },
                lastName: { $regex: new RegExp(`^${member.lastName.trim()}$`, 'i') }
            });

            if (existingMember) {
                validationErrors.push(`Member ${i + 1}: ${member.firstName} ${member.lastName} already exists`);
                continue;
            }

            validMembers.push({
                firstName: member.firstName.trim(),
                lastName: member.lastName.trim()
            });
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        if (validMembers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid members to create'
            });
        }

        const createdMembers = await TeamMember.insertMany(validMembers);

        res.status(201).json({
            success: true,
            message: `${createdMembers.length} team member(s) created successfully`,
            data: createdMembers
        });

    } catch (error) {
        console.error('Error creating team members:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating team members',
            error: error.message
        });
    }
};

module.exports = {
    getAllTeamMembers,
    getTeamMemberById,
    createTeamMember,
    createTeamMembers
};