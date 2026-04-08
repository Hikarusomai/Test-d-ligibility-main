const mongoose = require('mongoose');

const testSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true
    },
    originCountry: { type: String, required: true },
    destinationCountry: { type: String, required: true },
    answers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    analysis: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ['ELIGIBLE', 'MITIGE', 'FAIBLE', 'A_RISQUE', 'INCOMPLETE'],
      default: 'INCOMPLETE'
    },
    completedAt: { type: Date, required: true }
  },
  { timestamps: true }
);

testSubmissionSchema.index({ userId: 1, completedAt: -1 });
testSubmissionSchema.index({ score: -1 });

module.exports = mongoose.model('TestSubmission', testSubmissionSchema);
