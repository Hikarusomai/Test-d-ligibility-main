import { useState } from "react";
import { useTranslation } from "react-i18next";

type MultipleChoiceQuestionProps = {
    options: string[];
    onAnswer: (answers: string[]) => void;
    isDark?: boolean;
    minSelections?: number;
    maxSelections?: number;
    allowCustomAnswer?: boolean; // 👈 Nouveau prop
    customAnswerPlaceholder?: string; // 👈 Placeholder personnalisable
};

function formatLabel(label: string) {
    return label;
}

function MultipleChoiceQuestion({
    options,
    onAnswer,
    isDark = false,
    minSelections = 1,
    maxSelections,
    allowCustomAnswer = false, // 👈 Par défaut désactivé
    customAnswerPlaceholder = "Autre (précisez)..."
}: MultipleChoiceQuestionProps) {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<string[]>([]);
    const [customAnswer, setCustomAnswer] = useState<string>("");
    const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);

    const handleToggle = (opt: string) => {
        setSelected(prev => {
            if (prev.includes(opt)) {
                // Désélectionner
                return prev.filter(item => item !== opt);
            } else {
                // Sélectionner (vérifier max)
                if (maxSelections && prev.length >= maxSelections && !isCustomSelected) {
                    return prev;
                }
                return [...prev, opt];
            }
        });
    };

    const handleCustomToggle = () => {
        setIsCustomSelected(prev => !prev);
        if (isCustomSelected) {
            setCustomAnswer(""); // Réinitialiser le texte si décoché
        }
    };

    const handleSubmit = () => {
        const answers = [...selected];

        // Ajouter la réponse personnalisée si elle existe
        if (isCustomSelected && customAnswer.trim()) {
            answers.push(customAnswer.trim());
        }

        if (answers.length >= minSelections) {
            onAnswer(answers);
        }
    };

    const totalSelected = selected.length + (isCustomSelected && customAnswer.trim() ? 1 : 0);
    const canSubmit = totalSelected >= minSelections;
    const limitReached = maxSelections && selected.length >= maxSelections && !isCustomSelected;

    return (
        <div className={`rounded-3xl border-2 p-8 mb-8 shadow flex flex-col items-center ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#EAEDF0]'
            }`}>
            <p className={`mb-4 text-center text-lg font-bold ${isDark ? 'text-neutral-200' : 'text-neutral-800'
                }`}>
                {t('question.selectMultipleOptions')}
            </p>

            <p className={`mb-6 text-center text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'
                }`}>
                {maxSelections
                    ? t('question.selectBetween', { min: minSelections, max: maxSelections })
                    : t('question.selectAtLeast', { min: minSelections })
                }
                {totalSelected > 0 && ` • ${t('question.selectionCount', { count: totalSelected })}`}
            </p>

            <div className="space-y-4 w-full max-w-xl mb-6">
                {/* Options prédéfinies */}
                {options && options.length > 0 ? (
                    options.map((opt, idx) => {
                        const isSelected = selected.includes(opt);
                        const isDisabled = !isSelected && Boolean(limitReached);

                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => !isDisabled && handleToggle(opt)}
                                disabled={isDisabled}
                                className={`
                                    w-full py-5 px-4 rounded-2xl text-lg font-medium
                                    shadow-sm focus:outline-none transition-all duration-200
                                    flex items-center gap-3
                                    ${isSelected
                                        ? 'border-[#005EEA] ring-2 ring-[#005EEA] bg-[#EAF3FF]'
                                        : ''
                                    }
                                    ${isDisabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:scale-[1.02] active:scale-95'
                                    }
                                    ${isDark
                                        ? isSelected
                                            ? 'bg-brand-primary/20 border-2 border-brand-primary text-neutral-200'
                                            : 'bg-neutral-700 border-2 border-neutral-600 text-neutral-200 hover:bg-neutral-600'
                                        : isSelected
                                            ? 'border-2 text-[#005EEA]'
                                            : 'bg-[#F7F8FB] border-2 border-[#EAEDF0] text-[#22253A] hover:bg-[#EAF3FF] hover:border-[#005EEA]'
                                    }
                                `}
                            >
                                {/* Checkbox */}
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                                        ? 'bg-[#005EEA] border-[#005EEA]'
                                        : isDark
                                            ? 'border-neutral-500 bg-neutral-600'
                                            : 'border-neutral-300 bg-white'
                                    }`}>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>

                                <span>{formatLabel(opt)}</span>
                            </button>
                        );
                    })
                ) : (
                    <p className={`text-center ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {t('question.noOption')}
                    </p>
                )}

                {/* Option personnalisée */}
                {allowCustomAnswer && (
                    <div className={`
                        w-full rounded-2xl border-2 transition-all duration-200
                        ${isCustomSelected
                            ? 'border-[#005EEA] ring-2 ring-[#005EEA] bg-[#EAF3FF]'
                            : isDark
                                ? 'border-neutral-600 bg-neutral-700'
                                : 'border-[#EAEDF0] bg-[#F7F8FB]'
                        }
                    `}>
                        <button
                            type="button"
                            onClick={handleCustomToggle}
                            className={`
                                w-full py-5 px-4 text-lg font-medium
                                flex items-center gap-3
                                hover:scale-[1.02] active:scale-95 transition-all
                                ${isDark ? 'text-neutral-200' : 'text-[#22253A]'}
                            `}
                        >
                            {/* Checkbox */}
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${isCustomSelected
                                    ? 'bg-[#005EEA] border-[#005EEA]'
                                    : isDark
                                        ? 'border-neutral-500 bg-neutral-600'
                                        : 'border-neutral-300 bg-white'
                                }`}>
                                {isCustomSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>

                            <span>{t('question.other')}</span>
                        </button>

                        {/* Champ de texte qui apparaît quand l'option est cochée */}
                        {isCustomSelected && (
                            <div className="px-4 pb-4">
                                <input
                                    type="text"
                                    value={customAnswer}
                                    onChange={(e) => setCustomAnswer(e.target.value)}
                                    placeholder={customAnswerPlaceholder}
                                    className={`
                                        w-full px-4 py-3 rounded-lg border-2 text-base
                                        focus:outline-none focus:ring-2 focus:ring-[#005EEA]
                                        transition-all
                                        ${isDark
                                            ? 'bg-neutral-600 border-neutral-500 text-neutral-200 placeholder-neutral-400'
                                            : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                                        }
                                    `}
                                    autoFocus
                                />
                            </div>
                        )}
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
                {totalSelected > 0 ? t('question.validateCount', { count: totalSelected }) : t('question.validate')}
            </button>
        </div>
    );
}

export default MultipleChoiceQuestion;
