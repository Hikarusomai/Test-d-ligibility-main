# Guide d'Intégration VISA dans MatchMySchool

Guide pas à pas pour intégrer le module Test d'Éligibilité VISA dans le Backoffice MatchMySchool.

---

## 1. Prérequis

### 1.1 Accès nécessaires

- Accès administrateur à la base de données MMS
- Accès au code source du backoffice MMS
- Comptes API : Gemini (scraper), Perplexity (briefing)
- Droits pour créer des routes et contrôleurs

### 1.2 Variables d'environnement

Ajouter au fichier `.env` de MMS :

```env
# API Keys
GEMINI_API_KEY=votre_clé_gemini
PERPLEXITY_API_KEY=votre_clé_perplexity

# Configuration VISA
VISA_TEST_ENABLED=true
VISA_TEST_WEEKLY_LIMIT=3
VISA_TEST_MONTHLY_LIMIT=10
CHATBOT_QUOTA_PER_USER=100

# Scraper
VISA_SCRAPER_ENABLED=true
VISA_SCRAPER_CRON="30 21 * * 0"
```

---

## 2. Étape 1 - Base de données

### 2.1 Créer la collection country_requirements

```javascript
// Exécuter dans MongoDB Compass ou shell
db.createCollection("country_requirements");

// Créer les index
db.country_requirements.createIndex({ "country.slug": 1 });
db.country_requirements.createIndex({ "source.last_scraped": -1 });
```

### 2.2 Étendre la collection users

```javascript
// Mettre à jour tous les documents existants
db.users.updateMany(
  {},
  {
    $set: {
      visa_test_limits: {
        weekly_count: 0,
        weekly_reset: null,
        monthly_count: 0,
        monthly_reset: null
      },
      chatbot_quota: {
        used: 0,
        limit: 100,
        last_reset: new Date()
      }
    }
  }
);
```

### 2.3 Ajouter le champ testType dans eligibilitytests

```javascript
// Mettre à jour la structure
db.eligibilitytests.updateMany(
  {},
  {
    $set: {
      testType: "CUSTOM"
    }
  }
);
```

### 2.4 Insérer les questions VISA

```javascript
// Charger le fichier COMPLETE_VISA_QUESTIONS.json
const visaQuestions = require("./docs/COMPLETE_VISA_QUESTIONS.json");

db.eligibilitytests.insertOne({
  name: "Test d'Éligibilité VISA",
  testType: "VISA",
  isActive: true,
  description: "Évaluation des chances d'obtenir un visa étudiant",
  questions: visaQuestions,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

---

## 3. Étape 2 - Backend

### 3.1 Créer le contrôleur VISA

Fichier : `backend/controllers/visaController.js`

```javascript
const { evaluateEligibility } = require('../utils/visaEligibilityEngine');
const EligibilityAssessment = require('../models/EligibilityAssessment');
const CountryRequirement = require('../models/CountryRequirement');
const User = require('../models/User');

