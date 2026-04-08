import { useState } from "react";

type TextQuestionProps = {
    onAnswer: (answer: string) => void;
    isDark?: boolean;
    placeholder?: string;
    multiline?: boolean;
    maxLength?: number;
    minLength?: number;
};

function TextQuestion({
                          onAnswer,
                          isDark = false,
                          placeholder = "Votre réponse...",
                          multiline = false,
                          maxLength,
                          minLength = 1
                      }: TextQuestionProps) {
    const [answer, setAnswer] = useState<string>("");

    const handleSubmit = () => {
        const trimmedAnswer = answer.trim();
        if (trimmedAnswer.length >= minLength) {
            onAnswer(trimmedAnswer);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        // Soumettre avec Enter si ce n'est pas multiline
        if (!multiline && e.key === 'Enter' && answer.trim().length >= minLength) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const canSubmit = answer.trim().length >= minLength;
    const characterCount = answer.length;

    return (
        <div className={`rounded-3xl border-2 p-8 mb-8 shadow flex flex-col items-center ${
            isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#EAEDF0]'
        }`}>
            <p className={`mb-6 text-center text-lg font-bold ${
                isDark ? 'text-neutral-200' : 'text-neutral-800'
            }`}>
                Veuillez saisir votre réponse
            </p>

            <div className="w-full max-w-2xl mb-6">
                {multiline ? (
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        rows={5}
                        className={`
                            w-full px-6 py-4 rounded-2xl border-2 text-lg resize-none
                            focus:outline-none focus:ring-2 focus:ring-[#005EEA] focus:border-[#005EEA]
                            transition-all duration-200
                            ${isDark
                            ? 'bg-neutral-700 border-neutral-600 text-neutral-200 placeholder-neutral-400'
                            : 'bg-[#F7F8FB] border-[#EAEDF0] text-[#22253A] placeholder-neutral-500'
                        }
                        `}
                    />
                ) : (
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        className={`
                            w-full px-6 py-4 rounded-2xl border-2 text-lg
                            focus:outline-none focus:ring-2 focus:ring-[#005EEA] focus:border-[#005EEA]
                            transition-all duration-200
                            ${isDark
                            ? 'bg-neutral-700 border-neutral-600 text-neutral-200 placeholder-neutral-400'
                            : 'bg-[#F7F8FB] border-[#EAEDF0] text-[#22253A] placeholder-neutral-500'
                        }
                        `}
                    />
                )}

                {/* Compteur de caractères */}
                {maxLength && (
                    <div className={`mt-2 text-sm text-right ${
                        isDark ? 'text-neutral-400' : 'text-neutral-600'
                    }`}>
                        {characterCount} / {maxLength} caractères
                    </div>
                )}

                {/* Message de longueur minimale */}
                {minLength > 1 && answer.length > 0 && answer.length < minLength && (
                    <div className="mt-2 text-sm text-red-500">
                        Minimum {minLength} caractères requis
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
                Valider
            </button>

            {!multiline && (
                <p className={`mt-4 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    Appuyez sur Entrée pour valider
                </p>
            )}
        </div>
    );
}

export default TextQuestion;
