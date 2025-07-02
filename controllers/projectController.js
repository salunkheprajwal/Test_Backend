const Project = require('../models/Project');
const TeamMember = require('../models/TeamMember');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

const uploadToCloudinary = async (filePath, folder = 'company-logos') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'image',
            transformation: [
                { width: 500, height: 500, crop: 'limit' },
                { quality: 'auto' },
                { format: 'auto' }
            ]
        });
        
        await fs.unlink(filePath).catch(console.error);
        
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        await fs.unlink(filePath).catch(console.error);
        throw error;
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
    }
};

const getAllProjects = async (req, res) => {
    try {
        const { status, department, search = '' } = req.query;

        const query = {};
        
        if (status) query.status = status;
        if (department) query.department = department;
        if (search) {
            query.$or = [
                { clientCode: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { projectName: { $regex: search, $options: 'i' } }
            ];
        }

        const projects = await Project.find(query)
            .populate('teamMembers', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching projects',
            error: error.message
        });
    }
};

const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id)
            .populate('teamMembers', 'firstName lastName email department role');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching project',
            error: error.message
        });
    }
};

const createProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(console.error);
            }
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const projectData = { ...req.body };

        if (projectData.teamMembers && typeof projectData.teamMembers === 'string') {
            try {
                projectData.teamMembers = JSON.parse(projectData.teamMembers);
            } catch (error) {
                if (req.file) {
                    await fs.unlink(req.file.path).catch(console.error);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Invalid teamMembers format. Must be a valid JSON array.'
                });
            }
        }

        const existingProject = await Project.findOne({ 
            clientCode: projectData.clientCode 
        });

        if (existingProject) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(console.error);
            }
            return res.status(409).json({
                success: false,
                message: 'Project with this client code already exists'
            });
        }

        if (projectData.teamMembers && projectData.teamMembers.length > 0) {
            const validTeamMembers = await TeamMember.find({
                _id: { $in: projectData.teamMembers },
            });

            if (validTeamMembers.length !== projectData.teamMembers.length) {
                if (req.file) {
                    await fs.unlink(req.file.path).catch(console.error);
                }
                return res.status(400).json({
                    success: false,
                    message: 'One or more team members are invalid or inactive'
                });
            }
        }

        if (req.file) {
            try {
                const cloudinaryResult = await uploadToCloudinary(req.file.path);
                projectData.companyLogo = cloudinaryResult.url;
                projectData.companyLogoPublicId = cloudinaryResult.publicId; 
            } catch (uploadError) {
                console.error('Error uploading to Cloudinary:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading company logo',
                    error: uploadError.message
                });
            }
        }

        const project = new Project(projectData);
        await project.save();

        await project.populate('teamMembers', 'firstName lastName email department');

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating project',
            error: error.message
        });
    }
};

module.exports = {
    getAllProjects,
    getProjectById,
    createProject
};