const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
    {
        label: { type: String, required: true },
        key: { type: String, required: true, unique: true },
        category: {
            type: String,
            required: true,
            enum: ['personal', 'education', 'finance', 'language', 'experience', 'project', 'other']
        },
        type: {
            type: String,
            enum: ['number', 'boolean', 'single_choice', 'multi_choice', 'text'],
            required: true
        },
        options: [{ type: String }],
        labelEn: { type: String },
        optionsEn: [{ type: String }],
        weight: {
            type: Number,
            default: 1,
            min: 0,
            max: 20
        },
        isRequired: { type: Boolean, default: true },
        order: {
            type: Number,
            required: true,
            unique: true // ⬅️ Ceci crée déjà un index
        },
        isActive: { type: Boolean, default: true },
        description: { type: String },
        helpText: { type: String },
        minSelections: { type: Number, min: 0 },
        maxSelections: { type: Number, min: 1 },
        allowCustomAnswer: { type: Boolean, default: false },
        customAnswerPlaceholder: { type: String },
        placeholder: { type: String },
        multiline: { type: Boolean, default: false },
        maxLength: { type: Number },
        minLength: { type: Number },
        min: { type: Number },
        max: { type: Number },
        step: { type: Number },
        unit: { type: String },
        correctAnswer: mongoose.Schema.Types.Mixed,
        scoringRules: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        conditionalDisplay: {
            dependsOn: { type: String },
            showWhen: mongoose.Schema.Types.Mixed
        },
        validation: {
            regex: { type: String },
            errorMessage: { type: String }
        }
    },
    { timestamps: true }
);

// Index pour optimiser les requêtes
// ❌ SUPPRIMEZ CETTE LIGNE car order a déjà unique: true
// questionSchema.index({ order: 1 });

questionSchema.index({ category: 1 });
questionSchema.index({ isActive: 1, order: 1 });

// Méthode pour valider une réponse
questionSchema.methods.validateAnswer = function (answer) {
    if (this.isRequired && (answer === null || answer === undefined || answer === '')) {
        return { valid: false, error: 'Cette question est obligatoire' };
    }

    switch (this.type) {
        case 'number':
            const num = parseFloat(answer);
            if (isNaN(num)) {
                return { valid: false, error: 'Veuillez entrer un nombre valide' };
            }
            if (this.min !== undefined && num < this.min) {
                return { valid: false, error: `La valeur doit être supérieure ou égale à ${this.min}` };
            }
            if (this.max !== undefined && num > this.max) {
                return { valid: false, error: `La valeur doit être inférieure ou égale à ${this.max}` };
            }
            break;

        case 'text':
            if (this.minLength && answer.length < this.minLength) {
                return { valid: false, error: `Le texte doit contenir au moins ${this.minLength} caractères` };
            }
            if (this.maxLength && answer.length > this.maxLength) {
                return { valid: false, error: `Le texte ne peut pas dépasser ${this.maxLength} caractères` };
            }
            if (this.validation && this.validation.regex) {
                const regex = new RegExp(this.validation.regex);
                if (!regex.test(answer)) {
                    return {
                        valid: false,
                        error: this.validation.errorMessage || 'Format de réponse invalide'
                    };
                }
            }
            break;

        case 'single_choice':
            if (this.options && !this.options.includes(answer)) {
                return { valid: false, error: 'Veuillez choisir une option valide' };
            }
            break;

        case 'multi_choice':
            if (!Array.isArray(answer)) {
                return { valid: false, error: 'Veuillez sélectionner au moins une option' };
            }
            if (this.minSelections && answer.length < this.minSelections) {
                return { valid: false, error: `Veuillez sélectionner au moins ${this.minSelections} option(s)` };
            }
            if (this.maxSelections && answer.length > this.maxSelections) {
                return { valid: false, error: `Vous ne pouvez pas sélectionner plus de ${this.maxSelections} option(s)` };
            }
            break;

        case 'boolean':
            if (typeof answer !== 'boolean') {
                return { valid: false, error: 'Veuillez répondre par Oui ou Non' };
            }
            break;
    }

    return { valid: true };
};

// Méthode pour calculer les points obtenus pour cette question
questionSchema.methods.calculatePoints = function (answer) {
    const weight = this.weight || 1;

    if (answer === null || answer === undefined || answer === '') {
        return 0;
    }

    if (this.scoringRules) {
        const points = this.scoringRules[answer];
        if (points !== undefined) {
            return (points / 10) * weight;
        }
    }

    if (this.correctAnswer !== undefined && this.correctAnswer !== null) {
        if (JSON.stringify(answer) === JSON.stringify(this.correctAnswer)) {
            return weight;
        }
        return weight * 0.3;
    }

    switch (this.type) {
        case 'number':
            if (this.min !== undefined && this.max !== undefined) {
                const num = parseFloat(answer);
                const range = this.max - this.min;
                const normalizedValue = (num - this.min) / range;
                return weight * normalizedValue;
            }
            return weight * 0.7;

        case 'text':
            const length = answer.length;
            if (length > 50) return weight;
            if (length > 20) return weight * 0.7;
            if (length > 10) return weight * 0.5;
            return weight * 0.3;

        case 'boolean':
        case 'single_choice':
        case 'multi_choice':
            return weight * 0.7;

        default:
            return weight * 0.5;
    }
};

module.exports = mongoose.model('Question', questionSchema);
