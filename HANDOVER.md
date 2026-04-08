# Master Technical Handover: Visa Eligibility Module

**Target Audience:** MMS Core Engineers. This document contains **100% of the logic, data, and scripts** required to integrate the standalone "Visa Eligibility" module into the MatchMySchool (MMS) platform. You do not need to read the standalone source code; every required line of code and data structure is embedded below.

---

## 1. Project Management & MMS Integration Steps

The standalone Visa project operates using separated `backend`, `frontend`, and `serveur` (scraper) microservices. To integrate this into MMS natively:

1. **Database Strategy:** 
   - MMS already has an `eligibilitytests` collection.
   - Do **NOT** create a new collection. Add a field `testType: "VISA"` to the MMS schema.
   - Insert the 23 questions provided in Section 4 using an MMS migration script.
2. **Backoffice UI:**
   - Clone the existing "Custom" test tab in your backoffice.
   - Add a new tab for "Visa F" (Visa rules).
   - Fetch questions where `testType === 'VISA'`.
3. **Scorer Service:**
   - Implement the mathematical algorithms defined in Section 2 during the test submission route.
4. **Scraper Cronjob:**
   - Instead of maintaining a separate Node.js container, port the AI scraping logic (Section 3) into an MMS worker queue or `node-cron` job.

---

## 2. The AI Scraper Architecture (`serveur/`)

The standalone project has a dedicated folder (`serveur/`) which runs on port 3001. Its sole purpose is to scrape Official Embassy and Immigration requirements worldwide so the Visa test has accurate financial targets.

### How the Scraper Works (No Puppeteer):
It uses **Gemini 2.0 Flash API**. You must add `GEMINI_API_KEY` to your MMS `.env`. 
The scraper iterates over a hardcoded target list (e.g., France, USA, Canada) containing URLs to official immigration sites.

**The Exact AI Prompt used in the code:**
To replicate the scraper in MMS, use the following `system` prompt with Gemini/Perplexity:
```text
Recherche sur le web les exigences officielles pour un visa étudiant pour {COUNTRY}.
Extrais et structure les informations suivantes depuis {URL}:

1. EXIGENCES FINANCIÈRES:
   - Montant minimum requis (mensuel et annuel en EUR)
   - Devise
   - Types de preuves acceptées
2. EXIGENCES LINGUISTIQUES:
   - Tests de langue acceptés (avec niveau)
   - Validité en mois
   - Exemptions possibles
3. ADMISSION (Obligatoire ou non, types de preuves)
4. DOCUMENTS OBLIGATOIRES ET OPTIONNELS
5. FRAIS (Visa, services en EUR)
6. TRAITEMENT (Délai moyen)

RÉPONDS UNIQUEMENT AVEC UN OBJET JSON VALIDE suivant cette structure exacte:
{
  "financial": { "min_monthly_eur": null, "min_annual_eur": null, "currency": "", "proof_accepted": [], "source_url": "" },
  "language": { "tests_accepted": [{"name": "", "level": ""}], "validity_months": null, "exemptions": [] },
  "admission": { "required": true, "proof_types": [], "official_portal": "" },
  "documents": { "mandatory": [], "optional": [] },
  "fees": { "visa_fee_eur": null, "service_fee_eur": null },
  "processing": { "average_delay_days": null, "appointment_required": null }
}
```
**Database Storage:**
The resulting JSON is saved to MongoDB in a collection named `country_requirements`. In MMS, you should maintain this collection so the Visa Test module can query it.

---

## 3. Mathematical Scoring Engine

When a student submits the Visa Test, the backend calculates their eligibility percentage. You must implement these rules in your MMS `EligibilityAssessment` controller:

**Base Logic:**
Each question has a `weight` (0 - 20). 

