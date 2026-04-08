const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const {
    getAllQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    deleteAllQuestions
} = require('../controllers/questionController');
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');

const router = express.Router();

// Routes d'authentification
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, getMe);

// Routes pour les questions
router.get('/questions', requireAuth, getAllQuestions);
router.post('/questions', requireAuth, requireAdmin, createQuestion);
router.patch('/questions/:id', requireAuth, requireAdmin, updateQuestion);
router.delete('/questions/:id', requireAuth, requireAdmin, deleteQuestion);
router.delete('/questions', requireAuth, requireAdmin, deleteAllQuestions);

// ❌ SUPPRIMEZ TOUTES LES ROUTES DE TESTS D'ICI
// Elles sont maintenant dans testRoutes.js

module.exports = router;
