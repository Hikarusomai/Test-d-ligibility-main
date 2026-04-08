const mongoose = require('./backend/node_modules/mongoose');
const { evaluateEligibility } = require('./backend/utils/eligibilityEngine');
const Question = require('./backend/models/Question');
const CountryRequirement = require('./backend/models/CountryRequirement');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

async function testScoring() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visa_requirements');
        console.log('Connected to MongoDB');

        const questions = await Question.find({ isActive: true }).sort({ order: 1 });

        // Helper to find question ID by key
        const getQId = (key) => questions.find(q => q.key === key)?._id.toString();

        const testProfiles = [
            {
                name: 'Profile: France, Budget 3500€ -> Should be capped at 40',
                answers: {
                    destination_country: 'France',
                    Q18_first_year_amount_eur: 3500,
                    Q3_is_minor: 'Non',
                    Q4_visa_history: 'Jamais',
                    Q5_migration_issues: 'Non',
                    Q6_criminal_record: 'Non',
                    Q8_admission_status: 'Admission définitive',
                    Q9_language_level_status: 'Oui - au niveau exigé ou +',
                    Q10_transcripts_available: true,
                    Q11_tuition_payment_proof: true,
                    Q12_gaps_justified: 'N/A - pas de gap',
                    Q13_project_coherence: 'Oui',
                    Q14_official_process_started: true,
                    Q15_main_intent_study: true,
                    Q16_monthly_means_ratio: 'Oui',
                    Q17_funding_sources: ['Épargne personnelle'],
                    Q19_scholarship_proof: 'N/A - pas de bourse',
                    Q20_sponsor_commitment: true
                }
            }
        ];

        for (const profile of testProfiles) {
            console.log(`\n--- Testing ${profile.name} ---`);
            const rawAnswers = Object.entries(profile.answers).map(([key, value]) => ({
                questionId: getQId(key),
                value
            })).filter(a => a.questionId);

            const result = await evaluateEligibility(rawAnswers);
            console.log(`Score: ${result.normalizedScore}`);
            console.log(`Status: ${result.status}`);
            console.log(`Hard Fails: ${result.details.hardFails.join(', ') || 'None'}`);
            console.log(`Reasons: ${result.details.reasons.join(', ') || 'None'}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testScoring();