**Rule A: Fixed Options (`scoringRules` object)**
If the question has predefined rules like Q4 (Has the user been refused a visa?):
```javascript
// Data: { "Jamais": 8, "Déjà refusé": 0 }, Weight: 10
let pointsScored = (scoringRules[studentAnswer] / 10) * question.weight;
// Example if "Jamais": (8 / 10) * 10 = 8 points.
```

**Rule B: Numeric Normalization (Financial Check)**
If the question is numeric (Q18: How much money do you have?). 
*MMS Devs:* Compare the student's input with the `min_monthly_eur` fetched from your `country_requirements` database for their target country. If their money `<` (requirement * 12), their chance of getting a Visa drops aggressively (Score = 0 for this question).

**Rule C: Boolean Flags**
If `type: boolean`:
```javascript
if (answer === true) points = question.weight;
else points = 0;
```

**Final Status Engine:**
```javascript
let totalPercentage = (totalPointsScored / totalPossibleWeight) * 100;
if (totalPercentage >= 85) return 'ELIGIBLE';
if (totalPercentage >= 65) return 'MITIGE';
if (totalPercentage >= 40) return 'FAIBLE';
return 'A_RISQUE';
```

---

## 4. The Complete Visa Question Database

Below is the **100% complete and exact JSON payload** that you must seed into the MMS database. Copy and paste this directly into your MMS `eligibilitytests` migration seeder script.

