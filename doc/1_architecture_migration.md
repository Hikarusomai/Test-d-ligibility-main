# Migration Architecture - Module VISA vers MMS

Guide pour migrer l'architecture du module VISA vers MatchMySchool Backoffice.

---

## 1. Vue d'ensemble de la migration

### 1.1 Architecture actuelle (standalone)

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                           │
│  - Test UI                                                  │
│  - Results UI                                               │
│  - Chatbot UI                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend API (Express) - Port 3000                          │
│  - Auth (JWT)                                               │
│  - Test Controller                                          │
│  - Eligibility Engine                                       │
│  - Briefing Controller (Perplexity)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Scraper Service - Port 3001                                │
│  - Gemini API                                               │
│  - Country Requirements                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MongoDB                                                    │
│  - users                                                    │
│  - questions                                                │
│  - test_submissions                                         │
│  - country_requirements                                     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture cible (intégrée MMS)

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend MMS                                               │
│  - Onglet "Test VISA" dans le Backoffice                    │
│  - Page Test pour les students                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend MMS                                                │
│  - Auth existante MMS                                       │
│  - Visa Controller (nouveau)                                │
│  - Eligibility Engine (intégré)                             │
│  - Briefing Service (intégré)                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Scraper (Worker MMS ou Microservice)                       │
│  - Tâche planifiée                                         │
│  - Country Requirements (DB MMS)                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MongoDB MMS                                                │
│  - users (étendu)                                           │
│  - eligibilitytests (étendu)                                │
│  - eligibilityassessments (étendu)                          │
│  - country_requirements (nouveau)                           │
│  - chatbot_logs (nouveau)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Mapping des collections

### 2.1 Tableau de correspondance

| Collection Standalone | Collection MMS | Modifications requises |
|-----------------------|----------------|------------------------|
| `users` | `users` | Ajouter champs `visa_test_limits`, `chatbot_quota` |
| `questions` | `eligibilitytests` | Ajouter champ `testType: "VISA"` |
| `test_submissions` | `eligibilityassessments` | Ajouter champ `testType: "VISA"` |
| `country_requirements` | `country_requirements` | Créer nouvelle collection |
| - | `chatbot_logs` | Créer nouvelle collection |

### 2.2 Schéma Users - Champs à ajouter

```javascript
// Dans la collection users MMS
{
  // ... champs existants

  // Nouveaux champs pour VISA
  visa_test_limits: {
    weekly_count: { type: Number, default: 0 },
    weekly_reset: { type: Date },
    monthly_count: { type: Number, default: 0 },
    monthly_reset: { type: Date }
  },

  chatbot_quota: {
    used: { type: Number, default: 0 },
    limit: { type: Number, default: 100 },
    last_reset: { type: Date }
  }
}
```

### 2.3 Schéma EligibilityTests - Extensions

```javascript
// Dans la collection eligibilitytests MMS
{
  // ... champs existants

  // Ajouter pour distinguer les types
  testType: {
    type: String,
    enum: ['CUSTOM', 'SPECIAL', 'VISA'],
    default: 'CUSTOM'
  },

  // Pour VISA : questions avec structure spécifique
  questions: [{
    label: String,
    key: String,
    category: String,  // 'personal', 'education', 'language', 'project', 'finance'
    type: String,      // 'single_choice', 'multi_choice', 'boolean', 'number', 'text'
    options: [String],
    order: Number,
    weight: Number,    // 0-20
    isRequired: Boolean,
    scoringRules: mongoose.Schema.Types.Mixed,
    conditionalDisplay: {
      dependsOn: String,
      showWhen: String
    }
  }]
}
```

### 2.4 Nouvelle collection : CountryRequirements

```javascript
// Créer dans MMS
{
  country: {
    name: String,      // "France"
    iso3: String,      // "FRA"
    slug: String       // "france"
  },

  source: {
    url: String,
    operator: String,  // "Campus France"
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
      tests_accepted: [{
        name: String,   // "DELF"
        level: String   // "B2"
      }],
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
}
```

### 2.5 Nouvelle collection : ChatbotLogs

```javascript
// Créer dans MMS pour tracker l'utilisation du chatbot
{
  userId: ObjectId,
  message: String,
  response: String,
  timestamp: Date,
  context: {
    country: String,
    test_submission_id: ObjectId
  }
}
```

---

## 3. Migration de l'Authentification

### 3.1 Actuel (standalone)

```javascript
// JWT middleware simple
const auth = (req, res, next) => {
  const token = req.headers.authorization;
  // Vérification JWT
};
```

### 3.2 Cible (MMS)

```javascript
// Utiliser l'auth MMS existante
// Pas de changement - le middleware MMS gère déjà
// Les routes VISA seront protégées par le même système
```

---

## 4. Migration des services

### 4.1 Eligibility Engine

**Fichier :** `backend/utils/eligibilityEngine.js`

