/**
 * Calcule le score d'éligibilité en utilisant les méthodes du modèle Question
 */
const calculateScore = async (questions, answers) => {
    let totalWeight = 0;
    let earnedPoints = 0;

    for (const question of questions) {
        const weight = question.weight || 1;
        totalWeight += weight;

        // Récupérer la réponse de l'utilisateur
        const userAnswer = answers[question.key];

        if (!userAnswer && userAnswer !== false && userAnswer !== 0) {
            // Pas de réponse = 0 points
            continue;
        }

        // Utiliser la méthode calculatePoints du modèle
        const points = question.calculatePoints(userAnswer);
        earnedPoints += points;
    }

    // Calculer le score final sur 100
    const score = totalWeight > 0 ? Math.round((earnedPoints / totalWeight) * 100) : 0;

    // S'assurer que le score est entre 0 et 100
    return Math.max(0, Math.min(100, score));
};

/**
 * Analyse détaillée du score par catégorie
 */
const analyzeScore = async (questions, answers) => {
    const categories = {};

    for (const question of questions) {
        const category = question.category || 'other';
        const weight = question.weight || 1;
        const userAnswer = answers[question.key];

        if (!categories[category]) {
            categories[category] = {
                totalWeight: 0,
                earnedPoints: 0,
                questionsCount: 0,
                answeredCount: 0
            };
        }

        categories[category].totalWeight += weight;
        categories[category].questionsCount++;

        if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
            categories[category].answeredCount++;
            const points = question.calculatePoints(userAnswer);
            categories[category].earnedPoints += points;
        }
    }

    // Calculer le score par catégorie
    const categoryScores = {};
    for (const [category, data] of Object.entries(categories)) {
        categoryScores[category] = {
            score: data.totalWeight > 0 ? Math.round((data.earnedPoints / data.totalWeight) * 100) : 0,
            answered: data.answeredCount,
            total: data.questionsCount
        };
    }

    return categoryScores;
};

module.exports = {
    calculateScore,
    analyzeScore
};
