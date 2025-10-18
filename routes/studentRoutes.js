// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Teacher = require('../models/Teacher'); 

// --- LEVEL LOGIC HELPER ---
function updateStudentLevel(student) {
    if (student.totalPoints >= 3200) {
        student.currentLevel = 'Platinum';
    } else if (student.totalPoints >= 2500) {
        student.currentLevel = 'Gold';
    } else if (student.totalPoints >= 1500) {
        student.currentLevel = 'Silver';
    } else {
        student.currentLevel = 'Bronze';
    }
}

// --- STUDENT AUTH ENDPOINTS ---

// POST /api/students/register
router.post('/register', async (req, res) => {
    const { fullName, email, password, classGrade, schoolId, birthDate } = req.body;

    try {
        let student = await Student.findOne({ email });
        if (student) {
            return res.status(400).json({ message: 'Student with this email already exists.' });
        }

        student = new Student({ fullName, email, password, classGrade, schoolId, currentLevel: 'Bronze', birthDate }); 
        await student.save();
        
        res.status(201).json({ message: 'Student registered successfully!', student: { name: student.fullName, email: student.email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /api/students/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const student = await Student.findOne({ email });
        
        if (!student) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }
        
        if (student.password !== password) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }

        res.status(200).json({ message: 'Login successful', token: 'DEMO_STUDENT_TOKEN', studentId: student._id, fullName: student.fullName });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


// --- TEACHER ACTIONS ENDPOINTS (NEW AWARD POINTS IMPLEMENTATION) ---

// POST /api/students/award-points
router.post('/award-points', async (req, res) => {
    const { studentId, points, reason, category, teacherName } = req.body;

    if (!studentId || !points || !reason || !category || !teacherName) {
        return res.status(400).json({ message: 'Missing required fields for point award.' });
    }

    const pointsValue = parseInt(points, 10);
    if (isNaN(pointsValue) || pointsValue === 0) {
        return res.status(400).json({ message: 'Points must be a valid, non-zero number.' });
    }

    try {
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        student.totalPoints += pointsValue;
        
        const newPointEntry = { points: pointsValue, reason, category, teacher: teacherName };
        student.pointsHistory.push(newPointEntry);
        
        updateStudentLevel(student); 
        student.lastActivityDate = Date.now();

        await student.save();
        
        res.status(200).json({ message: `Points awarded successfully!`, student });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during point award.' });
    }
});


// --- STUDENT DATA ENDPOINTS ---

// GET /api/students
router.get('/', async (req, res) => {
    try {
        const students = await Student.find({})
            .select('fullName classGrade totalPoints currentLevel lastActivityDate pointsHistory _id')
            .sort({ totalPoints: -1 }); 

        res.status(200).json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching student list.' });
    }
});

// GET /api/students/dashboard/:id (FIXED: Projecting fields correctly)
router.get('/dashboard/:id', async (req, res) => {
    try {
        // FIX: Explicitly list fields for inclusion projection, excluding 'password'
        const student = await Student.findById(req.params.id).select(
            'fullName email classGrade schoolId totalPoints currentLevel lastActivityDate pointsHistory badgesEarned birthDate _id'
        ); 
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        res.status(200).json(student);
    } catch (err) {
        console.error('DASHBOARD FETCH CRASH:', err); 
        res.status(500).json({ message: 'Server error fetching dashboard data.' });
    }
});

// --- TEACHER ACTIONS ENDPOINTS (DELETE/RESET) ---

// PUT /api/students/reset-history/:id
router.put('/reset-history/:id', async (req, res) => {
    try {
        const studentId = req.params.id;

        const updatedStudent = await Student.findByIdAndUpdate(
            studentId,
            {
                $set: {
                    totalPoints: 0,
                    pointsHistory: [], 
                    currentLevel: 'Bronze',
                }
            },
            { new: true }
        ).select('-password');

        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        res.status(200).json({ 
            message: `${updatedStudent.fullName}'s coin history and points have been reset successfully!`, 
            student: updatedStudent 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during history reset.' });
    }
});


// DELETE /api/students/:id
router.delete('/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const result = await Student.findByIdAndDelete(studentId);

        if (!result) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        res.status(200).json({ message: 'Student data deleted successfully!', deletedStudent: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during student deletion.' });
    }
});


// --- TEACHER AUTH ENDPOINTS (IMPLEMENTED FOR MONGODB) ---

// POST /api/teachers/register
router.post('/teachers/register', async (req, res) => {
    const { fullName, email, password, subject, schoolId } = req.body;

    try {
        let teacher = await Teacher.findOne({ email });
        if (teacher) {
            return res.status(400).json({ message: 'Teacher with this email already exists.' });
        }

        teacher = new Teacher({ fullName, email, password, subject, schoolId }); 
        await teacher.save();
        
        console.log('Teacher Registered:', teacher.email);
        res.status(201).json({ message: 'Teacher registered successfully!', teacherName: teacher.fullName });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /api/teachers/login
router.post('/teachers/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const teacher = await Teacher.findOne({ email });

        if (!teacher || teacher.password !== password) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }
        
        res.status(200).json({ 
            message: 'Teacher login successful.',
            token: 'DEMO_TEACHER_TOKEN',
            teacherId: teacher._id,
            fullName: teacher.fullName
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;