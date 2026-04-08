import { useState } from "react";
import { useTranslation } from "react-i18next";

type NumberQuestionProps = {
    onAnswer: (answer: number) => void;
    isDark?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    unit?: string; // Pour afficher l'unité (€, kg, ans, etc.)
};

function NumberQuestion({
                            onAnswer,
                            isDark = false,
                            placeholder = "Entrez un nombre...",
                            min,
                            max,
                            unit
                        }: NumberQuestionProps) {
    const { t } = useTranslation();
    const [value, setValue] = useState<string>("");
    const [error, setError] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Permettre les nombres et les nombres décimaux
        if (inputValue === "" || /^-?\d*\.?\d*$/.test(inputValue)) {
            setValue(inputValue);
            setError("");
        }
    };

    const handleSubmit = () => {
        const numValue = parseFloat(value);

        // Validation
        if (value === "" || isNaN(numValue)) {
            setError(t('question.numberMustBeValid'));
            return;
        }

        if (min !== undefined && numValue < min) {
            setError(t('question.valueMustBeGreaterOrEqual', { min }));
            return;
        }

        if (max !== undefined && numValue > max) {
            setError(t('question.valueMustBeLessOrEqual', { max }));
            return;
        }

        onAnswer(numValue);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && value.trim() !== "") {
            handleSubmit();
        }
    };

    const canSubmit = value.trim() !== "" && !error;

    return (
        <div className={`rounded-3xl border-2 p-8 mb-8 shadow flex flex-col items-center ${
            isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#EAEDF0]'
        }`}>
            <p className={`mb-6 text-center text-lg font-bold ${
                isDark ? 'text-neutral-200' : 'text-neutral-800'
            }`}>
                {t('question.enterNumber')}
            </p>

            {/* Indications min/max */}
            {(min !== undefined || max !== undefined) && (
                <p className={`mb-4 text-center text-sm ${
                    isDark ? 'text-neutral-400' : 'text-neutral-600'
                }`}>
                    {min !== undefined && max !== undefined
                        ? t('question.betweenMinMax', { min, max, unit: unit ? ` ${unit}` : '' })
                        : min !== undefined
                            ? t('question.minOnly', { min, unit: unit ? ` ${unit}` : '' })
                            : t('question.maxOnly', { max, unit: unit ? ` ${unit}` : '' })
                    }
                </p>
            )}

            <div className="w-full max-w-md mb-6">
                <div className="relative">
                    <input
                        type="text"
                        inputMode="decimal"
                        value={value}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        placeholder={placeholder}
                        className={`
                            w-full px-6 py-4 rounded-2xl border-2 text-lg text-center font-semibold
                            focus:outline-none focus:ring-2 focus:ring-[#005EEA] focus:border-[#005EEA]
                            transition-all duration-200
                            ${isDark
                            ? 'bg-neutral-700 border-neutral-600 text-neutral-200 placeholder-neutral-400'
                            : 'bg-[#F7F8FB] border-[#EAEDF0] text-[#22253A] placeholder-neutral-500'
                        }
                            ${error ? 'border-red-500 ring-2 ring-red-500' : ''}
                        `}
                    />

                    {/* Afficher l'unité à droite */}
                    {unit && value && (
                        <span className={`absolute right-6 top-1/2 -translate-y-1/2 text-lg font-semibold ${
                            isDark ? 'text-neutral-400' : 'text-neutral-600'
                        }`}>
                            {unit}
                        </span>
                    )}
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="mt-2 text-sm text-red-500 text-center">
                        {error}
                    </div>
                )}
            </div>

            {/* Bouton Valider */}
            <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`
                    px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200
                    ${canSubmit
                    ? 'bg-brand-primary text-white hover:bg-brand-primary/90 hover:scale-105 active:scale-95 shadow-lg'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }
                `}
            >
                {t('question.validate')}
            </button>
        </div>
    );
}

export default NumberQuestion;