```json
[
    {
        "label": "Votre nationalité",
        "key": "Q1_nationality",
        "category": "personal",
        "type": "single_choice",
        "options": ["Maroc", "Tunisie", "Algérie", "Égypte", "Libye", "Arabie saoudite", "Émirats arabes unis", "Koweït", "Irak", "Qatar", "Oman", "Syrie", "Iran", "Turquie", "Cameroun", "Côte d'Ivoire", "Afrique du Sud", "Nigéria", "Mali", "Niger", "Gabon", "Mauritanie", "Madagascar", "Bénin", "Kenya", "Guinée équatoriale", "Cap-Vert", "Éthiopie", "Comores", "Tanzanie", "Namibie", "Congo (République)", "RD Congo", "Ouganda", "Rwanda", "Sénégal", "Pakistan", "Inde", "Chine", "Corée du Sud", "Viêt Nam", "Malaisie", "Singapour", "Indonésie", "Hong Kong", "Japon", "France"],
        "order": 1,
        "weight": 0,
        "isRequired": true
    },
    {
        "label": "Dans quel pays souhaitez-vous poursuivre vos études ?",
        "key": "Q2_destination_country",
        "category": "project",
        "type": "single_choice",
        "options": ["États-Unis", "Canada", "Australie", "Royaume-Uni", "France", "Allemagne", "Espagne", "Italie", "Finlande", "Irlande", "Danemark", "Norvège", "Suède", "Pologne", "Malte", "Belgique", "Chine", "Turquie", "Corée du Sud"],
        "order": 2,
        "weight": 0,
        "isRequired": true
    },
    {
        "label": "Êtes-vous mineur(e) ?",
        "key": "Q3_is_minor",
        "category": "personal",
        "type": "single_choice",
        "options": ["Oui", "Non"],
        "order": 3,
        "weight": 0,
        "isRequired": true
    },
    {
        "label": "Disposez-vous d'une autorisation parentale et d'un hébergement/garant légal ?",
        "key": "Q3bis_parental_consent",
        "category": "personal",
        "type": "single_choice",
        "options": ["Oui", "Non"],
        "order": 4,
        "weight": 0,
        "isRequired": false,
        "conditionalDisplay": {
            "dependsOn": "Q3_is_minor",
            "showWhen": "Oui"
        }
    },
    {
        "label": "Votre tranche d'âge",
        "key": "Q3ter_age_range",
        "category": "personal",
        "type": "single_choice",
        "options": ["18-25", "26-30", "31-35", "36+"],
        "order: 5",
        "weight": 0,
        "isRequired": false,
        "conditionalDisplay": {
            "dependsOn": "Q3_is_minor",
            "showWhen": "Non"
        }
    },
    {
        "label": "Avez-vous déjà obtenu/refusé un visa ?",
        "key": "Q4_visa_history",
        "category": "personal",
        "type": "single_choice",
        "options": ["Jamais", "Déjà obtenu", "Déjà refusé - motif corrigé", "Déjà refusé - non corrigé"],
        "order": 6,
        "weight": 10,
        "isRequired": true,
        "scoringRules": {
            "Jamais": 8,
            "Déjà obtenu": 10,
            "Déjà refusé - motif corrigé": 6,
            "Déjà refusé - non corrigé": 0
        }
    },
    {
        "label": "Avez-vous des antécédents de dépassement de séjour ou d'infractions migratoires ?",
        "key": "Q5_migration_issues",
        "category": "personal",
        "type": "single_choice",
        "options": ["Non", "Oui - léger (≤30j, régularisé)", "Oui - grave (expulsion, interdiction, fraude)"],
        "order": 7,
        "weight": 10,
        "isRequired": true,
        "scoringRules": {
            "Non": 10,
            "Oui - léger (≤30j, régularisé)": 5,
            "Oui - grave (expulsion, interdiction, fraude)": 0
        }
    },
    {
        "label": "Votre casier judiciaire comporte-t-il des mentions (condamnations pénales) ?",
        "key": "Q6_criminal_record",
        "category": "personal",
        "type": "single_choice",
        "options": ["Non", "Oui - mineur/ancien/non lié à moralité", "Oui - grave (violence, fraude, immigration)"],
        "order": 8,
        "weight": 5,
        "isRequired": true,
        "scoringRules": {
            "Non": 5,
            "Oui - mineur/ancien/non lié à moralité": 2,
            "Oui - grave (violence, fraude, immigration)": 0
        }
    },
    {
        "label": "Type de programme",
        "key": "Q7_program_type",
        "category": "education",
        "type": "single_choice",
        "options": ["Prépa", "BTS", "Licence", "BBA", "PGE", "Master", "MSc", "MS", "Doctorat", "Autre"],
        "order": 9,
        "weight": 0,
        "isRequired": true
    },
    {
        "label": "Êtes-vous admis(e) (ou pré-admis(e) avec conditions claires) dans un établissement reconnu ?",
        "key": "Q8_admission_status",
        "category": "education",
        "type": "single_choice",
        "options": ["Admission définitive", "Pré-admission avec conditions réalistes", "Non"],
        "order": 10,
        "weight": 12,
        "isRequired": true,
        "scoringRules": {
            "Admission définitive": 12,
            "Pré-admission avec conditions réalistes": 8,
            "Non": 0
        }
    },
    {
        "label": "Niveau linguistique adapté au programme (attestation valide)",
        "key": "Q9_language_level_status",
        "category": "language",
        "type": "single_choice",
        "options": ["Oui - au niveau exigé ou +", "Légèrement inférieur / expiré", "Non"],
        "order": 11,
        "weight": 8,
        "isRequired": true,
        "scoringRules": {
            "Oui - au niveau exigé ou +": 8,
            "Légèrement inférieur / expiré": 4,
            "Non": 0
        }
    },
    {
        "label": "Nom du test + score/niveau (ex: DELF B2 - 72/100, IELTS 6.5, TOEFL iBT 90)",
        "key": "Q9bis_language_test_details",
        "category": "language",
        "type": "text",
        "order": 12,
        "weight": 0,
        "isRequired": false,
        "conditionalDisplay": {
            "dependsOn": "Q9_language_level_status",
            "showWhen": "Oui - au niveau exigé ou +"
        }
    },
    {
        "label": "Relevés/diplômes antérieurs (traduits si requis) disponibles ?",
        "key": "Q10_transcripts_available",
        "category": "education",
        "type": "boolean",
        "order": 13,
        "weight": 3,
        "isRequired": true,
        "scoringRules": { "true": 3, "false": 0 }
    },
    {
        "label": "Avez-vous une preuve de paiement (acompte ou totalité) ou un échéancier accepté par l'école ?",
        "key": "Q11_tuition_payment_proof",
        "category": "finance",
        "type": "boolean",
        "order": 14,
        "weight": 3,
        "isRequired": true,
        "scoringRules": { "true": 3, "false": 0 }
    },
    {
        "label": "Gaps académiques (> 1 an) expliqués par des justificatifs ?",
        "key": "Q12_gaps_justified",
        "category": "education",
        "type": "single_choice",
        "options": ["Oui", "Non", "N/A - pas de gap"],
        "order": 15,
        "weight": 3,
        "isRequired: true,
        "scoringRules": { "Oui": 3, "Non": 0, "N/A - pas de gap": 3 }
    },
    {
        "label": "Votre projet d'études est-il cohérent (diplômes antérieurs, continuité, objectifs) ?",
        "key": "Q13_project_coherence",
        "category": "project",
        "type": "single_choice",
        "options": ["Oui", "Partiel", "Non"],
        "order": 16,
        "weight": 4,
        "isRequired": true,
        "scoringRules": { "Oui": 4, "Partiel": 2, "Non": 0 }
    },
    {
        "label": "Avez-vous déjà entamé ou terminé la procédure officielle exigée par le pays ? (Campus France, UCAS, etc.)",
        "key": "Q14_official_process_started",
        "category": "project",
        "type": "boolean",
        "order": 17,
        "weight": 5,
        "isRequired": true,
        "scoringRules": { "true": 5, "false": 0 }
    },
    {
        "label": "Avez-vous l'intention principale d'étudier (et non de travailler à plein temps ou d'immigrer) ?",
        "key": "Q15_main_intent_study",
        "category": "project",
        "type": "boolean",
        "order": 18,
        "weight": 5,
        "isRequired": true,
        "scoringRules": { "true": 5, "false": 0 }
    },
    {
        "label": "Pouvez-vous prouver des moyens de subsistance mensuels au moins égaux au minimum requis par votre consulat pour toute la durée de vos études ?",
        "key": "Q16_monthly_means_ratio",
        "category": "finance",
        "type": "single_choice",
        "options": ["Oui", "Non"],
        "order": 19,
        "weight": 15,
        "isRequired": true,
        "scoringRules": { "Oui": 15, "Non": 0 }
    },
    {
        "label": "Source(s) des fonds (sélection multiple)",
        "key": "Q17_funding_sources",
        "category": "finance",
        "type": "multi_choice",
        "options": ["Épargne personnelle", "Parent/tuteur avec justificatifs", "Bourse officielle", "Prêt étudiant approuvé", "Parrain légal documenté", "Autre avec preuves"],
        "order": 20,
        "weight": 5,
        "isRequired": true,
        "scoringRules": "cap_5"
    },
    {
        "label": "Montant total disponible pour la première année (frais de scolarité + vie) : (saisir €)",
        "key": "Q18_first_year_amount_eur",
        "category": "finance",
        "type": "number",
        "order": 21,
        "weight": 10,
        "isRequired": true,
        "scoringRules": "formula"
    },
    {
        "label": "Bourse: attestation officielle indiquant montant mensuel et durée ?",
        "key": "Q19_scholarship_proof",
        "category": "finance",
        "type": "single_choice",
        "options": ["Oui", "Non", "N/A - pas de bourse"],
        "order": 22,
        "weight": 2,
        "isRequired": true,
        "scoringRules": { "Oui": 2, "Non": 0, "N/A - pas de bourse": 0 }
    },
    {
        "label": "Engagement écrit du garant avec pièces d'identité et justificatifs de revenus ?",
        "key": "Q20_sponsor_commitment",
        "category": "finance",
        "type": "boolean",
        "order": 23,
        "weight": 3,
        "isRequired": true,
        "scoringRules": { "true": 3, "false": 0 }
    }
]
```
