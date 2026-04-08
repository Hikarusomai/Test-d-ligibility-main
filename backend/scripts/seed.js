const mongoose = require('mongoose');
require('dotenv').config();
const Question = require('../models/Question');
const CountryRequirement = require('../models/CountryRequirement');

const mongoURI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/visa_requirements';

const questions = [
    {
        label: "Votre nationalité",
        key: "Q1_nationality",
        category: "personal",
        type: "single_choice",
        options: ["Maroc", "Tunisie", "Algérie", "Égypte", "Libye", "Arabie saoudite", "Émirats arabes unis", "Koweït", "Irak", "Qatar", "Oman", "Syrie", "Iran", "Turquie", "Cameroun", "Côte d'Ivoire", "Afrique du Sud", "Nigéria", "Mali", "Niger", "Gabon", "Mauritanie", "Madagascar", "Bénin", "Kenya", "Guinée équatoriale", "Cap-Vert", "Éthiopie", "Comores", "Tanzanie", "Namibie", "Congo (République)", "RD Congo", "Ouganda", "Rwanda", "Sénégal", "Pakistan", "Inde", "Chine", "Corée du Sud", "Viêt Nam", "Malaisie", "Singapour", "Indonésie", "Hong Kong", "Japon", "France"],
        order: 1,
        weight: 0,
        isRequired: true
    },
    {
        label: "Dans quel pays souhaitez-vous poursuivre vos études ?",
        key: "Q2_destination_country",
        category: "project",
        type: "single_choice",
        options: ["États-Unis", "Canada", "Australie", "Royaume-Uni", "France", "Allemagne", "Espagne", "Italie", "Finlande", "Irlande", "Danemark", "Norvège", "Suède", "Pologne", "Malte", "Belgique", "Chine", "Turquie", "Corée du Sud"],
        order: 2,
        weight: 0,
        isRequired: true
    },
    {
        label: "Êtes-vous mineur(e) ?",
        key: "Q3_is_minor",
        category: "personal",
        type: "single_choice",
        options: ["Oui", "Non"],
        order: 3,
        weight: 0,
        isRequired: true
    },
    {
        label: "Disposez-vous d'une autorisation parentale et d'un hébergement/garant légal ?",
        key: "Q3bis_parental_consent",
        category: "personal",
        type: "single_choice",
        options: ["Oui", "Non"],
        order: 4,
        weight: 0,
        isRequired: false,
        conditionalDisplay: {
            dependsOn: "Q3_is_minor",
            showWhen: "Oui"
        }
    },
    {
        label: "Votre tranche d'âge",
        key: "Q3ter_age_range",
        category: "personal",
        type: "single_choice",
        options: ["18-25", "26-30", "31-35", "36+"],
        order: 5,
        weight: 0,
        isRequired: false,
        conditionalDisplay: {
            dependsOn: "Q3_is_minor",
            showWhen: "Non"
        }
    },
    {
        label: "Avez-vous déjà obtenu/refusé un visa ?",
        key: "Q4_visa_history",
        category: "personal",
        type: "single_choice",
        options: ["Jamais", "Déjà obtenu", "Déjà refusé - motif corrigé", "Déjà refusé - non corrigé"],
        order: 6,
        weight: 10,
        isRequired: true,
        scoringRules: {
            "Jamais": 8,
            "Déjà obtenu": 10,
            "Déjà refusé - motif corrigé": 6,
            "Déjà refusé - non corrigé": 0
        }
    },
    {
        label: "Avez-vous des antécédents de dépassement de séjour ou d'infractions migratoires ?",
        key: "Q5_migration_issues",
        category: "personal",
        type: "single_choice",
        options: ["Non", "Oui - léger (≤30j, régularisé)", "Oui - grave (expulsion, interdiction, fraude)"],
        order: 7,
        weight: 10,
        isRequired: true,
        scoringRules: {
            "Non": 10,
            "Oui - léger (≤30j, régularisé)": 5,
            "Oui - grave (expulsion, interdiction, fraude)": 0
        }
    },
    {
        label: "Votre casier judiciaire comporte-t-il des mentions (condamnations pénales) ?",
        key: "Q6_criminal_record",
        category: "personal",
        type: "single_choice",
        options: ["Non", "Oui - mineur/ancien/non lié à moralité", "Oui - grave (violence, fraude, immigration)"],
        order: 8,
        weight: 5,
        isRequired: true,
        scoringRules: {
            "Non": 5,
            "Oui - mineur/ancien/non lié à moralité": 2,
            "Oui - grave (violence, fraude, immigration)": 0
        }
    },
    {
        label: "Type de programme",
        key: "Q7_program_type",
        category: "education",
        type: "single_choice",
        options: ["Prépa", "BTS", "Licence", "BBA", "PGE", "Master", "MSc", "MS", "Doctorat", "Autre"],
        order: 9,
        weight: 0,
        isRequired: true
    },
    {
        label: "Êtes-vous admis(e) (ou pré-admis(e) avec conditions claires) dans un établissement reconnu ?",
        key: "Q8_admission_status",
        category: "education",
        type: "single_choice",
        options: ["Admission définitive", "Pré-admission avec conditions réalistes", "Non"],
        order: 10,
        weight: 12,
        isRequired: true,
        scoringRules: {
            "Admission définitive": 12,
            "Pré-admission avec conditions réalistes": 8,
            "Non": 0
        }
    },
    {
        label: "Niveau linguistique adapté au programme (attestation valide)",
        key: "Q9_language_level_status",
        category: "language",
        type: "single_choice",
        options: ["Oui - au niveau exigé ou +", "Légèrement inférieur / expiré", "Non"],
        order: 11,
        weight: 8,
        isRequired: true,
        scoringRules: {
            "Oui - au niveau exigé ou +": 8,
            "Légèrement inférieur / expiré": 4,
            "Non": 0
        }
    },
    {
        label: "Nom du test + score/niveau (ex: DELF B2 - 72/100, IELTS 6.5, TOEFL iBT 90)",
        key: "Q9bis_language_test_details",
        category: "language",
        type: "text",
        order: 12,
        weight: 0,
        isRequired: false,
        conditionalDisplay: {
            dependsOn: "Q9_language_level_status",
            showWhen: "Oui - au niveau exigé ou +"
        }
    },
    {
        label: "Relevés/diplômes antérieurs (traduits si requis) disponibles ?",
        key: "Q10_transcripts_available",
        category: "education",
        type: "boolean",
        order: 13,
        weight: 3,
        isRequired: true,
        scoringRules: { "true": 3, "false": 0 }
    },
    {
        label: "Avez-vous une preuve de paiement (acompte ou totalité) ou un échéancier accepté par l'école ?",
        key: "Q11_tuition_payment_proof",
        category: "finance",
        type: "boolean",
        order: 14,
        weight: 3,
        isRequired: true,
        scoringRules: { "true": 3, "false": 0 }
    },
    {
        label: "Gaps académiques (> 1 an) expliqués par des justificatifs ?",
        key: "Q12_gaps_justified",
        category: "education",
        type: "single_choice",
        options: ["Oui", "Non", "N/A - pas de gap"],
        order: 15,
        weight: 3,
        isRequired: true,
        scoringRules: { "Oui": 3, "Non": 0, "N/A - pas de gap": 3 }
    },
    {
        label: "Votre projet d'études est-il cohérent (diplômes antérieurs, continuité, objectifs) ?",
        key: "Q13_project_coherence",
        category: "project",
        type: "single_choice",
        options: ["Oui", "Partiel", "Non"],
        order: 16,
        weight: 4,
        isRequired: true,
        scoringRules: { "Oui": 4, "Partiel": 2, "Non": 0 }
    },
    {
        label: "Avez-vous déjà entamé ou terminé la procédure officielle exigée par le pays ? (Campus France, UCAS, etc.)",
        key: "Q14_official_process_started",
        category: "project",
        type: "boolean",
        order: 17,
        weight: 5,
        isRequired: true,
        scoringRules: { "true": 5, "false": 0 }
    },
    {
        label: "Avez-vous l'intention principale d'étudier (et non de travailler à plein temps ou d'immigrer) ?",
        key: "Q15_main_intent_study",
        category: "project",
        type: "boolean",
        order: 18,
        weight: 5,
        isRequired: true,
        scoringRules: { "true": 5, "false": 0 }
    },
    {
        label: "Pouvez-vous prouver des moyens de subsistance mensuels au moins égaux au minimum requis par votre consulat pour toute la durée de vos études ?",
        key: "Q16_monthly_means_ratio",
        category: "finance",
        type: "single_choice",
        options: ["Oui", "Non"],
        order: 19,
        weight: 15,
        isRequired: true,
        scoringRules: { "Oui": 15, "Non": 0 }
    },
    {
        label: "Source(s) des fonds (sélection multiple)",
        key: "Q17_funding_sources",
        category: "finance",
        type: "multi_choice",
        options: ["Épargne personnelle", "Parent/tuteur avec justificatifs", "Bourse officielle", "Prêt étudiant approuvé", "Parrain légal documenté", "Autre avec preuves"],
        order: 20,
        weight: 5,
        isRequired: true,
        scoringRules: "cap_5"
    },
    {
        label: "Montant total disponible pour la première année (frais de scolarité + vie) : (saisir €)",
        key: "Q18_first_year_amount_eur",
        category: "finance",
        type: "number",
        order: 21,
        weight: 10,
        isRequired: true,
        scoringRules: "formula"
    },
    {
        label: "Bourse: attestation officielle indiquant montant mensuel et durée ?",
        key: "Q19_scholarship_proof",
        category: "finance",
        type: "single_choice",
        options: ["Oui", "Non", "N/A - pas de bourse"],
        order: 22,
        weight: 2,
        isRequired: true,
        scoringRules: { "Oui": 2, "Non": 0, "N/A - pas de bourse": 0 }
    },
    {
        label: "Engagement écrit du garant avec pièces d'identité et justificatifs de revenus ?",
        key: "Q20_sponsor_commitment",
        category: "finance",
        type: "boolean",
        order: 23,
        weight: 3,
        isRequired: true,
        scoringRules: { "true": 3, "false": 0 }
    }
];

