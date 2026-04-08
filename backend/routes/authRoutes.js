const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middlewares/requireAuth'); // 👈 Utiliser middlewares avec 's'

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées (nécessitent une authentification)
router.get('/me', requireAuth, authController.getMe);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/change-password', requireAuth, authController.changePassword);

module.exports = router;
