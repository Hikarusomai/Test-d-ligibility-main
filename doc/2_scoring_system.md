# Système de Scoring - Test d'Éligibilité VISA

Documentation complète du système de calcul de score pour le test d'éligibilité VISA.

---

## 1. Principes fondamentaux

### 1.1 Formule globale

```
Score brut = Σ (points obtenus pour chaque question)
Score max possible = Σ (poids des questions scorées)
Score normalisé = (Score brut / Score max) × 100
```

**Score max du test VISA :** 118 points

### 1.2 Plage de scores et statuts

| Score normalisé | Statut | Signification |
|-----------------|--------|---------------|
| 80 - 100 | ELIGIBLE | Profil solide, forte chance d'obtenir le visa |
| 65 - 79 | MITIGE | Profil moyen, des points à améliorer |
| 50 - 64 | FAIBLE | Manque des critères importants |
| 0 - 49 | A_RISQUE | Risque élevé de refus |

---

## 2. Règles de scoring par type de question

### 2.1 Type : Choix unique avec règles explicites

Les points sont définis dans `scoringRules` pour chaque option.

**Exemple : Q4 - Historique visa**

```javascript
{
  label: "Avez-vous déjà obtenu/refusé un visa ?",
  weight: 10,
  options: ["Jamais", "Déjà obtenu", "Déjà refusé - motif corrigé", "Déjà refusé - non corrigé"],
  scoringRules: {
    "Jamais": 8,
    "Déjà obtenu": 10,
    "Déjà refusé - motif corrigé": 6,
    "Déjà refusé - non corrigé": 0
  }
}
```

**Calcul :**
```
Points bruts = scoringRules[réponse utilisateur]
Points finals = (Points bruts / 10) × weight

Exemple : "Jamais" → (8/10) × 10 = 8 points
           "Déjà obtenu" → (10/10) × 10 = 10 points
           "Déjà refusé - non corrigé" → (0/10) × 10 = 0 points + Hard Fail
```

**Questions concernées :**
- Q4 (historique visa) : poids 10
- Q5 (antécédents migratoires) : poids 10
- Q6 (casier judiciaire) : poids 5
- Q8 (admission) : poids 12
- Q9 (niveau langue) : poids 8
- Q12 (gaps académiques) : poids 3
- Q13 (cohérence projet) : poids 4
- Q16 (moyens mensuels) : poids 15
- Q19 (bourse) : poids 2

### 2.2 Type : Boolean

**Calcul simple :**
```javascript
if (réponse === true) {
  points = weight
} else {
  points = 0
}
```

**Questions concernées :**
- Q10 (relevés disponibles) : poids 3
- Q11 (preuve paiement) : poids 3
- Q14 (procédure officielle) : poids 5
- Q15 (intention études) : poids 5
- Q20 (garant) : poids 3

### 2.3 Type : Numérique avec comparaison dynamique

Le score dépend du ratio entre la valeur utilisateur et la valeur requise par le pays.

**Exemple : Q18 - Budget annuel**

```javascript
{
  label: "Montant total disponible pour la première année (€)",
  weight: 10,
  type: "number",
  scoringRules: "formula"
}
```

**Calcul :**
```
ratio = montantUtilisateur / montantRequisPays

if (ratio >= 1.0)       → 10 points (100% du poids)
else if (ratio >= 0.8)  → 6 points  (60% du poids)
else if (ratio >= 0.6)  → 3 points  (30% du poids)
else                    → 0 points + Hard Fail
```

**Montants requis par pays (exemples) :**
- France : 7 380€/an (615€/mois)
- Canada : 20 635€/an
- UK : 15 480€/an (1 290€/mois)

### 2.4 Type : Multi-choice avec cap

**Exemple : Q17 - Sources de financement**

```javascript
{
  label: "Source(s) des fonds",
  weight: 5,
  type: "multi_choice",
  options: [
    "Épargne personnelle",
    "Parent/tuteur avec justificatifs",
    "Bourse officielle",
    "Prêt étudiant approuvé",
    "Parrain légal documenté",
    "Autre avec preuves"
  ],
  scoringRules: "cap_5"
}
```

**Calcul :**
```javascript
sources = réponses utilisateur

if (sources incluent "Épargne personnelle" OU "Parent/tuteur" OU "Bourse") {
  points = 5  (score maximum)
}
else if (sources incluent "Prêt étudiant" OU "Parrain légal") {
  points = 3  (score moyen)
}
else {
  points = 1  (score minimum)
}
```

