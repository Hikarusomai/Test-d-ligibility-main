# Visa Eligibility Scoring System

The Visa test uses a weighted scoring system to determine the student's eligibility status.

## 1. Weighting Mechanism
Each question has a weight (0-20). Points are calculated based on the answer type:
- **Number**: Proportional to the range [min, max].
- **Choices**: Fixed points defined in scoringRules.
- **Text**: Based on length and keyword density (Gemini-verified).

## 2. Status Thresholds
| Score Range | Status | Result Meaning |
|-------------|--------|----------------|
| 85 - 100    | ELIGIBLE | Strong application, high chance of success. |
| 65 - 84     | MITIGE | Good potential but some red flags present. |
| 40 - 64     | FAIBLE | Missing major requirements (e.g., funds). |
| < 40        | A_RISQUE | High risk of rejection. |
