***

# TECH_SPEC.md - HackSpice

## Résumé technique

HackSpice est une plateforme full-stack d'évaluation d'éligibilité aux visas étudiants pour 19 pays occidentaux. L'architecture repose sur trois services Node.js indépendants : un backend API REST (Express/MongoDB), un frontend React/TypeScript (Vite), et un serveur de scraping hebdomadaire utilisant Google Gemini 2.0 Flash pour extraire automatiquement les exigences de visa. Le système génère des briefings personnalisés via l'API Perplexity et calcule des scores d'éligibilité basés sur des réponses à un questionnaire dynamique. L'authentification JWT sécurise les endpoints sensibles, et toutes les données personnelles sont stockées de manière conforme RGPD dans MongoDB.[4][2][3][1]

---

## Architecture

### Diagramme

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/TS)                      │
│                  http://localhost:5173                      │
│  - Vite + React 19 + TypeScript                             │
│  - TailwindCSS + Lucide Icons                               │
│  - API Service (api.ts) + LocalStorage Auth                 │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST
                        │ CORS enabled
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API (Express)                     │
│                  http://localhost:3000                      │
│  - Controllers: auth, tests, questions, briefing            │
│  - Middlewares: JWT auth, requireAdmin                      │
│  - Routes: /api/auth, /api/tests, /api/questions            │
│  - Utils: scoreCalculator, eligibilityEngine                │
└───────────────────────┬─────────────────────────────────────┘
                        │ Mongoose ODM
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                         │
│  Collections: users, questions, testsubmissions,            │
│              countryrequirements, visarequirements          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               SCRAPER SERVICE (Node.js + Cron)              │
│                  http://localhost:3000                      │
│  - Cron: Lundi 03h00 (Europe/Paris)                         │
│  - Google Gemini 2.0 Flash API                              │
│  - 19 pays × 2-4 URLs/pays                                  │
│  - Endpoints: /scrape/:country, /scraping-report            │
└───────────────────────┬─────────────────────────────────────┘
                        │ Direct MongoDB write
                        ▼
                   [Same MongoDB]
```

### Composants principaux

#### Frontend
- **Framework**: React 19.1.1 + TypeScript 5.9.3, bundlé avec Vite 7.1.7[3]
- **State management**: Hooks React + LocalStorage pour auth/sessions[5]
- **UI**: TailwindCSS 3.4, composants réutilisables (questions, modals, header)[1]
- **Routing**: React Router (pages: Home, Dashboard, Questions, Results)[4]
- **API Client**: Service TypeScript centralisé (`api.ts`) avec gestion tokens JWT[5]

#### Backend
- **Runtime**: Node.js v20+[1]
- **Framework**: Express 5.1.0 avec middleware CORS[3]
- **Database**: MongoDB via Mongoose 8.19.3[3]
- **Architecture**: MVC (Models, Controllers, Routes) + Middlewares[1]
- **Authentification**: JWT (jsonwebtoken 9.0.2) + bcryptjs 3.0.3[3]
- **Endpoints**: 5 routes principales (auth, users, tests, questions publiques/admin)[1]

#### Workers (Scraper)
- **Scheduler**: node-cron 3.0.3 - exécution hebdomadaire lundis 03h00[1]
- **Scraping**: Google Gemini 2.0 Flash (`@google/genai` 1.29.0)[3]
- **Sources**: 19 pays × 2-4 URLs officielles (ambassades, Campus France, etc.)[1]
- **Output**: Données structurées JSON → MongoDB `countryrequirements`[1]

#### Database
- **Type**: MongoDB (URI via `.env`)[2]
- **Collections**: 
  - `users` (User model)[1]
  - `questions` (Question model)[1]
  - `testsubmissions` (TestSubmission model)[1]
  - `countryrequirements` (CountryRequirement model)[1]
  - `visarequirements` (VisaRequirement model)[1]

#### Message Queues
- **Aucune queue formelle**: Communication synchrone REST[5]
- **Async pattern**: Génération briefing Perplexity API appelée via endpoint `/tests/briefing/:id`[5]

***

## Données

### Schéma de données

**User** (users collection)
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String,
  lastName: String,
  role: Enum['candidate', 'admin'],
  phone: String,
  nationality: String,
  createdAt: Date,
  updatedAt: Date
}
```


