# NOTICE TECHNIQUE
## Module Test d'Éligibilité VISA - Intégration MatchMySchool

---

**Document technique à destination de l'équipe de développement MatchMySchool**

**Version :** 1.0
**Date :** 08 avril 2026
**ID Perplexity :** À fournir par email

---

## Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Architecture technique](#2-architecture-technique)
3. [Système de scoring](#3-système-de-scoring)
4. [Scraper d'exigences pays](#4-scraper-dexigences-pays)
5. [Génération de briefings IA](#5-génération-de-briefings-ia)
6. [Limitations et quotas](#6-limitations-et-quotas)
7. [Intégration base de données](#7-intégration-base-de-données)
8. [Points d'attention](#8-points-dattention)
9. [Checklist d'intégration](#9-checklist-dintégration)

---

## 1. Contexte et objectifs

### 1.1 Pourquoi ce module ?

Le module "Test d'Éligibilité VISA" permet aux étudiants internationaux d'évaluer leurs chances d'obtenir un visa étudiant pour différents pays (France, Canada, USA, UK, etc.).

### 1.2 Langue des questions ⚠️

**IMPORTANT :** Les questions doivent être **bilingues (FR + EN)** comme le test d'admission existant MatchMySchool. Le backoffice doit permettre l'édition dans les deux langues (champs `label_fr`, `label_en`, `options_fr`, `options_en`).

### 1.3 Différences avec le test MMS existant

| Caractéristique | Test MMS actuel | Module VISA |
|-----------------|-----------------|-------------|
| Scoring | 100% mathématique | Mixte (math + IA pour briefing) |
| Questions | À choix fixes | Choix + entrées texte + numériques |
| Budget | Valeur fixe | Comparaison avec seuils pays |
| Sources de données | Statiques | Scraper dynamique |
| Chatbot | Non | Oui (limité) |
| Base de données | MMS | Séparée (à migrer) |

---

## 2. Architecture technique

### 2.1 Composants

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                           │
│  - Page de test                                             │
│  - Page de résultats                                        │
│  - Chatbot                                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend API (Express/Node)                                 │
│  - VisaController (test, briefing)                          │
│  - EligibilityEngine (scoring)                              │
│  - ChatbotController (quota)                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Scraper Service (Gemini API)                               │
│  - Récupération exigences pays                              │
│  - Stockage dans country_requirements                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MongoDB MMS                                                │
│  - users (étendu avec quotas)                               │
│  - eligibilitytests (avec testType: "VISA")                 │
│  - eligibilityassessments (avec testType: "VISA")           │
│  - country_requirements (nouveau)                           │
│  - chatbot_logs (nouveau)                                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Fichiers clés

| Fichier | Description |
|---------|-------------|
| `backend/controllers/testController.js` | Logique de soumission et briefing |
| `backend/utils/eligibilityEngine.js` | Moteur de scoring |
| `serveur/server.js` | Scraper avec Gemini API |
| `docs/COMPLETE_VISA_QUESTIONS.json` | Questions complètes |

---

## 3. Système de scoring

### 3.1 Formule

```
Score normalisé = (Score brut / Score max) × 100
```

**Score max théorique :** 100 points

### 3.2 Règles par type de question

**Choix avec règles explicites :**
```
Points = (scoringRules[réponse] / échelle) × weight
```

**Boolean :**
```
Points = weight si true, 0 si false
```

**Numérique (budget) :**
```
ratio = montantUtilisateur / montantRequisPays
Points = 10 si ratio ≥ 1
       = 6  si ratio ≥ 0.8
       = 3  si ratio ≥ 0.6
       = 0  + Hard Fail si ratio < 0.6
```

### 3.3 Seuils de statut

| Score | Statut | Couleur |
|-------|--------|---------|
| ≥ 80% | ELIGIBLE | Vert |
| 65-79% | MITIGE | Orange |
| 50-64% | FAIBLE | Jaune |
| < 50% | A_RISQUE | Rouge |

### 3.4 Hard Fails (échecs automatiques)

- Refus de visa non corrigé
- Antécédents migratoires graves
- Casier judiciaire grave
- Mineur sans autorisation parentale
- Budget < 60% du requis

**Impact :** Score plafonné à 40/100

---

## 4. Scraper d'exigences pays

### 4.1 Fonctionnement

Le scraper utilise **Google Gemini 2.0 Flash** pour extraire les exigences depuis les sites officiels.

### 4.2 Pays couverts

USA, Canada, Australie, UK, France, Allemagne, Espagne, Italie, Finlande, Irlande, Danemark, Norvège, Suède, Pologne, Malte, Belgique, Chine, Turquie, Corée du Sud

### 4.3 Données extraites

```json
{
  "financial": {
    "min_monthly_eur": 615,
    "min_annual_eur": 7380
  },
  "language": {
    "tests_accepted": [{"name": "DELF", "level": "B2"}]
  },
  "admission": {
    "required": true
  },
  "documents": {
    "mandatory": ["Passeport", "Assurance"]
  },
  "fees": {
    "visa_fee_eur": 99
  }
}
```

### 4.4 Prompt Gemini

Le prompt est structuré pour extraire uniquement les données pertinentes au format JSON.

---

## 5. Génération de briefings IA

### 5.1 API utilisée

**Perplexity AI** (modèles `sonar-pro` ou `sonar-32k-online`)

### 5.2 Données fournies à l'IA

- Score global et statut
- Réponses du candidat
- Exigences officielles du pays de destination
- Points bloquants et points à améliorer

### 5.3 Structure du briefing

```
## Résumé du profil
## Points forts
## Points à améliorer
## Recommandations clés
```

---

## 6. Limitations et quotas

### 6.1 Limites du test VISA

| Période | Limite | Message |
|---------|--------|---------|
| Semaine | 3 tests | "Il vous reste X tests cette semaine" |
| Mois | 10 tests | "Limite mensuelle atteinte" |

### 6.2 Limite du chatbot

| Limite | Message d'avertissement |
|--------|------------------------|
| 100 questions/user | "Plus que X questions disponibles" (à 10 restantes) |

### 6.3 Stockage des quotas

Dans le document User :
```json
{
  "visa_test_limits": {
    "weekly_count": 2,
    "weekly_reset": "2026-04-14",
    "monthly_count": 8,
    "monthly_reset": "2026-05-01"
  },
  "chatbot_quota": {
    "used": 95,
    "limit": 100
  }
}
```

---

## 7. Intégration base de données

### 7.1 Collections à modifier/créer

| Collection | Action |
|------------|--------|
| `users` | Ajouter `visa_test_limits`, `chatbot_quota` |
| `eligibilitytests` | Ajouter `testType: "VISA"` |
| `eligibilityassessments` | Ajouter `testType: "VISA"` |
| `country_requirements` | Créer |
| `chatbot_logs` | Créer |

### 7.2 Script d'insertion des questions

```javascript
db.eligibilitytests.insertOne({
  name: "Test d'Éligibilité VISA",
  testType: "VISA",
  isActive: true,
  questions: [// ... COMPLETE_VISA_QUESTIONS.json]
});
```

---

## 8. Points d'attention

### 8.1 Budget texte

Q18 est un champ **numérique** dans le JSON mais peut recevoir du texte. Prévoir une validation.

### 8.2 Test langue

Q9bis est un texte libre ("DELF B2 - 72/100"). Pas de scoring automatique.

### 8.3 UI à recréer

L'UI actuelle ne correspond pas au style MMS. Prévoir une refonte complète.

### 8.4 Authentification

**Ne pas recréer** un système d'auth. Utiliser celui existant dans MMS.

---

## 9. Checklist d'intégration

### Backend
- [ ] Créer les collections DB
- [ ] Étendre le schéma User
- [ ] Créer VisaController
- [ ] Intégrer EligibilityEngine
- [ ] Configurer le scraper
- [ ] Implémenter les quotas

### Frontend
- [ ] Créer l'onglet VISA dans le backoffice
- [ ] Créer la page de test
- [ ] Afficher les résultats
- [ ] Messages de quota

### Tests
- [ ] Scoring correct
- [ ] Briefing IA
- [ ] Quotas
- [ ] Scraper
- [ ] End-to-end

---

## Annexes

### A. Variables d'environnement

```env
GEMINI_API_KEY=xxx
PERPLEXITY_API_KEY=xxx
VISA_TEST_WEEKLY_LIMIT=3
VISA_TEST_MONTHLY_LIMIT=10
CHATBOT_QUOTA_PER_USER=100
```

### B. API Endpoints

```
POST /api/visa/test/submit    - Soumettre le test
GET  /api/visa/test/my        - Liste de mes tests
GET  /api/visa/test/:id       - Détails d'un test
GET  /api/visa/briefing/:id   - Générer le briefing IA
POST /api/visa/chatbot/ask    - Poser une question
```

### C. Support technique

Pour toute question, consultez :
- `HANDOVER.md` - Documentation principale
- `doc/1_architecture_migration.md` - Migration DB
- `doc/2_scoring_system.md` - Scoring détaillé
- `doc/3_visa_integration_mms.md` - Intégration pas à pas

---

**Fin de la notice technique**

*ID Perplexity : À fournir par email pour activation des API*
