const express = require('express');
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

router.use(requireAuth);

router.get('/', getAllQuestions);
router.post('/', requireAdmin, createQuestion);
router.patch('/:id', requireAdmin, updateQuestion);
router.delete('/:id', requireAdmin, deleteQuestion);
router.delete('/', requireAdmin, deleteAllQuestions);

module.exports = router;