**Question** (questions collection)
```javascript
{
  _id: ObjectId,
  key: String (unique),
  label: String,
  text: String,
  category: String,
  type: Enum['number', 'boolean', 'single_choice', 'multi_choice', 'text'],
  options: [String],
  weight: Number,
  isRequired: Boolean,
  isActive: Boolean,
  order: Number,
  description: String,
  minSelections: Number,
  maxSelections: Number,
  min/max/step: Number,
  unit: String,
  createdAt: Date,
  updatedAt: Date
}
```


**TestSubmission** (testsubmissions collection)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  originCountry: String,
  destinationCountry: String,
  answers: Map<String, Any>,
  score: Number (0-100),
  status: Enum['completed', 'pending'],
  completedAt: Date,
  createdAt: Date
}
```


**CountryRequirement** (countryrequirements collection)
```javascript
{
  _id: ObjectId,
  country: {
    name: String,
    iso3: String,
    slug: String
  },
  source: {
    url: String,
    operator: String,
    last_scraped: Date,
    last_updated: Date
  },
  requirements: {
    financial: { min_monthly_eur, min_annual_eur, currency, proof_accepted },
    language: { tests_accepted, validity_months, exemptions },
    admission: { required, proof_types, official_portal },
    documents: { mandatory, optional },
    fees: { visa_fee_eur, service_fee_eur, payment_modes },
    processing: { average_delay_days, appointment_required, center },
    red_flags: Object
  },
  meta: {
    version: String,
    checksum: String,
    validated_by: String,
    last_patch: Date
  },
  history: [{ checksum, date }]
}
```


### Sources de données

- **Exigences visa**: Web scraping automatisé de sources officielles (gov.uk, canada.ca, Campus France, etc.)[1]
- **Questions d'éligibilité**: Modélisation interne basée sur critères publics internationaux[2]
- **Utilisateurs**: Saisie directe via formulaires d'inscription[5]

### Conformité RGPD

- **Minimisation**: Collecte limitée à email, nom, nationalité, réponses questionnaire[2]
- **Pseudonymisation**: Identifiants MongoDB, pas d'export nominatif pour analytics[2]
- **Consentement**: Inscription volontaire, mention explicite[2]
- **Stockage sécurisé**: Mots de passe hashés bcryptjs, pas de PII en logs[2]
- **Droits utilisateurs**: Suppression de tests possible via endpoint DELETE `/tests/:id`[4]
- **Aucun document sensible collecté**: Pas de passeport, scan ID, etc.[2]

***

## Intégrations

### APIs externes

**Google Gemini 2.0 Flash (Scraping)**
- **Usage**: Extraction structurée d'exigences visa depuis HTML[1]
- **Package**: `@google/genai` v1.29.0[3]
- **Configuration**: `GEMINI_API_KEY` en `.env`[3]
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`[2]
- **Rate limiting**: Pause 10s entre URLs, 30s entre pays[1]
- **Paramètres**: `temperature: 0.1`, `maxOutputTokens: 8192`, `tools: [{ googleSearch: {} }]`[2]

**Perplexity AI (Briefing)**
- **Usage**: Génération de briefings personnalisés post-test[5]
- **Package**: `@perplexity-ai/perplexity_ai` v0.16.0[3]
- **Configuration**: `PERPLEXITY_API_KEY` en `.env`[3]
- **Trigger**: Endpoint `/api/tests/briefing/:submissionId`[4]
- **Output**: Markdown formaté avec recommandations personnalisées[4]

### Authentification

- **Type**: JWT (JSON Web Tokens)[3]
- **Flow**: 
  1. POST `/api/auth/login` → retourne `{ token, user }`[4]
  2. Stockage LocalStorage frontend[5]
  3. Header `Authorization: Bearer <token>` pour endpoints protégés[5]
- **Expiration**: 7 jours (`JWT_EXPIRES_IN=7d`)[3]
- **Secret**: `JWT_SECRET` en variable `.env`[3]
- **Middlewares**: `requireAuth.js`, `requireAdmin.js`[2]

### Webhooks

Aucun webhook implémenté.[5][1]

***

## Modèles IA

### Google Gemini 2.0 Flash (Scraping)

**Fonction**: Extraction de données structurées depuis pages web officielles[1]

