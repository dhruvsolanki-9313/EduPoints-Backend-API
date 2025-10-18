// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// === NEW: Explicitly require models early to prevent crash ===
// This ensures Mongoose knows about the schemas before the routes are hit.
const Student = require('./models/Student'); 
const Teacher = require('./models/Teacher'); 
// ==========================================================

// === MIDDLEWARE ===

// 1. Enable CORS for frontend communication
app.use(cors());    

// 2. Middleware to parse JSON request bodies
app.use(express.json());

// 3. Serve Static Files Configuration (Fixes Cannot GET /index.html)
const frontendPath = path.join(__dirname, '..', 'Digital Coin');
app.use(express.static(frontendPath));

// === MONGODB CONNECTION ===
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// === ROUTES ===

// 1. Explicitly serve index.html when the root URL is accessed.
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// 2. Primary route for student data and actions (e.g., /api/students/dashboard/:id)
app.use('/api/students', studentRoutes);

// 3. Secondary route for Teacher placeholder actions (e.g., /api/teachers/login)
app.use('/api', studentRoutes); 


// === START SERVER ===
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});