const franceRequirement = {
    country: {
        name: "France",
        iso3: "FRA",
        slug: "france"
    },
    requirements: {
        financial: {
            min_monthly_eur: 615,
            min_annual_eur: 7380,
            currency: "EUR",
            proof_accepted: [
                "attestation de bourse",
                "attestation de garant",
                "relevé bancaire personnel",
                "preuve de virement"
            ]
        },
        language: {
            tests_accepted: [
                { name: "DELF B2", level: "B2" },
                { name: "TCF B2", level: "B2" },
                { name: "IELTS", level: "6.5" }
            ]
        },
        admission: {
            required: true,
            proof_types: ["lettre d’admission", "pré-admission conditionnelle"]
        },
        difficulty_coefficient: 1.2
    }
};

const usaRequirement = {
    country: {
        name: "États-Unis",
        iso3: "USA",
        slug: "usa"
    },
    requirements: {
        financial: {
            min_monthly_eur: 2000,
            min_annual_eur: 24000,
            currency: "USD",
            proof_accepted: [
                "bank statements",
                "scholarship letter",
                "sponsor affidavit (I-134)",
                "loan approval"
            ]
        },
        language: {
            tests_accepted: [
                { name: "TOEFL iBT", level: "80" },
                { name: "IELTS", level: "6.5" },
                { name: "Duolingo", level: "110" }
            ]
        },
        admission: {
            required: true,
            proof_types: ["I-20 form", "Admission letter"]
        },
        difficulty_coefficient: 1.5
    }
};

