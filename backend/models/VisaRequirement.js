const mongoose = require('mongoose');

const visaRequirementSchema = new mongoose.Schema(
  {
    country: {
      name: String,
      iso3: String,
      slug: String
    },
    history: [mongoose.Schema.Types.Mixed],
    meta: mongoose.Schema.Types.Mixed,
    requirements: mongoose.Schema.Types.Mixed,
    source: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

module.exports = mongoose.model('VisaRequirement', visaRequirementSchema);
