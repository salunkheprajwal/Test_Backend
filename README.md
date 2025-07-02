# Node.js Backend Server

This is a Node.js backend project that runs with `nodemon` and connects to MongoDB. It also integrates with Cloudinary for media management.

## Technologies Used

- Node.js
- Express
- MongoDB (via Mongoose)
- Cloudinary
- Dotenv
- Nodemon



### Environment Variables

Create a `.env` file in the root of your project and add the following:

```env
PORT=5000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

MONGODB_URI=your_mongodb_connection_string