**Action :** Copier le fichier dans `backend/utils/visaEligibilityEngine.js` de MMS

**Modifications requises :**
- Adapter les requêtes MongoDB pour utiliser les collections MMS
- Garder la logique de scoring identique

### 4.2 Briefing Controller

**Fichier :** `backend/controllers/testController.js` (méthode `submitTest`)

**Action :** Intégrer dans `VisaController` de MMS

**Modifications requises :**
- Remplacer l'API Perplexity par le système d'IA MMS si disponible
- Sinon, créer un nouveau service IA dédié

### 4.3 Scraper Service

**Fichier :** `serveur/server.js`

**Options d'intégration :**

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| Microservice séparé | Isolation, facile à maintenir | Une DB supplémentaire |
| Worker MMS | Centralisé | Plus complexe à intégrer |
| Cron job externe | Simple | Pas d'intégration directe |

**Recommandation :** Option 2 (Worker MMS)

**Implémentation :**
```javascript
// Dans MMS, créer un worker visa-scraper.js
const cron = require('node-cron');
const { scrapeCountry } = require('./workers/visaScraper');

// Tous les dimanches à 21h30
cron.schedule('30 21 * * 0', async () => {
  const countries = await CountryRequirements.find({});
  for (const country of countries) {
    await scrapeCountry(country.slug);
    await sleep(30000); // 30s entre chaque pays
  }
}, { timezone: 'Europe/Paris' });
```

---

## 5. Script de migration des données

### 5.1 Migration des questions

```javascript
// Exécuter dans MongoDB MMS
const visaQuestions = require('./docs/COMPLETE_VISA_QUESTIONS.json');

db.eligibilitytests.insertOne({
  name: "Test d'Éligibilité VISA",
  testType: "VISA",
  isActive: true,
  questions: visaQuestions,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 5.2 Migration des soumissions existantes (optionnel)

```javascript
// Si des données existent dans la DB standalone
db.test_submissions.find().forEach(function(doc) {
  db.eligibilityassessments.insertOne({
    userId: doc.userId,
    testType: "VISA",
    originCountry: doc.originCountry,
    destinationCountry: doc.destinationCountry,
    answers: doc.answers,
    score: doc.score,
    analysis: doc.analysis,
    status: doc.status,
    completedAt: doc.completedAt,
    createdAt: doc.createdAt
  });
});
```

---

## 6. Checklist de migration

### Phase 1 - Préparation
- [ ] Sauvegarder la DB MMS existante
- [ ] Créer les nouvelles collections
- [ ] Ajouter les champs dans `users`
- [ ] Préparer les variables d'environnement

### Phase 2 - Données
- [ ] Migrer les 23 questions VISA
- [ ] Migrer les `country_requirements` (si existantes)
- [ ] Tester les requêtes MongoDB

### Phase 3 - Backend
- [ ] Créer `VisaController` dans MMS
- [ ] Intégrer `eligibilityEngine.js`
- [ ] Créer les routes API VISA
- [ ] Implémenter les quotas (3/semaine, 10/mois)

### Phase 4 - Scraper
- [ ] Choisir l'option d'intégration
- [ ] Configurer Gemini API
- [ ] Mettre en place le cron job
- [ ] Tester le scraping

### Phase 5 - Frontend
- [ ] Créer l'onglet "VISA" dans le backoffice
- [ ] Créer la page de test pour les students
- [ ] Implémenter les messages de quota
- [ ] Tester le flux complet

### Phase 6 - Tests
- [ ] Test du scoring
- [ ] Test du briefing IA
- [ ] Test des quotas
- [ ] Test du chatbot
- [ ] Test end-to-end

---

## 7. Variables d'environnement

Ajouter dans `.env` de MMS :

```env
# Clés API
GEMINI_API_KEY=votre_clé_gemini
PERPLEXITY_API_KEY=votre_clé_perplexity

# Limites VISA
VISA_TEST_WEEKLY_LIMIT=3
VISA_TEST_MONTHLY_LIMIT=10
CHATBOT_QUOTA_PER_USER=100

# Configuration Scraper
VISA_SCRAPER_ENABLED=true
VISA_SCRAPER_CRON="30 21 * * 0"
```

---

## 8. Points d'attention

1. **Auth MMS** : Ne pas recréer un système d'auth, utiliser celui existant
2. **DB unique** : Ne pas maintenir deux DB, utiliser uniquement MMS
3. **Scoring identique** : La logique de scoring ne doit pas changer
4. **UI cohérente** : Créer une UI qui s'intègre au style MMS
5. **Quotas** : Implémenter les limitations côté backend ET frontend

---

## 9. Rollback

En cas de problème :

```javascript
// Restaurer la sauvegarde MMS
mongorestore --db mms_prod backup/mms_prod_YYYYMMDD/

// Désactiver le module VISA
db.eligibilitytests.updateOne(
  { testType: "VISA" },
  { $set: { isActive: false } }
);
```
