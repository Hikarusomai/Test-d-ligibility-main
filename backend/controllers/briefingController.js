const TestSubmission = require('../models/TestSubmission');
const CountryRequirement = require('../models/CountryRequirement');

exports.generateBriefing = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Récupérer la soumission du test
    const submission = await TestSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Soumission non trouvée' });
    }

    // Récupérer les exigences des pays
    const originCountry = await CountryRequirement.findOne({ 
      'country.name': submission.originCountry 
    });
    const destinationCountry = await CountryRequirement.findOne({ 
      'country.name': submission.destinationCountry 
    });

    // Analyser le score et les réponses
    const analysis = analyzeSubmission(submission, originCountry, destinationCountry);
    
    // Générer le briefing
    const briefing = generateBriefingText(analysis);

    res.json({
      score: submission.score,
      analysis,
      briefing,
      recommendations: generateRecommendations(analysis)
    });

  } catch (error) {
    console.error('Erreur génération briefing:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

function analyzeSubmission(submission, originCountry, destinationCountry) {
  const answers = submission.answers;
  
  return {
    score: submission.score,
    originCountry: submission.originCountry,
    destinationCountry: submission.destinationCountry,
    
    // Analyse financière
    financial: {
      hasProofOfFunds: answers.question_11 === true,
      monthlyBudget: answers.question_17 || [],
      needsFinancialAid: answers.question_10 === true,
      requirements: destinationCountry?.requirements?.financial
    },
    
    // Analyse linguistique
    language: {
      testsTaken: answers.question_17?.filter(t => t.includes('test')) || [],
      requirements: destinationCountry?.requirements?.language
    },
    
    // Analyse admission
    admission: {
      hasAcceptanceLetter: answers.question_12 === true,
      requirements: destinationCountry?.requirements?.admission
    },
    
    // Points forts et faibles
    strengths: identifyStrengths(answers, submission.score),
    weaknesses: identifyWeaknesses(answers, submission.score, destinationCountry)
  };
}

function identifyStrengths(answers, score) {
  const strengths = [];
  
  if (score >= 80) strengths.push('Excellent profil général');
  if (answers.question_11 === true) strengths.push('Preuve de fonds disponible');
  if (answers.question_12 === true) strengths.push('Lettre d\'acceptation obtenue');
  if (answers.question_20 === true) strengths.push('Assurance santé en place');
  
  return strengths;
}

function identifyWeaknesses(answers, score, destinationCountry) {
  const weaknesses = [];
  
  if (score < 50) weaknesses.push('Score global faible - préparation insuffisante');
  if (answers.question_11 === false) weaknesses.push('Preuve de fonds manquante');
  if (answers.question_12 === false) weaknesses.push('Pas encore d\'acceptation universitaire');
  if (!answers.question_17 || answers.question_17.length === 0) {
    weaknesses.push('Aucun test de langue passé');
  }
  
  return weaknesses;
}

function generateBriefingText(analysis) {
  let briefing = `# Briefing personnalisé pour votre projet d'études\n\n`;
  
  briefing += `## Votre profil\n`;
  briefing += `**Score global:** ${analysis.score}/100\n`;
  briefing += `**Pays d'origine:** ${analysis.originCountry}\n`;
  briefing += `**Pays de destination:** ${analysis.destinationCountry}\n\n`;
  
  briefing += `## Points forts identifiés\n`;
  analysis.strengths.forEach(s => briefing += `✅ ${s}\n`);
  briefing += `\n`;
  
  if (analysis.weaknesses.length > 0) {
    briefing += `## Points à améliorer\n`;
    analysis.weaknesses.forEach(w => briefing += `⚠️ ${w}\n`);
    briefing += `\n`;
  }
  
  briefing += `## Analyse par catégorie\n\n`;
  
  // Financier
  briefing += `### 💰 Situation financière\n`;
  if (analysis.financial.hasProofOfFunds) {
    briefing += `Vous disposez d'une preuve de fonds, c'est excellent.\n`;
  } else {
    briefing += `⚠️ Vous devez préparer une preuve de fonds suffisante.\n`;
    if (analysis.financial.requirements?.min_monthly_eur) {
      briefing += `Minimum requis: ${analysis.financial.requirements.min_monthly_eur}€/mois\n`;
    }
  }
  briefing += `\n`;
  
  // Linguistique
  briefing += `### 🗣️ Compétences linguistiques\n`;
  if (analysis.language.testsTaken.length > 0) {
    briefing += `Tests passés: ${analysis.language.testsTaken.join(', ')}\n`;
  } else {
    briefing += `⚠️ Aucun test de langue attesté. Vérifiez les exigences du pays de destination.\n`;
  }
  briefing += `\n`;
  
  return briefing;
}

function generateRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.score < 60) {
    recommendations.push({
      priority: 'high',
      category: 'général',
      message: 'Votre score indique une préparation insuffisante. Concentrez-vous sur les points faibles identifiés.'
    });
  }
  
  if (!analysis.financial.hasProofOfFunds) {
    recommendations.push({
      priority: 'high',
      category: 'financier',
      message: 'Constituez votre dossier de preuve de fonds dès maintenant.',
      action: 'Consultez les exigences financières spécifiques dans notre base de données.'
    });
  }
  
  if (analysis.language.testsTaken.length === 0) {
    recommendations.push({
      priority: 'high',
      category: 'langue',
      message: 'Inscrivez-vous à un test de langue officiel (IELTS, TOEFL, TCF, etc.)',
      action: 'Vérifiez quel test est accepté par votre pays de destination.'
    });
  }
  
  if (!analysis.admission.hasAcceptanceLetter) {
    recommendations.push({
      priority: 'medium',
      category: 'admission',
      message: 'Commencez vos démarches d\'admission universitaire.',
      action: 'Recherchez les universités et leurs dates limites de candidature.'
    });
  }
  
  return recommendations;
}