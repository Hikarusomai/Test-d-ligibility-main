const Question = require('../models/Question');

exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort({ order: 1 });
    res.json(questions);
  } catch {
    res.status(500).json({ message: 'Error fetching questions' });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json(question);
  } catch {
    res.status(400).json({ message: 'Error creating question' });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json(q);
  } catch {
    res.status(400).json({ message: 'Error updating question' });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const q = await Question.findByIdAndDelete(req.params.id);
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch {
    res.status(400).json({ message: 'Error deleting question' });
  }
};

exports.deleteAllQuestions = async (req, res) => {
  try {
    await Question.deleteMany({});
    res.json({ message: 'All questions deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting all questions' });
  }
};