const canadaRequirement = {
    country: {
        name: "Canada",
        iso3: "CAN",
        slug: "canada"
    },
    requirements: {
        financial: {
            min_monthly_eur: 1500,
            min_annual_eur: 20635, // New 2024/2025 requirement
            currency: "CAD",
            proof_accepted: [
                "GIC (Guaranteed Investment Certificate)",
                "bank statements",
                "scholarship proof"
            ]
        },
        language: {
            tests_accepted: [
                { name: "IELTS Academic", level: "6.0" },
                { name: "TEF Canada", level: "B2" }
            ]
        },
        admission: {
            required: true,
            proof_types: ["Letter of Acceptance (LOA)", "CAQ (Quebec)"]
        },
        difficulty_coefficient: 1.3
    }
};

const ukRequirement = {
    country: {
        name: "Royaume-Uni",
        iso3: "GBR",
        slug: "united-kingdom"
    },
    requirements: {
        financial: {
            min_monthly_eur: 1565, // £1,334 (London)
            min_annual_eur: 18780,
            currency: "GBP",
            proof_accepted: ["bank statements", "student loan", "sponsorship"]
        },
        language: {
            tests_accepted: [{ name: "IELTS for UKVI", level: "6.0" }]
        },
        admission: {
            required: true,
            proof_types: ["CAS (Confirmation of Acceptance for Studies)"]
        },
        difficulty_coefficient: 1.4
    }
};

const australiaRequirement = {
    country: {
        name: "Australie",
        iso3: "AUS",
        slug: "australia"
    },
    requirements: {
        financial: {
            min_monthly_eur: 1800,
            min_annual_eur: 21041, // AUD 29,710
            currency: "AUD",
            proof_accepted: ["bank deposit", "loan", "government support"]
        },
        language: {
            tests_accepted: [{ name: "IELTS", level: "6.0" }, { name: "PTE Academic", level: "50" }]
        },
        admission: {
            required: true,
            proof_types: ["CoE (Confirmation of Enrolment)"]
        },
        difficulty_coefficient: 1.3
    }
};

async function seed() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB for seeding...');

        await Question.deleteMany({});
        await Question.insertMany(questions);
        console.log('Questions seeded successfully!');

        await CountryRequirement.deleteMany({});
        await CountryRequirement.insertMany([
            franceRequirement,
            usaRequirement,
            canadaRequirement,
            ukRequirement,
            australiaRequirement
        ]);
        console.log('Country requirements seeded successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
