const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const teamMemberRoutes = require('./routes/teamMemberRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management')
.then(() => console.log('Connected to MongoDB'))
.catch(() => process.exit(1));


app.use('/api/team-members', teamMemberRoutes);
app.use('/api/projects', projectRoutes);



app.use((err, req, res, next) => {
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});