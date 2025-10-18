// models/Teacher.js
const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    subject: { type: String, required: true }, 
    schoolId: { type: String, required: true },
});

module.exports = mongoose.model('Teacher', TeacherSchema);