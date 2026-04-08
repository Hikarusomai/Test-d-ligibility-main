const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const requireAuth = require('../middlewares/requireAuth');

// Route briefing (doit correspondre à /api/tests/briefing/:submissionId)
router.get('/briefing/:submissionId', requireAuth, testController.generateBriefing);

// Routes générales
router.post('/submit', requireAuth, testController.submitTest);
router.get('/my-tests', requireAuth, testController.getMyTests);

// Routes avec paramètres génériques en dernier
router.get('/:id', requireAuth, testController.getTestById);
router.delete('/:id', requireAuth, testController.deleteTest);

module.exports = router;