---

## 3. Points bloquants (Hard Fails)

Les hard fails sont des conditions qui provoquent un **échec automatique** quelle que soit la performance sur les autres questions.

### 3.1 Liste des hard fails

| Condition | Question | Impact |
|-----------|----------|--------|
| Refus de visa non corrigé | Q4 | Score plafonné à 40/100 |
| Antécédents migratoires graves | Q5 | Score plafonné à 40/100 |
| Casier judiciaire grave | Q6 | Score plafonné à 40/100 |
| Mineur sans autorisation parentale | Q3 + Q3bis | Score plafonné à 40/100 |
| Budget < 60% du requis | Q18 | Score plafonné à 40/100 |

### 3.2 Implémentation

```javascript
const hardFails = [];

// Q4 : Refus non corrigé
if (Q4 === "Déjà refusé - non corrigé") {
  hardFails.push("Refus de visa non corrigé");
}

// Q5 : Antécédents graves
if (Q5 === "Oui - grave") {
  hardFails.push("Antécédents migratoires graves");
}

// Q6 : Casier grave
if (Q6 === "Oui - grave") {
  hardFails.push("Casier judiciaire grave");
}

// Q3 + Q3bis : Mineur sans autorisation
if (Q3 === "Oui" && Q3bis === "Non") {
  hardFails.push("Absence d'autorisation parentale pour mineur");
}

// Q18 : Budget insuffisant
if (ratio < 0.6) {
  hardFails.push("Financement annuel insuffisant");
}

// Application du plafond
if (hardFails.length > 0) {
  score = Math.min(score, 40);
}
```

---

## 4. Poids des questions par catégorie

### 4.1 Répartition

| Catégorie | Questions | Poids total |
|-----------|-----------|-------------|
| Personnel | Q4, Q5, Q6 | 25 pts |
| Éducation | Q8, Q10, Q12 | 18 pts |
| Langue | Q9 | 8 pts |
| Projet | Q13, Q14, Q15 | 14 pts |
| Finance | Q16, Q17, Q18, Q20 | 38 pts |
| Info * | Q1, Q2, Q3, Q7, Q9bis, Q19 | 0 pts (non scorées) |
| **Total** | | **103 pts*** |

\* Le poids total réel dans le code est de 118 pts car certaines questions ont des calculs spécifiques.

### 4.2 Questions non scorées (informationnelles)

- **Q1** (Nationalité) : Pour identifier le profil
- **Q2** (Pays destination) : Pour récupérer les exigences pays
- **Q3** (Mineur) : Pour afficher Q3bis ou Q3ter
- **Q7** (Type programme) : Pour contexte
- **Q9bis** (Détails test langue) : Pour vérification humaine
- **Q19** (Bourse) : Pour information

---

## 5. Algorithme complet

### 5.1 Pseudo-code

