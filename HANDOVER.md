# Documentation Technique - Module Test d'Éligibilité VISA

**Public cible :** Équipe technique MatchMySchool (MMS)

> **Note :** L'équipe MMS reçoit uniquement le dossier `serveur/` (scraper IA Gemini). Le frontend et le backend standalone ne sont pas à reprendre tels quels — la logique est à réimplémenter dans l'infrastructure MMS existante. Les clés API (`GEMINI_API_KEY`, `PERPLEXITY_API_KEY`) sont transmises **séparément par email sécurisé**.

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
│                    Frontend (React/TS)                      │
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
│                    Scraper (serveur/) ← CE QUE VOUS RECEVEZ │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     Gemini API → Country Requirements DB             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB MMS (votre DB)                    │
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
| Budget | Valeur fixe | Comparaison dynamique avec seuils pays |
| Sources de données | Statiques | Scraper dynamique (Gemini) |
| Chatbot | Non | Oui (avec limitation 100 messages/user) |
| DB | MMS existante | MMS existante (même DB, collections étendues) |

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
| Éducation | Q8, Q10-Q12 | 21 pts |
| Langue | Q9 | 8 pts |
| Projet | Q13-Q15 | 14 pts |
| Finance | Q16-Q20 | 35 pts |
| **Total scoré** | **20 questions** | **~103 pts → normalisé sur 100** |

> Le score est normalisé : `Score final = (points obtenus / points max atteints) × 100`

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
  "description_en": "Description EN",
  "category": "personal",
  "type": "single_choice",
  "options": [
    {
      "title": "Option FR",
      "title_en": "Option EN",
      "code": "OPT_01",
      "score": 80
    }
  ]
}
```

> ⚠️ **Les scores des options sont sur 0-100 (pourcentage).**  
> Score final question = (score option / 100) × points max de la question  
> Ex: option score=80, question score=10 → (80/100) × 10 = **8 pts**

**Voir `doc/MMS_BUILDER_STRUCTURE.md` pour la structure complète et les wireframes backoffice.**

### 2.2 Types de questions

- **single_choice** : Une réponse parmi plusieurs options (Q4, Q5, Q6, Q8, Q9, Q12, Q13, Q16, Q19)
- **multi_choice** : Plusieurs réponses possibles (Q17 — sources de financement)
- **boolean** : Oui/Non (Q10, Q11, Q14, Q15, Q20)
- **number** : Entrée numérique (Q18 — budget annuel)
- **text** : Texte libre, non scoré (Q9bis — détails test langue)

### 2.3 Questions conditionnelles

Certaines questions s'affichent uniquement selon la réponse précédente :

| Question | Condition d'affichage | Type | Poids |
|----------|-----------------------|------|-------|
| Q3bis (autorisation parentale) | Q3 = "Oui" (mineur) | single_choice | 0 |
| Q3ter (tranche d'âge) | Q3 = "Non" (majeur) | single_choice | 0 |
| Q9bis (détails test langue) | Q9 = "Oui - au niveau exigé ou +" | text | 0 |

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
  "Déjà refusé - non corrigé": 0  // ← HARD FAIL
}
// Points = scoringRules[réponse]  (déjà en points absolus, pas en %)

// Exemple Q8 (Admission) - poids 12
scoringRules: {
  "Admission définitive": 12,
  "Pré-admission avec conditions réalistes": 8,
  "Non": 0
}
```

**Type 2 : Boolean**
```javascript
if (réponse === true) points = weight
else points = 0
```

**Type 3 : Numérique avec comparaison dynamique (Q18 — Budget)**
```javascript
// Comparaison avec min_annual_eur récupéré du scraper pour le pays cible
ratio = montantUtilisateur / montantRequisPays
if (ratio >= 1)   points = 10        // Suffisant
else if (ratio >= 0.8) points = 6    // Légèrement sous le seuil
else if (ratio >= 0.6) points = 3    // Insuffisant
else { points = 0; hardFail = true } // Bloquant → score max = 40
```

**Type 4 : Multi-choice avec plafond (Q17 — Sources de financement)**
```javascript
score = 5  si sources fiables (épargne, parents, bourse)
score = 3  si sources moyennes (prêt, parrain)
score = 1  sinon
```

