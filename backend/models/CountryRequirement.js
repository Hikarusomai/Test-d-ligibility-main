const mongoose = require('mongoose');

const countryRequirementSchema = new mongoose.Schema(
    {
        country: {
            name: { type: String, required: true },
            nameEn: { type: String },
            iso3: { type: String },
            slug: { type: String }
        },
        requirements: { type: mongoose.Schema.Types.Mixed }, // objet libre
        history: { type: Array }, // ou [Object]
        meta: { type: mongoose.Schema.Types.Mixed },
        source: { type: mongoose.Schema.Types.Mixed }
    },
    { timestamps: true }
);

module.exports = mongoose.model('CountryRequirement', countryRequirementSchema, 'country_requirements');
