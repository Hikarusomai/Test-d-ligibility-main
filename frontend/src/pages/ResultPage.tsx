import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/api';
import Button from '../components/Button';

type ResultsPageProps = {
    originCountry: string;
    destinationCountry: string;
    answers: Record<string, any>;
    onComplete: () => void;
    isDark?: boolean;
};

function ResultsPage({
                         originCountry,
                         destinationCountry,
                         answers,
                         onComplete,
                         isDark = false
                     }: ResultsPageProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        submitTest();
    }, []);

    const submitTest = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            console.log('📤 Submitting test...');

            const response = await apiService.submitTest({
                originCountry,
                destinationCountry,
                answers
            });

            console.log('✅ Test submitted:', response);
            setResult(response);
            setSubmitted(true);
        } catch (err: any) {
            console.error('❌ Error:', err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
            isDark ? 'bg-neutral-900' : 'bg-neutral-50'
        }`}>
            <div className={`max-w-2xl w-full rounded-2xl border-2 p-8 ${
                isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
            }`}>
                {isSubmitting && (
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mb-4"></div>
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {t('quiz.submitting')}
                        </h2>
                        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                            {t('result.savingAnswers')}
                        </p>
                    </div>
                )}

                {error && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {t('quiz.error')}
                        </h2>
                        <p className={`mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {error}
                        </p>
                        <Button onClick={submitTest} variant="primary">
                            {t('common.retry')}
                        </Button>
                    </div>
                )}

                {submitted && result && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {t('result.testSubmitted')}
                        </h2>
                        <p className={`mb-6 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {t('result.answersSaved')}
                        </p>

                        <div className={`rounded-xl p-6 mb-6 ${
                            isDark ? 'bg-neutral-700' : 'bg-neutral-100'
                        }`}>
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                        {t('result.originCountry')}
                                    </p>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                        {result.submission.originCountry}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                        {t('result.destination')}
                                    </p>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                        {result.submission.destinationCountry}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                        {t('result.eligibilityScore')}
                                    </p>
                                    <p className={`font-bold text-brand-primary text-2xl`}>
                                        {result.submission.score}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                        {t('result.questionsAnswered')}
                                    </p>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                        {Object.keys(answers).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button onClick={onComplete} variant="primary" size="lg" className="w-full">
                            Terminer
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResultsPage;