**Prompts**:
```javascript
Recherche sur le web les exigences officielles pour un visa étudiant pour ${country}.
Extrais et structure les informations suivantes depuis ${url}:
1. EXIGENCES FINANCIÈRES: Montant minimum, devise, preuves acceptées
2. EXIGENCES LINGUISTIQUES: Tests acceptés, niveaux, validité
3. ADMISSION: Obligatoire/non, types de preuves, portail officiel
4. DOCUMENTS OBLIGATOIRES ET OPTIONNELS
5. FRAIS: Visa fee, service fee, modes de paiement
6. TRAITEMENT: Délai moyen, rendez-vous, centre
7. RED FLAGS (drapeaux rouges)
RÉPONDS UNIQUEMENT AVEC UN OBJET JSON VALIDE suivant cette structure exacte: {...}
```


**Paramètres**:
- `temperature: 0.1` (extraction factuelle, pas de créativité)[1]
- `maxOutputTokens: 8192`[2]
- `tools: [{ googleSearch: {} }]` (grounding avec recherche web)[1]

**Limites**:
- Latence: ~10-15s par URL[1]
- Rate limiting: 10s pause entre URLs, 30s entre pays[1]
- Coût: ~$0.15-0.30 par run complet (19 pays × 3 URLs moy. × $0.0025/1K tokens)[1]
- Hallucinations: Mitigées par validation de structure JSON et comparaison checksums[1]

### Perplexity AI (Briefing personnalisé)

**Fonction**: Génération de briefing post-test avec recommandations contextuelles[5]

**Prompts**: (Non visible dans les fichiers fournis, probablement dans `briefingController.js`)

**Paramètres**: Non spécifiés dans les fichiers fournis[3]

**Limites**:
- Latence: ~3-5s par génération (estimation)[5]
- Coût: Variable selon modèle utilisé (Sonar/Claude-based)[3]
- Garde-fous: Disclaimer "score indicatif, ne remplace pas évaluation officielle"[2]

### Latence

| Opération | Latence |
|-----------|---------|
| Login/Register | ~200-500ms |
| Fetch questions | ~100-300ms |
| Submit test | ~500-800ms |
| Generate briefing (Perplexity) | ~3-5s |
| Scrape 1 URL (Gemini) | ~10-15s |
| Scrape full run (19 pays) | ~30-45min |

[5][1]

---

## Sécurité

### Gestion des secrets

- **Stockage**: Fichier `.env` (non versionné via `.gitignore`)[3]
- **Variables sensibles**:
  ```bash
  MONGODB_URI=<clé>
  JWT_SECRET=<clé>
  PERPLEXITY_API_KEY=<clé>
  GEMINI_API_KEY=<clé>
  ```

- **Chargement**: `require('dotenv').config()` au démarrage[2]
- **Jamais en dur**: Aucune clé codée en dur dans le code[2]

### Permissions et authentification

- **Middleware JWT**: Vérifie token + décode `userId` pour endpoints protégés[5]
- **Rôles**: `candidate` (défaut) et `admin`[3]
- **Endpoints admin**: Protégés par `requireAdmin.js` (vérifie `user.role === 'admin'`)[2]
- **Hashing mots de passe**: bcryptjs avec salt rounds[3]

### Protection PII

- **Pas de logs nominatifs**: Logs serveur ne contiennent pas de données utilisateur[2]
- **Pseudonymisation**: MongoDB ObjectId comme identifiant, détaché de l'identité pour analytics[2]
- **Aucun document sensible**: Pas de passeport, scan ID, relevés bancaires stockés[2]
- **Minimisation**: Collecte limitée aux champs strictement nécessaires[2]

### Chiffrement

- **En transit**: HTTPS (à configurer en production, dev = HTTP)[1]
- **Au repos**: MongoDB non chiffré par défaut (recommandé: activer encryption at rest en prod)[2]
- **Mots de passe**: Hashés bcryptjs (salt + hash), jamais en clair[3]

### Audit et dépendances

- **npm audit**: Recommandé en routine pour détecter vulnérabilités[2]
- **Dépendances vérifiées**: Toutes OSS avec licences MIT/Apache[2]

***

## Observabilité

### Logs

- **Console logs**: Emojis structurés (🚀 démarrage, 📡 API calls, ✅ succès, ❌ erreurs)[5]
- **Pas de logger tiers**: Pas de Winston/Bunyan implémenté[1]
- **Recommandation**: Intégrer Winston + log rotation en production[1]

