const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');

const {
    getAllStudents,
    getStudentById,
    exportStudentsToExcel,
    getStatistics
} = require('../controllers/adminStudentController');

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// Get statistics (must be before /:id to avoid conflict)
router.get('/stats', getStatistics);

// Export to Excel (must be before /:id to avoid conflict)
router.get('/export/excel', exportStudentsToExcel);

// Get all students with filtering and pagination
router.get('/', getAllStudents);

// Get student by ID
router.get('/:id', getStudentById);

module.exports = router;
