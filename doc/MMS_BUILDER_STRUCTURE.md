# Structure du Backoffice MMS - Tests d'Éligibilité

**Format attendu pour l'intégration du test VISA**

---

## 1. Structure d'une question

```json
{
  "language": "fr",           // 🇫🇷 Langue de l'interface (pour le builder)
  "title": "Libellé FR",       // Texte de la question en français
  "title_en": "English text",  // Texte de la question en anglais
  "code": "Q_unique_key",      // Code unique de la question
  "score": 10,                // Poids (0-20) = Score max si bonne réponse
  "description": "Description FR",
  "description_en": "Description EN",
  "category": "personal",      // personal, education, language, project, finance
  "type": "single_choice",     // single_choice, multi_choice, boolean, number, text
  "options": [                // Options de réponse
    {
      "title": "Option FR",
      "title_en": "Option EN",
      "code": "OPT_01",
      "score": 10              // Points si cette option est choisie
    }
  ]
}
```

---

## 2. Types de questions supportés

| Type MMS | Description | Correspondance |
|----------|-------------|----------------|
| `single_choice` | Une seule réponse possible | Q4, Q5, Q6, Q8... |
| `multi_choice` | Plusieurs réponses possibles | Q17 (sources de financement) |
| `boolean` | Oui/Non | Q10, Q11, Q14, Q15, Q20 |
| `number` | Entrée numérique | Q18 (budget) |
| `text` | Texte libre | Q9bis (détails test langue) |

---

## 3. Catégories de questions

| Catégorie MMS | Description | Questions VISA |
|---------------|-------------|---------------|
| `personal` | Données personnelles | Q1, Q3-Q6 |
| `education` | Formation et académique | Q7, Q8, Q10, Q12 |
| `language` | Compétences linguistiques | Q9, Q9bis |
| `project` | Projet d'études | Q2, Q13-Q15 |
| `finance` | Financement et budget | Q16-Q20 |

---

## 4. Création du test VISA dans le backoffice

### Étape 1 : Créer le test

```
Eligibility Tests → Add Test
- Test Name: "Test d'Éligibilité VISA"
- Type: "Special" (nouveau type VISA à créer)
- Description: "Évaluation des chances d'obtenir un visa étudiant"
- Status: Active
```

### Étape 2 : Ajouter les questions via le Builder

Utiliser l'éditeur visuel pour ajouter chaque question avec :

1. **Language** : Sélectionner 🇫🇷 (le builder gère le multi-langue)
2. **Title** : Saisir le texte en français
3. **Title_en** : Saisir le texte en anglais
4. **Code** : Saisir le code unique (ex: Q4_visa_history)
5. **Score** : Saisir le poids (0-20)
6. **Description** : Description courte
7. **Category** : Choisir la catégorie
8. **Options** : Ajouter les options de réponse

### Étape 3 : Scoring Rules

Le scoring fonctionne ainsi :
- **score** de la question = points max si réponse parfaite
- **score** de chaque option = points accordés si cette option est choisie

**Exemple Q4 (Historique visa) - score: 10**
```
Option "Jamais" → score: 8
Option "Déjà obtenu" → score: 10
Option "Refusé - corrigé" → score: 6
Option "Refusé - non corrigé" → score: 0
```

---

## 5. Particularités du test VISA

### Questions avec logique conditionnelle

**Q3bis et Q3ter** : Affichage conditionnel
- Ces questions ne s'affichent que si Q3 (mineur) = "Oui" ou "Non"
- Dans MMS, utiliser les sections/étapes ou les champs conditionnels

**Q9bis** : Affichage conditionnel
- S'affiche seulement si Q9 (niveau langue) = "Oui"

### Question avec calcul dynamique (Budget Q18)

Le scoring de Q18 compare le montant saisi au minimum requis par le pays :

```javascript
// Dans le moteur de scoring
ratio = montantUtilisateur / montantRequisPays
if (ratio >= 1) points = 10
else if (ratio >= 0.8) points = 6
else if (ratio >= 0.6) points = 3
else points = 0 + HARD_FAIL
```

---

## 6. Mapping JSON → Format MMS

| JSON actuel | Format MMS Builder |
|-------------|-------------------|
| `label` | `title` + `title_en` |
| `key` | `code` |
| `weight` | `score` |
| `options` (array) | `options` (array of objects avec title/title_en/code/score) |
| `scoringRules` (object) | Scores dans chaque `option` |
| `isRequired` | Pas d'équivalent direct (question par défaut affichée) |

---

## 7. Checklist d'intégration

- [ ] Ajouter "VISA" comme nouveau Type dans le dropdown
- [ ] Créer le test "Test d'Éligibilité VISA"
- [ ] Ajouter les 23 questions via le Builder
- [ ] Configurer les scores de chaque question
- [ ] Configurer les options bilingues FR/EN
- [ ] Associer les Study Levels (Bac+3, Bac+4, Bac+5)
- [ ] Associer les Program Domains pertinents
- [ ] Tester le flow complet
