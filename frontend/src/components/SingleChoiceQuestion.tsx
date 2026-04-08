import { useState } from "react";

type SingleChoiceQuestionProps = {
    options: string[];
    onAnswer: (answer: string) => void;
    isDark?: boolean;
};

function formatLabel(label: string) {
    return label;
}

function SingleChoiceQuestion({ options, onAnswer, isDark = false }: SingleChoiceQuestionProps) {
    const [selected, setSelected] = useState<string | null>(null);

    const handleClick = (opt: string) => {
        setSelected(opt);
        onAnswer(opt);
    };

    return (
        <div className={`rounded-3xl border-2 p-8 mb-8 shadow flex flex-col items-center ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#EAEDF0]'
            }`}>
            <p className={`mb-8 text-center text-lg font-bold ${isDark ? 'text-neutral-200' : 'text-neutral-800'
                }`}>
                Sélectionnez une option
            </p>
            <div className="space-y-6 w-full max-w-xl">
                {options && options.length > 0 ? (
                    options.map((opt, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleClick(opt)}
                            className={`
                                w-full py-6 px-4 rounded-2xl text-lg font-medium
                                shadow-sm focus:outline-none transition-all duration-200
                                active:scale-95
                                ${selected === opt
                                    ? "border-[#005EEA] ring-2 ring-[#005EEA]"
                                    : ""
                                }
                                ${isDark
                                    ? 'bg-neutral-700 border-2 border-neutral-600 text-neutral-200 hover:bg-neutral-600 hover:border-brand-primary'
                                    : 'bg-[#F7F8FB] border-2 border-[#EAEDF0] text-[#22253A] hover:bg-[#EAF3FF] hover:border-[#005EEA] hover:shadow-md hover:text-[#005EEA] hover:scale-[1.03]'
                                }
                            `}
                        >
                            {formatLabel(opt)}
                        </button>
                    ))
                ) : (
                    <p className={`text-center ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Aucune option
                    </p>
                )}
            </div>
        </div>
    );
}

export default SingleChoiceQuestion;
