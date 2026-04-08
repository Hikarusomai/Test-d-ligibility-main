# HTG25 Alignment with VEM Logic

## Objective
Fully synchronize the scoring engine and question flow of HTG25 with the `visa_eligibility-master` (VEM) project.

## Key Logic to Follow from VEM

### 1. Scoring Ratios (Q18 - Budget)
| Ratio (Budget/Req) | Points |
| :--- | :--- |
| >= 1.0 | 10 |
| >= 0.8 | 6 |
| >= 0.6 | 3 |
| < 0.6 | 0 |

### 2. Difficulty Coefficient
The final score must be modulated by the destination country's difficulty:
`Final Score = Base Score * (2.0 - Difficulty Coefficient)`
- **France**: 1.2 (Modulator: 0.8)
- **USA**: 1.5 (Modulator: 0.5)
- **Canada**: 1.3 (Modulator: 0.7)

### 3. Status Thresholds
| Score Range | Status |
| :--- | :--- |
| >= 80 | ELIGIBLE (Vert) |
| 65 - 79 | MITIGE (Orange) |
| 50 - 64 | FAIBLE (Jaune) |
| < 50 | A_RISQUE (Rouge) |

### 4. Hard Fails & Caps
- Any "Hard Fail" (e.g., grave criminal record, insufficient budget < 60%) should cap the final score at **40/100**.

## Required Updates in HTG25

### Backend
- [ ] Update `eligibilityEngine.js` with the new ratios and difficulty modulation.
- [ ] Update `seed.js` to include difficulty coefficients in `CountryRequirement`.
- [ ] Align `buildSummary` with the new status thresholds.

### Frontend
- [ ] Ensure `ResultPage.tsx` correctly displays the status based on the new thresholds.
