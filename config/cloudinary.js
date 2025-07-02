const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const verifyConnection = async () => {
    try {
        await cloudinary.api.ping();
        console.log('cloudinary connected');
    } catch (error) {
        console.error('cloudinary failed:', error.message);
    }
};

verifyConnection();

module.exports = cloudinary;