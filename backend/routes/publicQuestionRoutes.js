const express = require('express');
const {
  getAllQuestions
} = require('../controllers/questionController');

const router = express.Router();

// Routes publiques (sans authentification)
router.get('/', getAllQuestions);

module.exports = router;