### Métriques

- **Aucun système de métriques**: Pas de Prometheus/Grafana[1]
- **Recommandation**: Ajouter middleware Express pour tracker latences, taux d'erreur, throughput[1]

### Gestion des erreurs

- **Try-catch**: Tous les endpoints utilisent try-catch avec retours JSON explicites[5]
- **HTTP status codes**: 200 (succès), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)[5]
- **Messages d'erreur**: Retournés au frontend via `{ error: message }`[4]
- **Pas de monitoring**: Pas de Sentry/Rollbar intégré[1]

***

## Performances

### Latences cibles

| Endpoint | Target | Actuel |
|----------|--------|--------|
| GET `/api/questions` | <300ms | ~100-300ms |
| POST `/api/tests/submit` | <1s | ~500-800ms |
| POST `/api/tests/briefing/:id` | <5s | ~3-5s (Perplexity) |
| Scraping 1 pays | <5min | ~2-3min (3 URLs × 15s + pauses) |

[5][1]

### Coûts d'inférence

**Gemini 2.0 Flash (scraping)**:
- Coût/requête: ~$0.0025-0.005 (estimation 1K-2K tokens output)[1]
- Run complet (19 pays × 3 URLs): ~$0.15-0.30[1]
- Hebdomadaire: ~$1.20-1.50/mois[1]

**Perplexity AI (briefing)**:
- Coût/requête: Variable selon modèle (estimation $0.01-0.05)[3]
- Volume estimé: 10-100 briefings/jour → $3-150/mois[3]

**Total estimé**: ~$5-160/mois selon usage[3][1]

### Cache

- **Aucun cache implémenté**: Toutes les requêtes MongoDB en temps réel[1]
- **Recommandation**: Redis pour cacher questions (rarement modifiées) et country requirements (mis à jour hebdomadairement)[1]

***

## Risques

### Risques techniques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Rate limiting Gemini API** | Scraping incomplet | Pauses 10s/30s, retry logic, monitoring erreurs [1] |
| **Downtime MongoDB** | Indisponibilité totale | Ajouter replica set, backups automatiques [2] |
| **JWT secret leak** | Compromission auth | Rotation régulière, stockage sécurisé (Vault) [2] |
| **Hallucinations IA** | Données incorrectes | Validation JSON schema, checksums, disclaimer utilisateur [2] |
| **CORS misconfiguration** | Attaques XSS/CSRF | Limiter origine à domaine prod uniquement [2] |
| **Pas de logs centralisés** | Debug difficile en prod | Implémenter Winston + CloudWatch/Datadog [1] |

### Risques produit

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Données obsolètes** | Mauvaises recommandations | Scraping hebdomadaire + alertes si checksum change pas 1 mois [1] |
| **Biais algorithmique** | Discrimination involontaire | Auditer scoreCalculator, diversifier dataset, feedback utilisateurs [2] |
| **Effet d'autorité IA** | Utilisateurs prennent décisions sur IA seule | Disclaimer explicite "indicatif uniquement" [2] |
| **Scalabilité limitée** | Lenteur si 1000+ users simultanés | Load balancing, horizontal scaling, cache Redis [1] |

---

## Roadmap J+14 (Priorisée)

### 1. Implémenter cache Redis pour questions et country requirements
**Impact**: Réduction latence de 60-80% (100ms → 20ms), décharge MongoDB, améliore UX[1]

### 2. Ajouter monitoring et alerting (Sentry + Prometheus)
**Impact**: Détection proactive erreurs, métriques temps réel, améliore fiabilité prod[1]

### 3. Intégrer système de notifications (email/webhook) pour changements visa
**Impact**: Rétention utilisateurs, valeur ajoutée forte, différenciation concurrentielle[1]

### 4. Développer dashboard analytics admin (statistiques par pays, tendances)
**Impact**: Business intelligence, optimisation contenu, aide décision produit[1]

### 5. Sécuriser production (HTTPS, rate limiting, audit npm, encryption at rest)
**Impact**: Conformité RGPD renforcée, protection DDoS, réduction risques sécurité[2]

---

**Version**: 1.0  
**Date**: 11 novembre 2025  
**Auteur**: Melissa (HackSpice Team)  
**Contact**: [GitHub](https://github.com/melissaepitech/hackspice)
