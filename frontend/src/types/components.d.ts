export interface DestinationSelectionProps {
    originCountry: string;
    onDestinationSelect: (destination: string) => void;
    onBack: () => void;
    isDark: boolean;
    totalQuestions: number;
}

export interface QuestionPageProps {
    originCountry: string;
    destinationCountry: string;
    questionOrder: number;
    onAnswer: (answer: any) => Promise<void>;
    onBack: () => void;
    isDark: boolean;
    totalQuestions: number;
    userId?: string;
    allAnswersCollected?: Record<string, any>;
}
