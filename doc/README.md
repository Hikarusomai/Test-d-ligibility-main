# Documentation - Module Test d'Éligibilité VISA

Documentation technique pour l'intégration du module VISA dans MatchMySchool Backoffice.

---

## Structure de la documentation

| Fichier | Description |
|---------|-------------|
| `../HANDOVER.md` | Documentation principale de transfert |
| `1_architecture_migration.md` | Architecture et migration de la DB |
| `2_scoring_system.md` | Système de scoring détaillé |
| `3_visa_integration_mms.md` | Guide d'intégration dans MMS |
| `MMS_BUILDER_STRUCTURE.md` | **Structure du Backoffice MMS** (format Builder) |
| `COMPLETE_VISA_QUESTIONS.json` | Questions complètes pour la DB |
| `visa_questions_dump.json` | Dump des questions existantes |

---

## Aperçu rapide

### Le module en 3 points

1. **Test d'éligibilité** : 23 questions pour évaluer les chances d'obtenir un visa étudiant
2. **Scraper automatique** : Récupère les exigences officielles des pays via Gemini API
3. **Briefing IA** : Génère des conseils personnalisés avec Perplexity API

### Différences avec le test MMS actuel

| Aspect | Test MMS | Module VISA |
|--------|----------|-------------|
| Scoring | 100% mathématique | Math + IA |
| Questions | Fixe | Dynamique + texte libre |
| Budget | Valeur fixe | Texte libre (à adapter) |
| Source données | Statique | Scraper live |
| Chatbot | Non | Oui |

---

## Points critiques à connaître

### 1. Scoring avec hard fails

Si l'utilisateur a un "point bloquant" (refus visa non corrigé, antécédents graves...), le score est **plafonné à 40/100**.

### 2. Budget comparé aux exigences pays

Le Q18 (budget) n'est pas noté de façon fixe. Il est comparé au minimum requis pour le pays cible (ex: 615€/mois pour la France).

### 3. Questions textuelles non scorées

- Q1 (nationalité) : informationnel
- Q2 (pays destination) : pour le scraping
- Q3 (mineur) : pour les questions conditionnelles
- Q7 (type programme) : informationnel
- Q9bis (détails test) : informationnel

### 4. Limitations à implémenter

- **3 tests par semaine** par utilisateur
- **10 tests par mois** par utilisateur
- **100 questions chatbot** par utilisateur

---

## Démarrage rapide

### 1. Cloner et installer

```bash
cd backend && npm install
cd ../serveur && npm install
cd ../frontend && npm install
```

### 2. Variables d'environnement

```env
# Backend
MONGODB_URI=...
JWT_SECRET=...
PERPLEXITY_API_KEY=...

# Scraper
GEMINI_API_KEY=...
MONGODB_URI=...
```

### 3. Démarrer les services

```bash
# Backend (port 3000)
cd backend && npm start

# Scraper (port 3001)
cd serveur && npm start

# Frontend (port 5173)
cd frontend && npm run dev
```

---

## Prochaines étapes

Pour l'intégration MMS, lisez dans l'ordre :

1. `HANDOVER.md` - Vue d'ensemble complète
2. `1_architecture_migration.md` - Comment migrer la DB
3. `2_scoring_system.md` - Comprendre le scoring
4. `3_visa_integration_mms.md` - Intégration pas à pas

---

## Support

Pour des questions techniques :
- Voir le code source dans `backend/`, `serveur/`, `frontend/`
- Consulter les JSON dans `doc/`
- Lire `HANDOVER.md` pour les détails