### 3.3 Points bloquants (Hard Fails)

Certains critères provoquent un **échec automatique** — le score est plafonné à **40/100** :

| Condition | Réponse déclenchante |
|-----------|----------------------|
| Refus de visa non corrigé | Q4 = "Déjà refusé - non corrigé" |
| Antécédents migratoires graves | Q5 = "Oui - grave (expulsion, interdiction, fraude)" |
| Casier judiciaire grave | Q6 = "Oui - grave (violence, fraude, immigration)" |
| Mineur sans autorisation parentale | Q3 = "Oui" ET Q3bis = "Non" |
| Budget < 60% du requis | Q18 : ratio < 0.6 |

### 3.4 Seuils de statut

| Score normalisé | Statut | Signification |
|-----------------|--------|---------------|
| ≥ 80% | `ELIGIBLE` | Profil solide, forte chance d'obtention |
| 65–79% | `MITIGE` | Profil moyen avec points à améliorer |
| 50–64% | `FAIBLE` | Manque des critères importants |
| < 50% ou hard fail | `A_RISQUE` | Risque élevé de refus |

---

## 4. Scraper d'exigences pays (`serveur/`)

### 4.1 Fonctionnement

Le scraper utilise **Google Gemini 2.0 Flash** pour extraire les exigences officielles depuis les sites gouvernementaux.

**Configuration requise :**
```env
GEMINI_API_KEY=AIzaSy...   # fournie par email sécurisé
MONGODB_URI=...            # URI de la DB MMS
PORT=3001
```

**Pays couverts (19) :** USA, Canada, Australie, UK, France, Allemagne, Espagne, Italie, Finlande, Irlande, Danemark, Norvège, Suède, Pologne, Malte, Belgique, Chine, Turquie, Corée du Sud

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
  "fees": { "visa_fee_eur": 99, "service_fee_eur": 50 },
  "processing": { "average_delay_days": 30, "appointment_required": true }
}
```

### 4.3 Endpoints REST du scraper

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/scrape/:country` | Scraper un pays (slug: `france`, `usa`...) |
| POST | `/scrape/all` | Lancer le scraping complet en arrière-plan |
| GET | `/requirements/:country` | Récupérer les données d'un pays |
| GET | `/requirements` | Lister tous les pays disponibles |
| GET | `/scraping-report` | Rapport de la dernière exécution |
| GET | `/health` | État du service |

### 4.4 Intégration MMS

**Options :**
1. **Microservice séparé** : Garder le scraper sur un port dédié (3001)
2. **Worker MMS** : Intégrer dans les tâches planifiées MMS ← **Recommandé**
3. **Cron job standalone** : Exécution hebdomadaire (lundi ~13h heure Paris)

### 4.5 Prompt Gemini utilisé

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

**API utilisée :** Perplexity AI (modèle `sonar-pro`)

```env
PERPLEXITY_API_KEY=pplx-...   # fournie par email sécurisé
```

### 5.2 Prompt de briefing

```
Tu es un expert en visas étudiants pour {PAYS}.
Analyse les données du candidat :

- Score global : {score}/100
- Statut : {status}
- Points bloquants : {hardFails}
- Points d'attention : {reasons}
- Réponses : {answers}
- Exigences officielles : {requirements}

Génère un briefing structuré :
## Résumé du profil
## Points forts
## Points à améliorer
## Recommandations clés

RÈGLE CRITIQUE : Si le budget déclaré < minimum requis, indiquer que le visa sera refusé.
Ne jamais valider un budget insuffisant. Ne jamais mentionner un manque d'informations.
```

### 5.3 Intégration MMS

Le briefing est généré **après la soumission du test** et stocké dans la soumission.

**Alternative MMS :** Utiliser le système de notification existant pour envoyer le briefing par email.

---

## 6. Chatbot

### 6.1 Fonctionnement

Le chatbot répond aux questions des étudiants sur les visas (contexte du test, exigences pays, etc.).

### 6.2 Limitations à implémenter