// Soumettre un test VISA
exports.submitVisaTest = async (req, res) => {
  try {
    const { originCountry, destinationCountry, answers } = req.body;
    const userId = req.user.id;

    // Vérifier les quotas
    const user = await User.findById(userId);
    if (!user.canTakeVisaTest()) {
      return res.status(429).json({
        success: false,
        message: "Limite de tests atteinte",
        resetDate: user.getNextVisaTestReset()
      });
    }

    // Récupérer les questions VISA
    const visaTest = await EligibilityTest.findOne({ testType: "VISA", isActive: true });

    // Calculer le score
    const result = await evaluateEligibility(answers, visaTest.questions);

    // Sauvegarder
    const assessment = new EligibilityAssessment({
      userId,
      testType: "VISA",
      originCountry,
      destinationCountry,
      answers,
      score: result.normalizedScore,
      status: result.status,
      analysis: result,
      completedAt: new Date()
    });
    await assessment.save();

    // Mettre à jour les compteurs
    await user.incrementVisaTestCount();

    res.json({
      success: true,
      assessment: {
        id: assessment._id,
        score: result.normalizedScore,
        status: result.status,
        hardFails: result.hardFails,
        reasons: result.reasons
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtenir mes tests VISA
exports.getMyVisaTests = async (req, res) => {
  const tests = await EligibilityAssessment.find({
    userId: req.user.id,
    testType: "VISA"
  }).sort({ completedAt: -1 });

  res.json({ success: true, tests });
};

// Obtenir les détails d'un test
exports.getVisaTestById = async (req, res) => {
  const test = await EligibilityAssessment.findOne({
    _id: req.params.id,
    userId: req.user.id,
    testType: "VISA"
  });

  if (!test) {
    return res.status(404).json({ success: false, message: "Test non trouvé" });
  }

  res.json({ success: true, test });
};
```

### 3.2 Créer les routes VISA

Fichier : `backend/routes/visaRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const visaController = require('../controllers/visaController');
const { authenticate } = require('../middlewares/auth');

router.post('/test/submit', authenticate, visaController.submitVisaTest);
router.get('/test/my', authenticate, visaController.getMyVisaTests);
router.get('/test/:id', authenticate, visaController.getVisaTestById);

module.exports = router;
```

Intégrer dans `backend/app.js` :

```javascript
const visaRoutes = require('./routes/visaRoutes');
app.use('/api/visa', visaRoutes);
```

### 3.3 Créer le modèle CountryRequirement

Fichier : `backend/models/CountryRequirement.js`

```javascript
const mongoose = require('mongoose');

const countryRequirementSchema = new mongoose.Schema({
  country: {
    name: { type: String, required: true },
    iso3: { type: String, required: true },
    slug: { type: String, required: }
  },
  source: {
    url: String,
    operator: String,
    last_scraped: Date,
    last_updated: Date
  },
  requirements: {
    financial: {
      min_monthly_eur: Number,
      min_annual_eur: Number,
      currency: String,
      proof_accepted: [String]
    },
    language: {
      tests_accepted: [{ name: String, level: String }],
      validity_months: Number,
      exemptions: [String]
    },
    admission: {
      required: Boolean,
      proof_types: [String],
      official_portal: String
    },
    documents: {
      mandatory: [String],
      optional: [String]
    },
    fees: {
      visa_fee_eur: Number,
      service_fee_eur: Number
    },
    processing: {
      average_delay_days: Number,
      appointment_required: Boolean
    }
  },
  meta: {
    version: String,
    checksum: String,
    validated_by: String,
    last_patch: Date
  }
});

countryRequirementSchema.index({ 'country.slug': 1 });
module.exports = mongoose.model('CountryRequirement', countryRequirementSchema);
```

### 3.4 Ajouter les méthodes de quota dans User

```javascript
// Dans le modèle User MMS

userSchema.methods.canTakeVisaTest = function() {
  const now = new Date();
  const limits = this.visa_test_limits || {};

  // Reset weekly si nécessaire
  if (!limits.weekly_reset || now > limits.weekly_reset) {
    limits.weekly_count = 0;
    limits.weekly_reset = getNextSunday();
  }

  // Reset monthly si nécessaire
  if (!limits.monthly_reset || now > limits.monthly_reset) {
    limits.monthly_count = 0;
    limits.monthly_reset = getFirstDayOfNextMonth();
  }

  return limits.weekly_count < 3 && limits.monthly_count < 10;
};

userSchema.methods.incrementVisaTestCount = function() {
  this.visa_test_limits.weekly_count++;
  this.visa_test_limits.monthly_count++;
  return this.save();
};

function getNextSunday() {
  const now = new Date();
  const daysUntilSunday = 7 - now.getDay();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(23, 59, 59);
  return nextSunday;
}

function getFirstDayOfNextMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}
```

---

## 4. Étape 3 - Scraper

### 4.1 Option 1 : Worker intégré (recommandé)

Créer `backend/workers/visaScraperWorker.js` :

```javascript
const cron = require('node-cron');
const CountryRequirement = require('../models/CountryRequirement');

// Liste des pays à scraper
const SCRAPING_TARGETS = [
  { country: 'France', iso3: 'FRA', slug: 'france', urls: [...] },
  { country: 'Canada', iso3: 'CAN', slug: 'canada', urls: [...] },
  // ... autres pays
];

// Scraper avec Gemini
async function scrapeCountry(countryConfig) {
  // Utiliser le code du serveur standalone
  // ...
}

// Cron job : tous les dimanches à 21h30
cron.schedule('30 21 * * 0', async () => {
  console.log('🔄 Début scraping VISA...');

  for (const country of SCRAPING_TARGETS) {
    try {
      await scrapeCountry(country);
      await sleep(30000); // Pause 30s
    } catch (error) {
      console.error(`Erreur pour ${country.country}:`, error.message);
    }
  }

  console.log('✅ Scraping terminé');
}, { timezone: 'Europe/Paris' });

// Démarrer
if (process.env.VISA_SCRAPER_ENABLED === 'true') {
  console.log('🚀 Scraper VISA activé');
}
```

Intégrer dans `backend/app.js` :

```javascript
if (process.env.VISA_SCRAPER_ENABLED === 'true') {
  require('./workers/visaScraperWorker');
}
```

### 4.2 Option 2 : Microservice séparé

Garder le serveur `serveur/server.js` tel quel et s'assurer qu'il pointe vers la même DB MMS.

---

## 5. Étape 4 - Briefing IA

### 5.1 Créer le service de briefing

Fichier : `backend/services/visaBriefingService.js`

```javascript
const Perplexity = require('@perplexity-ai/perplexity_ai');

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY
});

exports.generateBriefing = async (assessment, countryRequirement) => {
  const prompt = `
Tu es un expert en visas étudiants pour ${assessment.destinationCountry}.

### DONNÉES DU CANDIDAT :
- Score global : ${assessment.score}/100
- Statut : ${assessment.status}
- Points bloquants : ${assessment.analysis.hardFails.join(', ') || 'Aucun'}
- Points à améliorer : ${assessment.analysis.reasons.join(', ') || 'Aucun'}

### RÉPONSES DU CANDIDAT :
${JSON.stringify(assessment.answers, null, 2)}

### EXIGENCES OFFICIELLES :
${JSON.stringify(countryRequirement.requirements, null, 2)}

Génère un briefing structuré en français :
## Résumé du profil
## Points forts
## Points à améliorer
## Recommandations clés

IMPORTANT : Si le budget est insuffisant, indique-le clairement.
`;

  try {
    const completion = await client.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: 'Tu es un expert administratif spécialisé dans les visas étudiants.' },
        { role: 'user', content: prompt }
      ]
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Erreur génération briefing:', error);
    return getFallbackBriefing(assessment);
  }
};

