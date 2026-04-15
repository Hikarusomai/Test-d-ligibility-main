require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const User = require('./models/User');

// Import des routes
const userRoutes = require('./routes/userRoutes');
const questionRoutes = require('./routes/questionRoutes');
const publicQuestionRoutes = require('./routes/publicQuestionRoutes');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes'); // 👈 Vérifiez cette ligne

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
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes); // 👈 Vérifiez cette ligne

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'API is running',
        timestamp: new Date().toISOString(),
        endpoints: {
            users: '/api/users',
            debugUsers: '/debug/users (no auth)',
            test: '/debug/test (no auth)',
            publicQuestions: '/api/questions',
            adminQuestions: '/api/admin/questions',
            auth: '/api/auth',
            tests: '/api/tests'
        }
    });
});

// Debug test endpoint
app.get('/debug/test', (req, res) => {
    res.json({ success: true, message: 'Debug endpoint works!', timestamp: new Date().toISOString() });
});

// Debug endpoint - returns all users without auth
// Accessible at http://localhost:3000/debug/users
app.get('/debug/users', async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json({
            success: true,
            totalInDb: users.length,
            users: users.map(u => ({ 
                id: u._id,
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                phone: u.phone,
                nationality: u.nationality,
                createdAt: u.createdAt
            }))
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT} (CORS FIX VERSION 2)`);
    console.log(`📋 Public questions API: http://localhost:${PORT}/api/questions`);
    console.log(`🔐 Admin questions API: http://localhost:${PORT}/api/admin/questions`);
    console.log(`🔑 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`📝 Tests API: http://localhost:${PORT}/api/tests`); // 👈 Vérifiez
});