| Limite | Valeur | Message d'avertissement |
|--------|--------|-------------------------|
| Questions par utilisateur | **100 total** (cumulatif) | — |
| Avertissement quota | **À 2 restantes** | `"Il vous reste seulement 2 questions disponibles avec l'assistant."` |
| Blocage | 0 restantes | `"Vous avez épuisé votre quota d'assistance. Contactez un conseiller MMS."` |

### 6.3 Intégration MMS

- Stocker le compteur dans la collection `users` (champ `chatbot_quota.used`)
- Créer une collection `chatbot_logs` pour l'historique
- Middleware de vérification du quota avant chaque message

---

## 7. Limitations d'utilisation du test

### 7.1 Quotas de tests

| Période | Limite | Compteur |
|---------|--------|----------|
| Semaine | **3 tests** | `weekly_count` (reset lundi minuit) |
| Mois | **10 tests** | `monthly_count` (reset 1er du mois) |

### 7.2 Messages d'avertissement

```
// Afficher quand 2 tests restants cette semaine
"Attention : Il vous reste seulement 2 tests visa cette semaine."

// Bloquer quand limite atteinte
"Vous avez atteint votre limite de tests visa pour cette période.
 Réessayez le {date_reset}."
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
  },
  "chatbot_quota": {
    "used": 98,
    "limit": 100
  }
}
```

---

## 8. Intégration Base de Données MMS

**Règle absolue : utiliser la base de données MMS existante. Ne pas créer une nouvelle DB.**

### 8.1 Collections à créer/étendre

| Collection locale | Collection MMS | Action |
|-------------------|----------------|--------|
| User | `users` | Ajouter `visa_test_limits`, `chatbot_quota` |
| Question | `eligibilitytests` | Ajouter `testType: "VISA"` |
| TestSubmission | `eligibilityassessments` | Ajouter `testType: "VISA"`, `briefing`, `hardFails` |
| CountryRequirement | `country_requirements` | **Créer** |
| — | `chatbot_logs` | **Créer** |

### 8.2 Script de migration

```javascript
// Créer le test VISA dans eligibilitytests
db.eligibilitytests.insertOne({
  name: "Test d'Éligibilité VISA",
  testType: "VISA",
  isActive: true,
  questions: [ /* voir docs/COMPLETE_VISA_QUESTIONS.json */ ]
});
```

### 8.3 Modifications du schéma User

```javascript
// Ajouter dans le schéma users MMS
visa_test_limits: {
  weekly_count:  { type: Number, default: 0 },
  weekly_reset:  { type: Date },
  monthly_count: { type: Number, default: 0 },
  monthly_reset: { type: Date }
},
chatbot_quota: {
  used:  { type: Number, default: 0 },
  limit: { type: Number, default: 100 }
}
```

---

## 9. Questions complètes (JSON)

Voir le fichier **`docs/COMPLETE_VISA_QUESTIONS.json`** pour le JSON complet à insérer en base.

---

## 10. Variables d'environnement requises

```env
# Scraper (serveur/)
GEMINI_API_KEY=AIzaSy...          # fournie par email sécurisé

# Briefing IA (backend MMS)
PERPLEXITY_API_KEY=pplx-...       # fournie par email sécurisé

# Base de données
MONGODB_URI=mongodb+srv://...     # URI DB MMS

# Limites (configurables)
VISA_TEST_WEEKLY_LIMIT=3
VISA_TEST_MONTHLY_LIMIT=10
CHATBOT_QUOTA_PER_USER=100
```

---

## 11. Checklist d'intégration MMS

### Backend
- [ ] Créer la collection `country_requirements` en DB MMS
- [ ] Déployer le scraper `serveur/` (microservice ou worker)
- [ ] Configurer le cron hebdomadaire du scraper (lundi)
- [ ] Migrer les 23 questions dans `eligibilitytests` avec `testType: "VISA"`
- [ ] Implémenter le moteur de scoring (copier `eligibilityEngine.js`)
- [ ] Intégrer l'appel Perplexity pour le briefing post-test
- [ ] Implémenter les quotas de tests (3/sem, 10/mois) sur POST submit
- [ ] Implémenter le quota chatbot (100 msgs, alerte à 2 restants)
- [ ] Étendre le schéma `users` avec les compteurs de quota
- [ ] Configurer les clés API dans les variables d'environnement

