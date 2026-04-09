const mongoose = require('mongoose');
const TestSubmission = require('../models/TestSubmission');
const CountryRequirement = require('../models/CountryRequirement');
const Question = require('../models/Question');
const { evaluateEligibility } = require('../utils/eligibilityEngine');


// Import corrigé du SDK Perplexity AI (CommonJS)
const Perplexity = require('@perplexity-ai/perplexity_ai');
// Instanciation du client une seule fois
const client = new Perplexity({
    apiKey: process.env.PERPLEXITY_API_KEY,
});

const submitTest = async (req, res) => {
    try {
        const { originCountry, destinationCountry, answers } = req.body;
        const userId = new mongoose.Types.ObjectId(req.user.userId);
        const questions = await Question.find({ isActive: true }).sort({ order: 1 });
        if (!questions.length) {
            return res.status(400).json({ success: false, message: 'Aucune question active trouvée' });
        }

        // Format attendu pour scoring
        const rawAnswers = [];
        for (const q of questions) {
            if (Object.prototype.hasOwnProperty.call(answers, q.key)) {
                rawAnswers.push({
                    questionId: q._id.toString(),
                    value: answers[q.key]
                });
            }
        }

        const { normalizedScore, status, summary, details } = await evaluateEligibility(rawAnswers);

        const submission = new TestSubmission({
            userId,
            originCountry,
            destinationCountry,
            answers,
            score: normalizedScore,
            analysis: details,
            status,
            completedAt: new Date()
        });
        await submission.save();

        // Recherche par nom, slug ou iso3
        const destName = (destinationCountry || '').trim();
        const countryRequirement = await CountryRequirement.findOne({
            $or: [
                { 'country.name': new RegExp(`^${escapeRegex(destName)}$`, 'i') },
                { 'country.slug': new RegExp(`^${escapeRegex(slugify(destName))}$`, 'i') },
                { 'country.iso3': new RegExp(`^${escapeRegex(destName)}$`, 'i') }
            ]
        });

        // Helper functions for regex and slugify (if not already imported)
        function escapeRegex(str) { return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
        function slugify(str) { return String(str || '').toLowerCase().trim().replace(/\s+/g, '-'); }

        const lang = req.body.lang || 'fr';
        const isEn = lang === 'en';

        // Génération du briefing IA synthétique
        let briefing = isEn ? 'Briefing being generated...' : 'Briefing en cours de génération...';
        if (countryRequirement) {
            try {

                const prompt = isEn ? `
You are a student visa expert for ${destinationCountry}. Your role is to analyze the provided data and give precise, personalized advice.

### CANDIDATE DATA (MANDATORY USE):
- Overall score: ${normalizedScore}/100
- Status: ${status}
- Blocking points: ${details.hardFails.join(', ') || 'None'}
- Points of attention: ${details.reasons.join(', ') || 'None'}

### CANDIDATE ANSWERS:
${JSON.stringify(answers, null, 2)}

### OFFICIAL REQUIREMENTS (${destinationCountry}):
${JSON.stringify(countryRequirement.requirements, null, 2)}

### CRITICAL WRITING GUIDELINES:
1. **BUDGET COMPARISON**: The candidate declared ${answers.Q18_first_year_amount_eur}€. The minimum required is ${countryRequirement.requirements.financial.min_annual_eur}€.
   - IF THE BUDGET IS BELOW THE MINIMUM: You MUST state this is a critical issue and the visa will be REFUSED.
   - NEVER say the budget is sufficient if it is below the minimum.
2. **STRICTLY FORBIDDEN** to say you lack information.
3. Do not recap the context. Start directly with the title "## Profile Summary".
4. Be direct, expert and use "you" (second person).

Expected structure:
## Profile Summary
(Synthetic analysis of score and status)

## Strengths
(List positive points with 🟢 emojis)

## Areas for Improvement
(List weaknesses with ⚠️ emojis. If budget is insufficient, start with that!)

## Key Recommendations
(Practical advice with 💡 emojis)
` : `
Tu es un expert en visas étudiants pour ${destinationCountry}. Ton rôle est d'analyser les données fournies pour donner un conseil précis et personnalisé.

### DONNÉES DU CANDIDAT (À UTILISER IMPÉRATIVEMENT) :
- Score global : ${normalizedScore}/100
- Statut : ${status}
- Points bloquants : ${details.hardFails.join(', ') || 'Aucun'}
- Points d'attention : ${details.reasons.join(', ') || 'Aucun'}

### RÉPONSES DU CANDIDAT :
${JSON.stringify(answers, null, 2)}

### EXIGENCES OFFICIELLES (${destinationCountry}) :
${JSON.stringify(countryRequirement.requirements, null, 2)}

### DIRECTIVES DE RÉDACTION CRITIQUES :
1. **COMPARAISON BUDGET** : Le candidat a déclaré ${answers.Q18_first_year_amount_eur}€. Le minimum requis est de ${countryRequirement.requirements.financial.min_annual_eur}€.
   - SI LE BUDGET EST INFÉRIEUR AU MINIMUM : Tu DOIS dire que c'est un point critique et que le visa sera REFUSÉ.
   - NE DIS JAMAIS que le budget est suffisant s'il est inférieur au minimum.
2. **INTERDICTION FORMELLE** de dire que tu manques d'informations.
3. Ne fais pas de rappel de contexte. Commence directement par le titre "## Résumé du profil".
4. Sois direct, expert et utilise le "vous".

Structure attendue :
## Résumé du profil
(Analyse synthétique du score et du statut)

## Points forts
(Lister les points positifs avec emojis 🟢)

## Points à améliorer
(Lister les points faibles avec emojis ⚠️. Si le budget est insuffisant, commence par ça !)

## Recommandations clés
(Conseils pratiques avec emojis 💡)
`;

                const completion = await client.chat.completions.create({
                    model: 'sonar-pro',
                    messages: [
                        {
                            role: 'system',
                            content: isEn
                                ? 'You are an administrative expert specializing in student visas. You analyze technical files and provide structured briefings without ever mentioning your technical limitations or lack of data.'
                                : 'Tu es un expert administratif spécialisé dans les visas étudiants. Tu analyses des dossiers techniques et fournis des briefings structurés sans jamais mentionner tes limitations techniques ou un manque de données.'
                        },
                        { role: 'user', content: prompt }
                    ]
                });

                if (completion.choices?.[0]?.message?.content) {
                    briefing = completion.choices[0].message.content;
                }
            } catch (aiError) {
                console.error('❌ Erreur génération IA :', aiError.message);
                briefing = isEn
                    ? "## Analysis Unavailable\nThe personalized briefing could not be generated at this time. Please try again later."
                    : "## Analyse indisponible\nLe briefing personnalisé n'a pas pu être généré pour le moment. Veuillez réessayer plus tard.";
            }
        } else {
            console.warn('Exigences pays non trouvées (nom) :', destName);
            briefing = isEn ? `## Profile Summary
Your score is **${normalizedScore}/100**.
We could not retrieve the detailed specific requirements for **${destinationCountry}** in our current database, but here is a general analysis:
${status === 'ELIGIBLE' ? '🟢 Your profile looks solid.' : '⚠️ Your profile needs some adjustments.'}
${details.reasons.length > 0 ? '\n**Points to watch:**\n- ' + details.reasons.join('\n- ') : ''}
💡 We recommend checking the exact amounts required on the official consulate website.`
            : `## Résumé du profil
Votre score est de **${normalizedScore}/100**.
Nous n'avons pas pu récupérer les exigences spécifiques détaillées pour **${destinationCountry}** dans notre base de données actuelle, mais voici une analyse générale :
${status === 'ELIGIBLE' ? '🟢 Votre profil semble solide.' : '⚠️ Votre profil nécessite des ajustements.'}
${details.reasons.length > 0 ? '\n**Points à surveiller :**\n- ' + details.reasons.join('\n- ') : ''}
💡 Nous vous conseillons de vérifier les montants exacts requis sur le site officiel du consulat.`;
        }

        // Persist briefing to database so history can retrieve it
        submission.briefing = briefing;
        await submission.save();

        return res.status(201).json({
            success: true,
            message: 'Test soumis avec succès',
            submission: {
                id: submission._id,
                originCountry: submission.originCountry,
                destinationCountry: submission.destinationCountry,
                score: submission.score,
                status: submission.status,
                summary,
                details,
                briefing,
                completedAt: submission.completedAt,
                createdAt: submission.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Error submitting test:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la soumission du test',
            error: error.message
        });
    }
};


const getMyTests = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.userId);
        const tests = await TestSubmission.find({ userId }).sort({ completedAt: -1 }).select('-answers');

        res.json({
            success: true,
            tests: tests.map(test => ({
                id: test._id,
                originCountry: test.originCountry,
                destinationCountry: test.destinationCountry,
                score: test.score,
                status: test.status,
                briefing: test.briefing || '',
                completedAt: test.completedAt,
                createdAt: test.createdAt
            }))
        });
    } catch (error) {
        console.error('❌ Error fetching tests:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des tests' });
    }
};

