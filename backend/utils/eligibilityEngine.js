const Question = require('../models/Question');
const CountryRequirement = require('../models/CountryRequirement');

function escapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(str) {
  return String(str || '').toLowerCase().trim().replace(/\s+/g, '-');
}

function buildSummary(status, score, dest, hardFails, reasons) {
  if (status === 'ELIGIBLE') {
    return `Profil favorable (${score}%). Dossier globalement aligné avec les attentes pour ${dest || 'le pays ciblé'}.`;
  }
  if (status === 'MITIGE') {
    return `Profil intermédiaire (${score}%). Points à renforcer : ${reasons.slice(0, 3).join(' ; ')}.`;
  }
  if (status === 'A_RISQUE') {
    return `Profil à risque (${score}%). Points bloquants : ${hardFails.join(' ; ')}.`;
  }
  if (status === 'FAIBLE') {
    return `Profil faible (${score}%). Plusieurs critères majeurs ne sont pas satisfaits : ${reasons.slice(0, 3).join(' ; ')}.`;
  }
  return `Informations incomplètes.`;
}

async function evaluateEligibility(rawAnswers) {
  const questionIds = rawAnswers.map(a => a.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });

  const qById = {};
  questions.forEach(q => {
    qById[q._id.toString()] = q;
  });

  const answersByKey = {};
  rawAnswers.forEach(a => {
    const q = qById[a.questionId];
    if (!q) return;
    const key = q.key;
    let value = a.value;
    if (q.type === 'number') value = Number(value);
    if (q.type === 'boolean' && typeof value !== 'boolean') {
      value = value === 'true' || value === true || value === 1 || value === '1';
    }
    answersByKey[key] = value;
  });

  const dest = answersByKey.destination_country || answersByKey.Q2_destination_country;
  const origin = answersByKey.origin_country || answersByKey.Q1_nationality;
  let countryDoc = null;

  if (dest) {
    countryDoc = await CountryRequirement.findOne({
      $or: [
        { 'country.name': new RegExp(`^${escapeRegex(dest)}$`, 'i') },
        { 'country.nameEn': new RegExp(`^${escapeRegex(dest)}$`, 'i') },
        { 'country.slug': new RegExp(`^${escapeRegex(slugify(dest))}$`, 'i') },
        { 'country.iso3': new RegExp(`^${escapeRegex(dest)}$`, 'i') }
      ]
    });
  }

  const hardFails = [];
  const reasons = [];
  let score = 0;
  let maxScore = 0;

  function add(part, max, reason) {
    maxScore += max;
    score += part;
    if (reason && part < max) reasons.push(reason);
  }

  // Q3 & Q3bis: Gating for Minors
  const isMinor = String(answersByKey.Q3_is_minor || '').toLowerCase();
  // French: "Oui", "Non" / English: "Yes", "No"
  if (isMinor === "oui" || isMinor === "yes") {
    const parentalConsent = String(answersByKey.Q3bis_parental_consent || '').toLowerCase();
    if (parentalConsent === "non" || parentalConsent === "no") {
      hardFails.push("Absence d'autorisation parentale ou d'hébergement pour mineur");
    }
  }

  // Q4: Visa History
  if (answersByKey.Q4_visa_history !== undefined) {
    const v = String(answersByKey.Q4_visa_history || '').toLowerCase();
    const max = 10;
    // French: "jamais", "déjà obtenu", "déjà refusé - motif corrigé", "déjà refusé - non corrigé"
    // English: "never", "already obtained", "already refused - reason corrected", "already refused - reason not corrected"
    if (v === "jamais" || v === "never") add(8, max);
    else if (v === "déjà obtenu" || v === "already obtained") add(10, max);
    else if (v === "déjà refusé - motif corrigé" || v === "already refused - reason corrected") add(6, max, "Ancien refus corrigé.");
    else if (v === "déjà refusé - non corrigé" || v === "already refused - reason not corrected") {
      add(0, max, "Refus non corrigé.");
      hardFails.push("Refus de visa non corrigé");
    } else add(0, max);
  }

  // Q5: Migration Issues
  if (answersByKey.Q5_migration_issues !== undefined) {
    const v = String(answersByKey.Q5_migration_issues || '').toLowerCase();
    const max = 10;
    // French: "non", "Oui - léger", "Oui - grave"
    // English: "no", "Yes - minor", "Yes - serious"
    if (v === "non" || v === "no") add(10, max);
    else if (v.includes("léger") || v.includes("minor")) add(5, max, "Antécédent migratoire mineur.");
    else if (v.includes("grave") || v.includes("serious")) {
      add(0, max, "Antécédents migratoires graves.");
      hardFails.push("Antécédents migratoires graves");
    } else add(0, max);
  }

  // Q6: Criminal Record
  if (answersByKey.Q6_criminal_record !== undefined) {
    const v = String(answersByKey.Q6_criminal_record || '').toLowerCase();
    const max = 5;
    // French: "non", "Oui - mineur", "Oui - grave"
    // English: "no", "Yes - minor", "Yes - serious"
    if (v === "non" || v === "no") add(5, max);
    else if (v.includes("mineur") || v.includes("minor")) add(2, max, "Casier mineur.");
    else if (v.includes("grave") || v.includes("serious")) {
      add(0, max, "Casier grave.");
      hardFails.push("Casier judiciaire grave");
    } else add(0, max);
  }

  // Q8: Admission Status
  if (answersByKey.Q8_admission_status !== undefined) {
    const v = String(answersByKey.Q8_admission_status || '').toLowerCase();
    const max = 12;
    // French: "admission définitive", "pré-admission avec conditions réalistes", "non"
    // English: "definitive admission", "conditional admission with realistic conditions", "no"
    if (v === "admission définitive" || v === "definitive admission") add(12, max);
    else if (v === "pré-admission avec conditions réalistes" || v === "conditional admission with realistic conditions") add(8, max, "Pré-admission uniquement.");
    else if (v === "non" || v === "no") add(0, max, "Pas encore admis.");
    else add(0, max);
  }

  // Q9: Language Level
  if (answersByKey.Q9_language_level_status !== undefined) {
    const v = String(answersByKey.Q9_language_level_status || '').toLowerCase();
    const max = 8;
    // French: "Oui - au niveau exigé ou +", "Oui - légèrement inférieur"
    // English: "Yes - at required level or higher", "Yes - slightly below required"
    if (v.includes("oui") || v.includes("yes")) add(8, max);
    else if (v.includes("inférieur") || v.includes("below") || v.includes("lower")) add(4, max, "Test limite ou expiré.");
    else if (v === "non" || v === "no") add(0, max, "Pas de preuve de langue.");
    else add(0, max);
  }

  // Q10: Transcripts
  if (answersByKey.Q10_transcripts_available !== undefined) {
    const max = 3;
    add(answersByKey.Q10_transcripts_available ? 3 : 0, max, "Relevés manquants.");
  }

  // Q11: Tuition Payment
  if (answersByKey.Q11_tuition_payment_proof !== undefined) {
    const max = 3;
    add(answersByKey.Q11_tuition_payment_proof ? 3 : 0, max, "Preuve de paiement manquante.");
  }

  // Q12: Gaps Justified
  if (answersByKey.Q12_gaps_justified !== undefined) {
    const v = String(answersByKey.Q12_gaps_justified || '').toLowerCase();
    const max = 3;
    // French: "oui", "n/a - aucun gap", "non"
    // English: "yes", "n/a - no gap", "no"
    if (v === "oui" || v === "yes") add(3, max);
    else if (v.includes("n/a") || v.includes("no gap")) add(3, max);
    else add(0, max, "Gaps non justifiés.");
  }

  // Q13: Project Coherence
  if (answersByKey.Q13_project_coherence !== undefined) {
    const v = String(answersByKey.Q13_project_coherence || '').toLowerCase();
    const max = 4;
    // French: "oui", "partiel", "non"
    // English: "yes", "partial", "no"
    if (v === "oui" || v === "yes") add(4, max);
    else if (v === "partiel" || v === "partial") add(2, max, "Projet partiellement cohérent.");
    else if (v === "non" || v === "no") add(0, max, "Projet peu cohérent.");
    else add(0, max);
  }

  // Q14: Official Process
  if (answersByKey.Q14_official_process_started !== undefined) {
    const max = 5;
    add(answersByKey.Q14_official_process_started ? 5 : 0, max, "Procédure officielle non engagée.");
  }

  // Q15: Main Intent
  if (answersByKey.Q15_main_intent_study !== undefined) {
    const max = 5;
    add(answersByKey.Q15_main_intent_study ? 5 : 0, max, "Intention principale floue.");
  }

  // Q16: Monthly Means
  if (answersByKey.Q16_monthly_means_ratio !== undefined) {
    const v = String(answersByKey.Q16_monthly_means_ratio || '').toLowerCase();
    const max = 15;
    // Accept both French ("oui"/"non") and English ("yes"/"no") values
    const isYes = v === "oui" || v === "yes" || v === "true";
    add(isYes ? 15 : 0, max, "Moyens mensuels insuffisants.");
  }

  // Q17: Funding Sources (Multi-choice)
  if (Array.isArray(answersByKey.Q17_funding_sources)) {
    const src = answersByKey.Q17_funding_sources.map(s => String(s || '').toLowerCase());
    const max = 5;
    let s = 0;
    // French: "Épargne personnelle", "Aide parentale", "Bourse", "Prêt étudiant", "Sponsor légal documenté"
    // English: "Personal savings", "Parental support", "Scholarship", "Student loan", "Documented legal sponsor"
    if (src.some(val => val.includes("épargne") || val.includes("savings") || val.includes("parent") || val.includes("bourse") || val.includes("scholarship"))) {
      s = 5;
    } else if (src.some(val => val.includes("prêt") || val.includes("loan") || val.includes("parrain") || val.includes("sponsor"))) {
      s = 3;
    } else {
      s = 1;
    }
    add(s, max, s < 5 ? "Sources de financement fragiles." : null);
  }

  const userAmount = Number(answersByKey.Q18_first_year_amount_eur || 0);
  const financialReq = countryDoc && countryDoc.requirements && countryDoc.requirements.financial
    ? countryDoc.requirements.financial
    : {};
  let requiredAnnual = financialReq.min_annual_eur || 10000; // Default if not found

  if (answersByKey.Q18_first_year_amount_eur !== undefined) {
    const max = 10;
    const r = userAmount / requiredAnnual;
    if (r >= 1) add(10, max);
    else if (r >= 0.8) add(6, max, "Montant sous le seuil (80%+).");
    else if (r >= 0.6) add(3, max, "Montant insuffisant (60%+).");
    else {
      add(0, max, "Montant très insuffisant (<60%).");
      hardFails.push("Financement annuel insuffisant");
    }
  }

  // Q19: Scholarship Proof
  if (answersByKey.Q19_scholarship_proof !== undefined) {
    const v = String(answersByKey.Q19_scholarship_proof || '').toLowerCase();
    const max = 2;
    // French: "oui", "non" / English: "yes", "no"
    if (v === "oui" || v === "yes") add(2, max);
    else add(0, max);
  }

  // Q20: Sponsor Commitment
  if (answersByKey.Q20_sponsor_commitment !== undefined) {
    const max = 3;
    add(answersByKey.Q20_sponsor_commitment ? 3 : 0, max, "Garant non documenté.");
  }

  let normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  // --- DIFFICULTY COEFFICIENT MODULATION (VEM Logic) ---
  if (countryDoc && countryDoc.requirements && countryDoc.requirements.difficulty_coefficient) {
    const coeff = countryDoc.requirements.difficulty_coefficient;
    // Formula: final = base × (2.0 - coefficient)
    normalizedScore = Math.round(normalizedScore * (2.0 - coeff));
  }

  // --- PUNITION SÉVÈRE POUR LES POINTS BLOQUANTS ---
  if (hardFails.length > 0) {
    // Si point bloquant, le score ne peut pas dépasser 40/100
    normalizedScore = Math.min(normalizedScore, 40);
  } else if (normalizedScore > 50 && (reasons.some(r => r.includes("insuffisant")) || reasons.some(r => r.includes("Pas encore admis")))) {
    // Si des points majeurs manquent mais ne sont pas des hardFails, on réduit le score
    normalizedScore = Math.min(normalizedScore, 65);
  }

  // --- STATUS THRESHOLDS ALIGNED WITH VEM ---
  let status = 'INCOMPLETE';
  if (hardFails.length) status = 'A_RISQUE';
  else if (normalizedScore >= 80) status = 'ELIGIBLE';
  else if (normalizedScore >= 65) status = 'MITIGE';
  else if (normalizedScore >= 50) status = 'FAIBLE';
  else if (normalizedScore > 0) status = 'A_RISQUE';

  const summary = buildSummary(status, normalizedScore, dest, hardFails, reasons);

  return {
    normalizedScore,
    status,
    summary,
    normalizedAnswers: [],
    details: {
      rawScore: score,
      maxScore,
      hardFails,
      reasons,
      destination: dest,
      countryMatched: !!countryDoc
    }
  };
}
module.exports = { evaluateEligibility };
