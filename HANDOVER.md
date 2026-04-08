# Documentation Technique - Module Test d'Éligibilité VISA

**Public cible :** Équipe technique MatchMySchool (MMS)

Ce document contient l'ensemble des informations nécessaires pour intégrer le module "Test d'Éligibilité VISA" dans la plateforme MatchMySchool Backoffice.

---

## 1. Vue d'ensemble du projet

### 1.1 Objectif

Le module VISA permet aux étudiants d'évaluer leur éligibilité pour obtenir un visa étudiant dans différents pays (France, Canada, USA, UK, etc.). Contrairement au test d'éligibilité actuel de MMS qui est 100% mathématique, ce module combine :

- **Scoring mathématique** pour le calcul du score
- **IA (Perplexity/Gemini)** pour la génération de briefings personnalisés
- **Scraper** pour récupérer les exigences officielles des pays

### 1.2 Architecture actuelle

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Test UI      │  │  Results UI  │  │   Chatbot UI     │  │
│  └───────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth Controller│  │Test Controller│ │Briefing Controller││
│  └───────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Eligibility Engine (Scoring)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Scraper (Port 3001)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     Gemini API → Country Requirements DB             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB                                   │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Users        │  │Submissions   │  │Country           │  │
│  │               │  │              │  │Requirements      │  │
│  └───────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Différences clés avec le test MMS existant

| Caractéristique | Test MMS actuel | Module VISA |
|-----------------|-----------------|-------------|
| Scoring | 100% mathématique | Mixte (math + IA pour briefing) |
| Questions | À choix fixes | Choix + entrées texte + numériques |
| Budget | Valeur fixe | Texte libre (à adapter) |
| Sources de données | Statiques | Scraper dynamique |
| Chatbot | Non | Oui (avec limitation) |
| DB | MMS existante | DB séparée (à migrer) |

### 1.4 ⚠️ IMPORTANT - Langue des questions

**Les questions doivent être bilingues (FR + EN)** comme le test d'admission existant MatchMySchool.

L'intégration doit permettre l'édition des questions dans les deux langues via le backoffice,
exactement comme le système actuel de gestion des tests.

**Action requise :**
- Créer un éditeur backoffice avec les champs `label_fr` et `label_en`
- Les options doivent aussi avoir les deux versions : `options_fr` et `options_en`
- Le frontend affiche selon la langue de l'utilisateur
- Les `key` et `category` restent en français pour le backend

---

## 2. Structure des questions

Le test comprend **23 questions** organisées en 6 catégories :

| Catégorie | Questions | Poids total |
|-----------|-----------|-------------|
| Personnel | Q4-Q6 | 25 pts |
| Éducation | Q8, Q10-Q12 | 20 pts |
| Langue | Q9 | 8 pts |
| Projet | Q13-Q15 | 14 pts |
| Finance | Q16-Q20 | 33 pts |
| **Total** | **20 questions scorées** | **100 pts** |

### 2.1 Format attendu par le Backoffice MMS

Le backoffice MMS utilise un Builder avec la structure suivante :

```json
{
  "language": "fr",
  "title": "Libellé français",
  "title_en": "English text",
  "code": "Q_unique_key",
  "score": 10,
  "description": "Description FR",
  "category": "personal",
  "options": [
    {
      "title": "Option FR",
      "title_en": "Option EN",
      "code": "OPT_01",
      "score": 10
    }
  ]
}
```

**Voir `doc/MMS_BUILDER_STRUCTURE.md` pour la structure complète.**

### 2.1 Types de questions

- **single_choice** : Une réponse parmi plusieurs options
- **multi_choice** : Plusieurs réponses possibles
- **boolean** : Oui/Non
- **number** : Entrée numérique
- **text** : Texte libre (non scoré, informationnel)

### 2.2 Questions conditionnelles

