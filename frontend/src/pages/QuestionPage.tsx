import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SingleChoiceQuestion from '../components/SingleChoiceQuestion';
import MultipleChoiceQuestion from '../components/MultipleChoiceQuestion';
import TextQuestion from '../components/TextQuestion';
import NumberQuestion from '../components/NumberQuestion';
import Button from '../components/Button';
import { apiService, type Question } from '../services/api';

type QuestionPageProps = {
    questionOrder: number;
    onAnswer: (answer: any) => void;
    onBack: () => void;
    totalQuestions?: number;
    isDark?: boolean;
    userId?: string;
    originCountry: string;
    destinationCountry: string;
    allAnswersCollected: Record<string, any>;
};

function QuestionPage({
                          questionOrder,
                          onAnswer,
                          onBack,
                          totalQuestions: propTotalQuestions = 20,
                          isDark = false,
                      }: QuestionPageProps) {
    const [question, setQuestion] = useState<Question | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exitDirection, setExitDirection] = useState<'left' | 'right'>('left');
    const { t, i18n } = useTranslation();
    const isEn = i18n.language === 'en';
    const [totalQuestions, setTotalQuestions] = useState(propTotalQuestions);

    useEffect(() => {
        setIsExiting(false);
        setQuestion(null);
        fetchTheQuestion(questionOrder);
        fetchTotalQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionOrder]);

    const fetchTotalQuestions = async () => {
        try {
            const questions = await apiService.getAllQuestions();
            setTotalQuestions(questions.length);
        } catch (err) {
            console.error('Erreur fetchTotalQuestions:', err);
        }
    };

    const fetchTheQuestion = async (order: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getQuestionByOrder(order);
            if (!data) {
                setError(t('quiz.nonTrouvee', { order }));
            } else {
                setQuestion(data);
            }
        } catch (err: any) {
            setError(err.message || t('quiz.erreurChargement'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerInternal = (answer: any) => {
        setExitDirection('left');
        setIsExiting(true);
        setTimeout(() => {
            onAnswer(answer);
        }, 700);
    };

    const handleBackClick = () => {
        setExitDirection('right');
        setIsExiting(true);
        setTimeout(() => {
            onBack();
        }, 700);
    };

    const questionTitle = i18n.language === 'en' && question?.labelEn ? question.labelEn : (question?.label || question?.text || '');
    const questionDescription = i18n.language === 'en' && question?.descriptionEn ? question.descriptionEn : (question?.description || '');
    const currentQuestionOrder = question?.order ?? questionOrder ?? 1;
    const progressPercentage = Math.round((currentQuestionOrder / totalQuestions) * 100);
    const translateClass = exitDirection === 'left' ? '-translate-x-full' : 'translate-x-full';

    return (
        <div className={`min-h-screen ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'} overflow-hidden`}>
            <div className={`min-h-screen ${isExiting ? `transition-transform duration-700 ease-in-out ${translateClass}` : 'translate-x-0'} pt-24 pb-12 px-4 sm:px-6 lg:px-8`}>
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <Button onClick={handleBackClick} variant="ghost" size="sm" disabled={isLoading}>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t('quiz.backButton')}
                        </Button>
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {t('quiz.questionProgress', { current: currentQuestionOrder, total: totalQuestions })}
                            </span>
                            <span className="text-sm font-medium text-brand-primary">
                                {progressPercentage}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-primary rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {isLoading && !error && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
                            <p className="text-neutral-600 dark:text-neutral-400">{t('common.loadingQuestion')}</p>
                        </div>
                    )}

                    {error && (
                        <div className={`rounded-xl border-2 p-6 mb-8 ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">{t('quiz.error')}</h3>
                                    <p className="text-red-700 dark:text-red-300 mb-3">{error}</p>
                                    <div className="flex gap-3">
                                        <Button onClick={() => fetchTheQuestion(currentQuestionOrder)} variant="outline" size="sm">
                                            {t('common.retry')}
                                        </Button>
                                        <Button onClick={handleBackClick} variant="ghost" size="sm">
                                            {t('quiz.returnHome')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {question && (questionTitle || questionDescription) && !isLoading && (
                        <div className="mb-8 text-center">
                            {questionTitle && (
                                <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
                                    {questionTitle}
                                </h2>
                            )}
                            {questionDescription && (
                                <p className="text-lg text-neutral-600 dark:text-neutral-400">
                                    {questionDescription}
                                </p>
                            )}
                        </div>
                    )}

                    {!error && question && !isLoading && (
                        <>
                            {question.type === "single_choice" && (
                                <SingleChoiceQuestion
                                    options={(isEn && question.optionsEn) ? question.optionsEn : (question.options ?? [])}
                                    onAnswer={handleAnswerInternal}
                                    isDark={isDark}
                                />
                            )}

                            {(question.type === "multi_choice") && (
                                <MultipleChoiceQuestion
                                    options={(isEn && question.optionsEn) ? question.optionsEn : (question.options ?? [])}
                                    onAnswer={handleAnswerInternal}
                                    isDark={isDark}
                                    minSelections={question.minSelections ?? 1}
                                    maxSelections={question.maxSelections}
                                    allowCustomAnswer={question.allowCustomAnswer ?? false}
                                    customAnswerPlaceholder={question.customAnswerPlaceholder ?? (isEn ? "Other (specify)..." : "Autre (précisez)...")}
                                />
                            )}

                            {question.type === "text" && (
                                <TextQuestion
                                    onAnswer={handleAnswerInternal}
                                    isDark={isDark}
                                    placeholder={question.placeholder ?? "Votre réponse..."}
                                    multiline={question.multiline ?? false}
                                    maxLength={question.maxLength}
                                    minLength={question.minLength ?? 1}
                                />
                            )}

                            {question.type === "number" && (
                                <NumberQuestion
                                    onAnswer={handleAnswerInternal}
                                    isDark={isDark}
                                    placeholder={question.placeholder ?? t('question.enterNumberFallback')}
                                    min={question.min}
                                    max={question.max}
                                    unit={question.unit}
                                />
                            )}

                            {question.type === "boolean" && (
                                <div className="flex flex-col sm:flex-row gap-8 justify-center my-8">
                                    <button
                                        onClick={() => handleAnswerInternal(true)}
                                        className={`flex-1 py-8 px-6 rounded-2xl border-2 font-bold text-2xl transition-all active:scale-95 shadow focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                                            isDark
                                                ? 'border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-brand-primary hover:text-white hover:border-brand-primary'
                                                : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-brand-primary hover:text-white hover:border-brand-primary'
                                        }`}
                                    >
                                        {t('common.yes')}
                                    </button>
                                    <button
                                        onClick={() => handleAnswerInternal(false)}
                                        className={`flex-1 py-8 px-6 rounded-2xl border-2 font-bold text-2xl transition-all active:scale-95 shadow focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                                            isDark
                                                ? 'border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-brand-primary hover:text-white hover:border-brand-primary'
                                                : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-brand-primary hover:text-neutral-400 hover:border-brand-primary'
                                        }`}
                                    >
                                        {t('common.no')}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuestionPage;
