# HTG25 Project Refinement Plan (Updated)

This document outlines the tasks required to refine the HTG25 project by integrating missing questions and logic from the `visa_eligibility-master` (VEM) project, while preserving the existing high-quality UI (Map selection, etc.).

## Objective
Align HTG25 with the comprehensive 20-question flow and scoring logic of VEM, ensuring all edge cases (minors, language details, etc.) are covered.

## Current State Analysis
- **Nationality (Q1)**: Handled by `OriginCountryPage` (Map UI). Currently fetches `order: 1` from the API.
- **Destination (Q2)**: Handled by `DestinationCountryPage` (Selection UI). Currently fetches `order: 2` from the API.
- **Question Flow**: Starts at `order: 3` in `QuestionPage`.

### Missing or Misaligned Questions
Based on VEM `seedNewQuestions.ts`, the following are missing or need correction in HTG25:

1. **Q3: Êtes-vous mineur(e)? (Gating)** - Missing in HTG25 flow.
2. **Q3bis: Autorisation parentale (Conditional)** - Missing.
3. **Q3ter: Tranche d'âge (Conditional)** - Missing.
4. **Q7: Type de programme (Routing)** - Missing.
5. **Q9bis: Détails test langue (Conditional/Text)** - Missing.
6. **Scoring & Labels**: Existing questions in `seed.js` have misaligned labels (e.g., `order: 1` is labeled "Destination" but used for "Origin").

## Tasks

### 1. Backend Updates
- [x] **Correct `seed.js`**:
    - [x] Update `order: 1` to "Votre nationalité".
    - [x] Update `order: 2` to "Votre pays de destination".
    - [x] Add **Q3 (Mineur)**, **Q3bis (Autorisation)**, **Q3ter (Âge)**, **Q7 (Programme)**, and **Q9bis (Langue)**.
    - [x] Re-order all subsequent questions (Visa history, etc.) to follow the VEM sequence (total 20+ questions).
    - [x] Update weights and options to match VEM exactly.
    - [x] Fix capitalization and accent issues (e.g., "Déjà obtenu").
- [x] **Implement Gating Logic**: Ensure the backend scoring/briefing logic handles "Elimination" conditions (e.g., grave criminal record).
- [x] **Fix AI Hallucinations**: Pass user answers to Perplexity to prevent made-up details.
- [x] **Docker Fixes**: Fix MongoDB connection and re-seed inside container.

### 2. Frontend Updates
- [x] **Update `App.tsx`**:
    - [x] Ensure `currentQuestionOrder` starts at 3 after Destination selection.
    - [x] Implement logic to handle conditional questions (e.g., skip Q3bis if not minor).
- [x] **Update `QuestionPage.tsx`**:
    - [x] Support the `conditionalDisplay` field (logic implemented in `App.tsx`).
    - [x] Implement "Gating" UI: If a response triggers an elimination, show a "Not Eligible" message instead of continuing.
- [x] **Sync Data**: Update `origin-countries.ts` and `destination-countries.ts` to match the comprehensive lists in VEM.

## Verification Plan
- [x] Verify Map UI shows "Votre nationalité" (fetched from `order: 1`).
- [x] Verify Destination UI shows "Votre pays de destination" (fetched from `order: 2`).
- [x] Walk through the flow as a minor and verify Q3bis appears.
- [x] Walk through the flow as an adult and verify Q3ter appears instead.
- [x] Verify the final score calculation matches VEM (including Difficulty Coeff).