function getFallbackBriefing(assessment) {
  return `## Résumé du profil

Votre score est de ${assessment.score}/100.

${assessment.status === 'ELIGIBLE' ? '🟢 Votre profil semble solide.' : '⚠️ Votre profil nécessite des ajustements.'}`;
}
```

### 5.2 Ajouter l'endpoint de briefing

```javascript
// Dans visaRoutes.js
router.get('/briefing/:id', authenticate, async (req, res) => {
  const assessment = await EligibilityAssessment.findOne({
    _id: req.params.id,
    userId: req.user.id,
    testType: "VISA"
  });

  if (!assessment) {
    return res.status(404).json({ success: false, message: "Test non trouvé" });
  }

  const country = await CountryRequirement.findOne({
    'country.slug': slugify(assessment.destinationCountry)
  });

  const briefing = await visaBriefingService.generateBriefing(assessment, country);

  res.json({ success: true, briefing });
});
```

---

## 6. Étape 5 - Chatbot

### 6.1 Créer le contrôleur chatbot

Fichier : `backend/controllers/chatbotController.js`

```javascript
const User = require('../models/User');
const ChatbotLog = require('../models/ChatbotLog');

exports.askQuestion = async (req, res) => {
  try {
    const { question, context } = req.body;
    const userId = req.user.id;

    // Vérifier le quota
    const user = await User.findById(userId);
    const quota = user.chatbot_quota || { used: 0, limit: 100 };

    if (quota.used >= quota.limit) {
      return res.status(429).json({
        success: false,
        message: "Quota de questions atteint (100/100)"
      });
    }

    // Générer la réponse (avec Perplexity ou autre)
    const response = await generateChatbotResponse(question, context);

    // Logger
    await ChatbotLog.create({
      userId,
      message: question,
      response,
      timestamp: new Date(),
      context
    });

    // Incrémenter le compteur
    user.chatbot_quota.used++;
    await user.save();

    // Avertir si proche de la limite
    const remaining = quota.limit - user.chatbot_quota.used;
    const warning = remaining <= 10 ? `Il vous reste seulement ${remaining} questions.` : null;

    res.json({
      success: true,
      response,
      quota_remaining: remaining,
      warning
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### 6.2 Créer les routes chatbot

```javascript
// Dans visaRoutes.js
const chatbotController = require('../controllers/chatbotController');

router.post('/chatbot/ask', authenticate, chatbotController.askQuestion);
router.get('/chatbot/quota', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id);
  const remaining = (user.chatbot_quota?.limit || 100) - (user.chatbot_quota?.used || 0);
  res.json({ success: true, remaining });
});
```

---

## 7. Étape 6 - Frontend

### 7.1 Backoffice - Créer l'onglet VISA

Dans le menu du backoffice, ajouter :

```
[Tests] → [VISA Test] → [Questions]
                 ↓
                 [Results]
                 ↓
                 [Settings]
```

### 7.2 Frontend Student - Page de test

Créer une nouvelle page `/visa-test` avec :

1. **Introduction** : Explication du test
2. **Formulaire** : Les 23 questions
3. **Soumission** : Appel à `/api/visa/test/submit`
4. **Résultats** : Affichage du score et du briefing

### 7.3 Messages de quota

Afficher une bannière quand :
- 2 tests restants dans la semaine
- 2 tests restants dans le mois
- Quota chatbot ≤ 10 questions

---

## 8. Checklist finale

### Backend
- [ ] Collections DB créées
- [ ] Modèles créés/étendus
- [ ] Contrôleur VISA créé
- [ ] Routes VISA créées
- [ ] Service de briefing créé
- [ ] Chatbot intégré
- [ ] Quotas implémentés
- [ ] Scraper configuré

### Frontend
- [ ] Onglet VISA dans le backoffice
- [ ] Page de test pour les students
- [ ] Affichage des résultats
- [ ] Messages de quota
- [ ] Page chatbot

### Tests
- [ ] Scoring correct
- [ ] Briefing IA fonctionnel
- [ ] Quotas respectés
- [ ] Scraper fonctionne
- [ ] Chatbot limité
- [ ] Test end-to-end

---

## 9. Dépannage

### Le score est toujours 0
- Vérifier que `testType: "VISA"` est bien défini
- Vérifier que les questions ont bien un `weight`
- Vérifier le format des réponses

### Le briefing ne s'affiche pas
- Vérifier la clé API Perplexity
- Vérifier les logs du serveur

### Le scraper ne fonctionne pas
- Vérifier la clé API Gemini
- Tester avec un seul pays d'abord

### Les quotas ne fonctionnent pas
- Vérifier que les champs `visa_test_limits` existent dans le document User
- Vérifier les dates de reset