const getTestById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = new mongoose.Types.ObjectId(req.user.userId);
        const test = await TestSubmission.findOne({ _id: id, userId });

        if (!test) {
            return res.status(404).json({ success: false, message: 'Test non trouvé' });
        }

        res.json({
            success: true,
            test: {
                id: test._id,
                originCountry: test.originCountry,
                destinationCountry: test.destinationCountry,
                score: test.score,
                analysis: test.analysis,
                answers: test.answers,
                status: test.status,
                completedAt: test.completedAt,
                createdAt: test.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Error fetching test:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du test' });
    }
};

const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = new mongoose.Types.ObjectId(req.user.userId);
        const test = await TestSubmission.findOneAndDelete({ _id: id, userId });

        if (!test) {
            return res.status(404).json({ success: false, message: 'Test non trouvé' });
        }

        res.json({ success: true, message: 'Test supprimé avec succès' });
    } catch (error) {
        console.error('❌ Error deleting test:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression du test' });
    }
};

const generateBriefing = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const userId = new mongoose.Types.ObjectId(req.user.userId);

        const submission = await TestSubmission.findOne({ _id: submissionId, userId });
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Soumission non trouvée' });
        }

        const countryRequirement = await CountryRequirement.findOne({
            $or: [
                { 'country.name': new RegExp(`^${escapeRegex(submission.destinationCountry)}$`, 'i') },
                { 'country.slug': new RegExp(`^${escapeRegex(slugify(submission.destinationCountry))}$`, 'i') },
                { 'country.iso3': new RegExp(`^${escapeRegex(submission.destinationCountry)}$`, 'i') }
            ]
        });

        if (!countryRequirement) {
            return res.status(404).json({ success: false, message: 'Exigences pays non trouvées' });
        }

        function escapeRegex(str) { return String(str || ‘’).replace(/[.*+?^${}()|[\]\\]/g, ‘\\$&’); }
        function slugify(str) { return String(str || ‘’).toLowerCase().trim().replace(/\s+/g, ‘-’); }

        const lang = req.query.lang || ‘fr’;
        const isEnRegen = lang === ‘en’;
        const clientRegen = new Perplexity({ apiKey: process.env.PERPLEXITY_API_KEY });

        const prompt = isEnRegen ? `
You are an administrative expert in student visas.
Here are the candidate’s answers:
${JSON.stringify(submission.answers, null, 2)}

Here are the official requirements for the destination country (${submission.destinationCountry}):
${JSON.stringify(countryRequirement.requirements, null, 2)}

Compare each answer to each criterion and write a personalized briefing in English with:
# Strengths
# Weaknesses or areas for improvement
# Precise practical recommendations
Be concise, structured and professional.
` : `
Tu es un expert administratif en visa étudiant.
Voici les réponses du candidat :
${JSON.stringify(submission.answers, null, 2)}

Voici les exigences officielles du pays de destination (${submission.destinationCountry}) :
${JSON.stringify(countryRequirement.requirements, null, 2)}

Compare chaque réponse à chaque critère et rédige un briefing personnalisé, en français, avec :
# Points forts
# Points faibles ou à améliorer
# Recommandations pratiques précises
Sois synthétique, structuré et professionnel.
`;

        const completion = await clientRegen.chat.completions.create({
            model: ‘sonar-32k-online’,
            messages: [
                {
                    role: ‘system’,
                    content: isEnRegen
                        ? ‘You are an orientation assistant for international students.’
                        : ‘Tu es un assistant d\’orientation pour étudiants internationaux.’
                },
                { role: ‘user’, content: prompt }
            ]
        });

        const content = completion.choices?.[0]?.message?.content || 'Briefing indisponible.';

        return res.json({
            success: true,
            score: submission.score,
            analysis: submission.analysis,
            briefing: content,
            completedAt: submission.completedAt
        });
    } catch (error) {
        console.error('Erreur Perplexity:', error);
        return res.status(500).json({ success: false, message: 'Erreur IA backend', error: error.message });
    }
};

// Export des fonctions
module.exports = {
    submitTest,
    getMyTests,
    getTestById,
    deleteTest,
    generateBriefing
};