### Backoffice
- [ ] Ajouter `"VISA"` comme nouveau Type dans le dropdown Eligibility Tests
- [ ] Créer le test via le Builder avec les 23 questions (FR + EN)
- [ ] Configurer les scores des options (échelle 0-100)
- [ ] Associer les Study Levels (Bac+3, Bac+4, Bac+5)

### Frontend
- [ ] Créer l'onglet VISA dans le backoffice admin
- [ ] Créer la page de test étudiant (questions conditionnelles, types mixtes)
- [ ] Afficher les résultats avec statut coloré (ELIGIBLE / MITIGE / FAIBLE / A_RISQUE)
- [ ] Afficher le briefing Markdown post-soumission
- [ ] Afficher les messages de quota (tests + chatbot)

### Tests
- [ ] Scoring correct (utiliser `verify-scoring.js` à la racine)
- [ ] Briefing IA généré correctement
- [ ] Quotas tests et chatbot respectés
- [ ] Scraper fonctionnel pour tous les 19 pays
- [ ] Flux complet end-to-end

---

## 12. Points d'attention

### 12.1 Q9bis — Test langue en texte libre

Q9bis est un champ texte libre ("DELF B2 — 72/100", "IELTS 6.5"). Ce champ **n'est pas scoré mathématiquement** (poids = 0). Il est transmis à Perplexity pour contextualiser le briefing.

**Recommandation MMS :** Remplacer à terme par deux champs : `select` (nom du test) + `number` (score).

### 12.2 Q18 — Budget : comparaison dynamique pays

Le scoring de Q18 dépend de `min_annual_eur` issu du scraper. Si le scraper n'a pas encore tourné pour un pays → valeur de secours = **10 000€**. Afficher un avertissement si les données pays ont plus de 30 jours.

### 12.3 Pondération différente

Le scoring VISA utilise des poids fixes liés à la logique métier. Ne pas les exposer comme éditables via le builder — risque de casser la cohérence du score.

### 12.4 UI à créer

L'UI actuelle ne correspond pas au style MMS. Elle est à recréer en tenant compte : questions conditionnelles, types de champs mixtes, affichage briefing Markdown, statuts colorés.

---

## 13. API Endpoints

### Backend

```
POST /api/visa/test/submit      - Soumettre le test (calcul score + génération briefing)
GET  /api/visa/test/my          - Liste de mes tests
GET  /api/visa/test/:id         - Détails d'un test
GET  /api/visa/briefing/:id     - Régénérer le briefing IA
POST /api/visa/chatbot/ask      - Poser une question (vérifie quota)
```

### Scraper

```
GET  /scrape/:country           - Scraper un pays manuellement
POST /scrape/all                - Scraper tous les pays (arrière-plan)
GET  /requirements/:country     - Exigences d'un pays
GET  /requirements              - Liste des pays disponibles
GET  /scraping-report           - Rapport de la dernière exécution
GET  /health                    - État du service
```

---

## 14. Contact & Références

Pour toute question technique sur cette intégration :
- `backend/controllers/testController.js` — Logique de soumission + appel Perplexity
- `backend/utils/eligibilityEngine.js` — Moteur de scoring complet
- `serveur/server.js` — Scraper Gemini + endpoints REST
- `docs/COMPLETE_VISA_QUESTIONS.json` — Questions JSON complètes
- `doc/MMS_BUILDER_STRUCTURE.md` — Format Builder MMS avec wireframes

---

## 15. Credentials API (transmises par email sécurisé)

| Variable | Service | Note |
|----------|---------|------|
| `GEMINI_API_KEY` | Google Gemini 2.0 Flash (scraper) | Ne jamais committer |
| `PERPLEXITY_API_KEY` | Perplexity sonar-pro (briefing) | Ne jamais committer |

> Ces clés sont transmises par email sécurisé séparé. Les stocker uniquement dans les variables d'environnement du serveur MMS. Ne jamais les inclure dans le code source ou les commits.

---

*Version : 2.1 — Avril 2026*  
*Sources : HackSpice (projet standalone) → MatchMySchool (intégration)*