```
FONCTION evaluateEligibility(réponses):
  score = 0
  maxScore = 0
  hardFails = []
  reasons = []

  // Récupérer exigences pays
  pays = getCountryRequirements(réponses.Q2)
  requisAnnuel = pays.requirements.financial.min_annual_eur

  // --- Questions scorées ---

  // Q4 : Historique visa
  score += getPointsFromRules(Q4, rules_visa, weight=10, max=10)
  IF Q4 == "Déjà refusé - non corrigé":
    hardFails.append("Refus de visa non corrigé")

  // Q5 : Antécédents migratoires
  score += getPointsFromRules(Q5, rules_migration, weight=10, max=10)
  IF Q5.contient("grave"):
    hardFails.append("Antécédents migratoires graves")

  // Q6 : Casier judiciaire
  score += getPointsFromRules(Q6, rules_casier, weight=5, max=5)
  IF Q6.contient("grave"):
    hardFails.append("Casier judiciaire grave")

  // Q7 : Type programme (non scoré)

  // Q8 : Admission
  score += getPointsFromRules(Q8, rules_admission, weight=12, max=12)

  // Q9 : Niveau langue
  score += getPointsFromRules(Q9, rules_langue, weight=8, max=8)

  // Q10 : Relevés (boolean)
  IF Q10 == true:
    score += 3
  maxScore += 3

  // Q11 : Preuve paiement (boolean)
  IF Q11 == true:
    score += 3
  maxScore += 3

  // Q12 : Gaps
  score += getPointsFromRules(Q12, rules_gaps, weight=3, max=3)

  // Q13 : Cohérence projet
  score += getPointsFromRules(Q13, rules_cohérence, weight=4, max=4)

  // Q14 : Procédure officielle (boolean)
  IF Q14 == true:
    score += 5
  maxScore += 5

  // Q15 : Intention études (boolean)
  IF Q15 == true:
    score += 5
  maxScore += 5

  // Q16 : Moyens mensuels
  score += getPointsFromRules(Q16, rules_moyens, weight=15, max=15)

  // Q17 : Sources financement (multi-choice)
  IF sources_fiables:
    score += 5
  ELSE IF sources_moyennes:
    score += 3
  ELSE:
    score += 1
  maxScore += 5

  // Q18 : Budget (numérique avec comparaison)
  ratio = Q18_montant / requisAnnuel
  IF ratio >= 1.0:
    score += 10
  ELSE IF ratio >= 0.8:
    score += 6
    reasons.append("Budget 80%+ du requis")
  ELSE IF ratio >= 0.6:
    score += 3
    reasons.append("Budget 60%+ du requis")
  ELSE:
    score += 0
    hardFails.append("Budget insuffisant")
  maxScore += 10

  // Q19 : Bourse (non scoré)

  // Q20 : Garant (boolean)
  IF Q20 == true:
    score += 3
  maxScore += 3

  // --- Normalisation ---
  scoreNormalisé = (score / maxScore) * 100

  // --- Application des hard fails ---
  IF hardFails.length > 0:
    scoreNormalisé = MIN(scoreNormalisé, 40)

  // --- Détermination du statut ---
  IF hardFails.length > 0:
    statut = "A_RISQUE"
  ELSE IF scoreNormalisé >= 80:
    statut = "ELIGIBLE"
  ELSE IF scoreNormalisé >= 65:
    statut = "MITIGE"
  ELSE IF scoreNormalisé >= 50:
    statut = "FAIBLE"
  ELSE:
    statut = "A_RISQUE"

  RETOURNER {
    score: scoreNormalisé,
    statut: statut,
    hardFails: hardFails,
    reasons: reasons
  }
```

---

## 6. Intégration dans MMS

### 6.1 Emplacement du code

**Fichier source :** `backend/utils/eligibilityEngine.js`

**Dans MMS :** Copier vers `backend/utils/visaEligibilityEngine.js`

### 6.2 Utilisation

```javascript
const { evaluateEligibility } = require('../utils/visaEligibilityEngine');

// Dans VisaController.submitTest
const result = await evaluateEligibility(answers);

// result contient :
// - normalizedScore : 0-100
// - status : 'ELIGIBLE' | 'MITIGE' | 'FAIBLE' | 'A_RISQUE'
// - hardFails : array des points bloquants
// - reasons : array des points à améliorer
```

### 6.3 Adaptations requises pour MMS

1. **Requêtes MongoDB** : Adapter pour utiliser les collections MMS
2. **Récupération des exigences pays** : Utiliser `country_requirements`
3. **Logger** : Utiliser le système de log MMS

---

## 7. Test du scoring

### 7.1 Cas de test

| Cas | Q4 | Q5 | Q6 | Q16 | Q18 | Score attendu |
|-----|----|----|----|----|----|---------------|
| Profil parfait | Déjà obtenu | Non | Non | Oui | 20000€ | ELIGIBLE |
| Budget faible | Jamais | Non | Non | Oui | 3000€ | A_RISQUE |
| Refus corrigé | Refusé - corrigé | Non | Non | Oui | 15000€ | MITIGE |
| Refus non corrigé | Refusé - non | Non | Non | Oui | 20000€ | A_RISQUE (hard fail) |

### 7.2 Script de vérification

```javascript
// test-scoring.js
const { evaluateEligibility } = require('./utils/eligibilityEngine');

async function testScoring() {
  const testCases = [
    {
      name: "Profil parfait",
      answers: { Q4: "Déjà obtenu", Q5: "Non", Q6: "Non", Q16: "Oui", Q18: 20000 }
    },
    // ... autres cas
  ];

  for (const test of testCases) {
    const result = await evaluateEligibility(test.answers);
    console.log(`${test.name}: ${result.score}% - ${result.status}`);
  }
}

testScoring();
```
