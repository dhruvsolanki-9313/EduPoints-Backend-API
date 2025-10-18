// models/Student.js
const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    category: { type: String, enum: ['Attendance', 'Achievement', 'Behavior', 'Participation', 'Assignment'], required: true },
    teacher: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const StudentSchema = new mongoose.Schema({
    // Core Profile Data
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    classGrade: { type: String, required: true },
    schoolId: { type: String, required: true },

    // Dynamic Data 
    totalPoints: { type: Number, default: 0 },
    currentLevel: { type: String, default: 'Bronze' },
    lastActivityDate: { type: Date, default: Date.now },
    
    // Detailed History
    pointsHistory: [PointSchema],
    
    // Rewards/Milestone Data
    isEighteen: { type: Boolean, default: false },
    birthDate: { type: Date }, 
    badgesEarned: [{ type: String }] 
});

module.exports = mongoose.model('Student', StudentSchema);