Certaines questions s'affichent uniquement selon la réponse précédente :
- Q3bis (autorisation parentale) : uniquement si Q3 = "Oui" (mineur)
- Q3ter (tranche d'âge) : uniquement si Q3 = "Non" (majeur)
- Q9bis (détails test langue) : uniquement si Q9 = "Oui"

---

## 3. Système de scoring

### 3.1 Formule de calcul

```
Score brut = Σ(points obtenus par question)
Score max = Σ(poids des questions scorées)
Score normalisé = (Score brut / Score max) × 100
```

### 3.2 Règles de scoring par type

**Type 1 : Choix avec règles explicites**
```javascript
// Exemple Q4 (Historique visa) - poids 10
scoringRules: {
  "Jamais": 8,
  "Déjà obtenu": 10,
  "Déjà refusé - motif corrigé": 6,
  "Déjà refusé - non corrigé": 0
}
// Points = (scoringRules[réponse] / max) × weight

// Exemple Q8 (Admission) - poids 11
scoringRules: {
  "Admission définitive": 11,
  "Pré-admission": 8,
  "Non": 0
}
```

**Type 2 : Boolean**
```javascript
if (réponse === true) points = weight
else points = 0
```

**Type 3 : Numérique avec comparaison**
```javascript
// Exemple Q18 (Budget annuel)
ratio = montantUtilisateur / montantRequisPays
if (ratio >= 1) points = 10
else if (ratio >= 0.8) points = 6
else if (ratio >= 0.6) points = 3
else points = 0 + hardFail
```

**Type 4 : Multi-choice avec cap**
```javascript
// Exemple Q17 (Sources de financement)
score = 5 si sources fiables (épargne, parents, bourse)
score = 3 si sources moyennes (prêt, parrain)
score = 1 sinon
```

### 3.3 Points bloquants (Hard Fails)

Certains critères provoquent un **échec automatique** :

| Condition | Conséquence |
|-----------|-------------|
| Refus de visa non corrigé | Score max = 40/100 |
| Antécédents migratoires graves | Score max = 40/100 |
| Casier judiciaire grave | Score max = 40/100 |
| Mineur sans autorisation parentale | Score max = 40/100 |
| Budget < 60% du requis | Score max = 40/100 |

### 3.4 Seuils de statut

| Score | Statut | Signification |
|-------|--------|---------------|
| ≥ 80% | ELIGIBLE | Profil solide |
| 65-79% | MITIGE | Profil moyen avec points à améliorer |
| 50-64% | FAIBLE | Manque des critères importants |
| < 50% | A_RISQUE | Risque élevé de refus |

---

## 4. Scraper d'exigences pays

### 4.1 Fonctionnement

Le scraper utilise **Google Gemini 2.0 Flash** pour extraire les exigences officielles depuis les sites gouvernementaux.

**Configuration requise :**
```env
GEMINI_API_KEY= clé API Gemini
MONGODB_URI= connexion MongoDB
```

**Pays couverts :** USA, Canada, Australie, UK, France, Allemagne, Espagne, Italie, Finlande, Irlande, Danemark, Norvège, Suède, Pologne, Malte, Belgique, Chine, Turquie, Corée du Sud

### 4.2 Données extraites

Pour chaque pays, le scraper récupère :

```json
{
  "financial": {
    "min_monthly_eur": 615,
    "min_annual_eur": 7380,
    "proof_accepted": ["Relevés bancaires", "Attestation garants"]
  },
  "language": {
    "tests_accepted": [{"name": "DELF", "level": "B2"}, {"name": "TCF", "level": "B2"}],
    "validity_months": 24
  },
  "admission": {
    "required": true,
    "proof_types": ["Lettre d'admission", "Pré-inscription"]
  },
  "documents": {
    "mandatory": ["Passeport", "Photos", "Assurance"],
    "optional": ["Attestation logement"]
  },
  "fees": {
    "visa_fee_eur": 99,
    "service_fee_eur": 50
  },
  "processing": {
    "average_delay_days": 30,
    "appointment_required": true
  }
}
```

### 4.3 Intégration MMS

**Options :**
1. **Microservice séparé** : Garder le scraper sur un port dédié (3001)
2. **Worker MMS** : Intégrer dans les tâches planifiées MMS
3. **Cron job** : Exécution hebdomadaire (dimanche 21h30)

**Recommandation :** Option 2 pour une gestion centralisée

### 4.4 Prompt Gemini utilisé

```
Recherche sur le web les exigences officielles pour un visa étudiant pour {PAYS}.
Extrais depuis {URL} :
1. Exigences financières (mensuel/annuel en EUR)
2. Tests de langue acceptés
3. Admission requise ou non
4. Documents obligatoires et optionnels
5. Frais (visa + service)
6. Délai de traitement

Réponds uniquement en JSON avec la structure exacte définie dans le code.
```

---

## 5. Génération de briefings avec IA

### 5.1 Configuration

**API utilisée :** Perplexity AI (modèles `sonar-pro` ou `sonar-32k-online`)

```env
PERPLEXITY_API_KEY= clé API Perplexity
```

### 5.2 Prompt de briefing

```
Tu es un expert en visas étudiants pour {PAYS}.
Analyse les données du candidat :

- Score global : {score}/100
- Statut : {status}
- Réponses : {answers}
- Exigences officielles : {requirements}

Génère un briefing structuré :
## Résumé du profil
## Points forts
## Points à améliorer
## Recommandations clés

IMPORTANT :
- Si le budget < minimum requis, indique-le comme point critique
- Ne mentionne jamais de manque d'informations
```

### 5.3 Intégration MMS

Le briefing est généré **après la soumission du test** et stocké dans la soumission.

**Alternative MMS :** Utiliser le système de notification existant pour envoyer le briefing par email.

---

## 6. Chatbot

### 6.1 Fonctionnement

Le chatbot répond aux questions des étudiants sur les visas.

### 6.2 Limitations à implémenter

| Limite | Valeur | Message d'avertissement |
|--------|--------|-------------------------|
| Questions par utilisateur | 100 | "Il vous reste {N} questions" |
| Avertissement | 10 restantes | Afficher bannière |
| Blocage | 0 | "Quota atteint" |

### 6.3 Intégration MMS

- Stocker le compteur dans la collection `users`
- Créer une nouvelle collection `chatbot_logs` pour l'historique
- Middleware pour vérifier le quota avant chaque message

---

## 7. Limitations d'utilisation

### 7.1 Quotas de tests

| Période | Limite | À implémenter |
|---------|--------|---------------|
| Semaine | 3 tests | Compteur `weekly_tests_count` |
| Mois | 10 tests | Compteur `monthly_tests_count` |
| Total | illimité | - |

### 7.2 Messages d'avertissement

```
// Afficher quand 2 tests restants
"Attention : Il vous reste seulement 2 tests visa cette semaine."

// Bloquer quand limite atteinte
"Vous avez atteint votre limite de tests visa pour cette période.
 Réessayez le {date}."
```

### 7.3 Stockage des compteurs

Dans le document User MMS :
```json
{
  "visa_test_limits": {
    "weekly_count": 2,
    "weekly_reset": "2026-04-14",
    "monthly_count": 8,
    "monthly_reset": "2026-05-01"
  }
}
```

---

## 8. Intégration Base de Données MMS

### 8.1 Collections à créer/étendre

| Collection locale | Collection MMS | Action |
|-------------------|----------------|--------|
| User | users | Ajouter champs `visa_test_limits` |
| Question | eligibilitytests | Ajouter `testType: "VISA"` |
| TestSubmission | eligibilityassessments | Ajouter `testType: "VISA"` |
| CountryRequirement | country_requirements | Créer nouvelle collection |
| ChatbotLog | chatbot_logs | Créer nouvelle collection |

### 8.2 Script de migration

```javascript
// À exécuter dans MMS
db.eligibilitytests.insertMany([
  // ... questions JSON complètes (voir section 9)
]);

db.country_requirements.insertMany([
  // ... données scraper
]);
```

### 8.3 Modifications du schéma User

```javascript
// Ajouter dans users MMS
visa_test_limits: {
  weekly_count: { type: Number, default: 0 },
  weekly_reset: { type: Date },
  monthly_count: { type: Number, default: 0 },
  monthly_reset: { type: Date }
},
chatbot_quota: {
  used: { type: Number, default: 0 },
  limit: { type: Number, default: 100 }
}
```

---

## 9. Questions complètes (JSON)

Voir le fichier `docs/COMPLETE_VISA_QUESTIONS.json` pour le JSON complet à insérer dans la base de données MMS.

---

## 10. Variables d'environnement requises

```env
# Scraper
GEMINI_API_KEY=xxx

# Briefing IA
PERPLEXITY_API_KEY=xxx

# Base de données
MONGODB_URI=mongodb+srv://...

# Configuration
VISA_TEST_WEEKLY_LIMIT=3
VISA_TEST_MONTHLY_LIMIT=10
CHATBOT_QUOTA_PER_USER=100
```

---

## 11. Checklist d'intégration MMS

- [ ] Créer les collections DB nécessaires
- [ ] Migrer les 23 questions dans `eligibilitytests`
- [ ] Ajouter le champ `testType: "VISA"` dans les schémas
- [ ] Implémenter le moteur de scoring dans `EligibilityAssessment`
- [ ] Intégrer le scraper (microservice ou worker)
- [ ] Configurer les clés API (Gemini, Perplexity)
- [ ] Implémenter les quotas (tests + chatbot)
- [ ] Créer l'UI Backoffice (onglet VISA)
- [ ] Créer l'UI Frontend student
- [ ] Tester le flux complet

---

## 12. Points d'attention

### 12.1 Budget texte → numérique

Le champ Q18_budget est actuellement un texte libre. Pour MMS :
- Soit le convertir en input numérique
- Soit extraire la valeur avec une regex

### 12.2 Test langue texte

Q9bis_language_test_details est un texte libre ("DELF B2 - 72/100").
Pas de scoring automatique possible actuellement.

### 12.3 Poids différents

Le scoring VISA fonctionne sur 118 points max, contrairement au test MMS actuel.
Adapter l'affichage en pourcentage.

### 12.4 UI à refaire

L'UI actuelle ne correspond pas au style MMS. Prévoir une refonte complète.

---

## 13. API Endpoints

### 13.1 Backend

```
POST /api/visa/test/submit    - Soumettre le test
GET  /api/visa/test/my        - Liste de mes tests
GET  /api/visa/test/:id       - Détails d'un test
GET  /api/visa/briefing/:id   - Générer le briefing IA
```

### 13.2 Scraper

```
GET  /scrape/:country         - Scraper un pays
POST /scrape/all              - Scraper tous les pays
GET  /requirements/:country   - Exigences d'un pays
GET  /requirements            - Liste des pays disponibles
```

---

## 14. Contact

Pour toute question technique sur cette intégration, consultez le code source dans :
- `backend/controllers/testController.js` - Logique de soumission
- `backend/utils/eligibilityEngine.js` - Moteur de scoring
- `serveur/server.js` - Scraper
