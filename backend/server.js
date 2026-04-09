require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');

// Import des routes
const userRoutes = require('./routes/userRoutes');
const questionRoutes = require('./routes/questionRoutes');
const publicQuestionRoutes = require('./routes/publicQuestionRoutes');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const adminStudentRoutes = require('./routes/adminStudentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

function logger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const durationMs = Date.now() - start;
    });
    next();
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: true,
    credentials: true
}));

// Connect to MongoDB
connectDB();

app.use(logger);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/questions', publicQuestionRoutes);
app.use('/api/admin/questions', questionRoutes);
app.use('/api/admin/students', adminStudentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'API is running',
        endpoints: {
            users: '/api/users',
            publicQuestions: '/api/questions',
            adminQuestions: '/api/admin/questions',
            adminStudents: '/api/admin/students',
            auth: '/api/auth',
            tests: '/api/tests'
        }
    });
});

// Global error handling to prevent crashes
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT} (CORS FIX VERSION 2)`);
    console.log(`📋 Public questions API: http://localhost:${PORT}/api/questions`);
    console.log(`🔐 Admin questions API: http://localhost:${PORT}/api/admin/questions`);
    console.log(`👥 Admin students API: http://localhost:${PORT}/api/admin/students`);
    console.log(`🔑 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`📝 Tests API: http://localhost:${PORT}/api/tests`);
});
