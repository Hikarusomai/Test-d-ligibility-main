const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { _id: false }
);

const eligibilityTestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destinationCountry: { type: String },
    answers: [answerSchema],
    score: { type: Number, required: true },
    status: {
      type: String,
      enum: ['ELIGIBLE', 'MITIGE', 'FAIBLE', 'A_RISQUE', 'INCOMPLETE'],
      required: true
    },
    summary: { type: String },
    details: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EligibilityTest', eligibilityTestSchema);
