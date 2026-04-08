import { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import OriginCountryPage from './pages/OriginCountryPage';
import DestinationCountryPage from './pages/DestinationCountryPage';
import QuestionPage from './pages/QuestionPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import StudentManagementPage from './pages/StudentManagementPage';
import { apiService } from './services/api';
import ChatbotWidget from './components/ChatbotWidget';
import { marked } from 'marked';
import { ORIGIN_COUNTRIES } from './data/origin-countries';
import { DESTINATION_COUNTRIES } from './data/destination-countries';

type Page = 'home' | 'origin' | 'destination' | 'questions' | 'result' | 'dashboard' | 'admin' | 'students' | 'briefing';

function App() {
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [isDark, setIsDark] = useState(false);
    const [originCountry, setOriginCountry] = useState<string>('');
    const [destinationCountry, setDestinationCountry] = useState<string>('');
    const [currentQuestionOrder, setCurrentQuestionOrder] = useState<number>(3);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [totalQuestions, setTotalQuestions] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);
    const [submitError, setSubmitError] = useState<string>('');
    const [gatingResult, setGatingResult] = useState<{ reason: string } | null>(null);
    const [selectedTest, setSelectedTest] = useState<any>(null);
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [allQuestions, setAllQuestions] = useState<any[]>([]);
    const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);

    const fetchTotalQuestions = async () => {
        try {
            const questions = await apiService.getAllQuestions();
            setAllQuestions(questions);
            const count = questions.length;
            setTotalQuestions(count);
            return count;
        } catch {
            setTotalQuestions(20);
            return 20;
        }
    };

    useEffect(() => {
        async function fetchUser() {
            try {
                const currentUser = await apiService.getCurrentUser();
                setUser(currentUser);
            } catch {
                setUser(null);
            }
        }
        fetchUser();
        fetchTotalQuestions();
    }, []);

    const getEnglishCountryName = (
        nameFr: string,
        list: { name: string; nameEn: string }[]
    ) => {
        const found = list.find((c) => c.name === nameFr);
        return found ? found.nameEn : nameFr;
    };

    const handleStartTest = async () => {
        await fetchTotalQuestions();
        setCurrentPage('origin');
    };

    const handleNavigateToDashboard = () => {
        setCurrentPage('dashboard');
    };

    const handleNavigateToAdmin = () => {
        setCurrentPage('admin');
    };

    const handleNavigateToStudents = () => {
        setCurrentPage('students');
    };

    const handleStartNewTest = async () => {
        await fetchTotalQuestions();
        setCurrentPage('origin');
        setOriginCountry('');
        setDestinationCountry('');
        setCurrentQuestionOrder(3);
        setAnswers({});
        setSubmitResult(null);
        setSubmitError('');
        setGatingResult(null);
    };

    const handleViewBriefing = (test: any) => {
        setSelectedTest(test);
        setCurrentPage('briefing');
    };

    const handleOriginSelect = (country: string) => {
        setOriginCountry(country);
        setAnswers(prev => ({ ...prev, 1: country }));
        setCurrentPage('destination');
    };

    const handleDestinationSelect = (destination: string) => {
        setDestinationCountry(destination);
        setAnswers(prev => ({ ...prev, 2: destination }));
        setCurrentPage('questions');
        setCurrentQuestionOrder(3);
    };

    const handleAnswer = async (answer: any) => {
        setIsProcessingAnswer(true);
        const updatedAnswers = { ...answers, [currentQuestionOrder]: answer };
        setAnswers(updatedAnswers);

        // Gating Logic: Check for elimination answers
        const gatingChecks: Record<string, any> = {
            "Q3bis_parental_consent": "Non",
            "Q4_visa_history": "Déjà refusé - non corrigé",
            "Q5_migration_issues": "Oui - grave (expulsion, interdiction, fraude)",
            "Q6_criminal_record": "Oui - grave (violence, fraude, immigration)"
        };

        try {
            const questions = allQuestions.length > 0 ? allQuestions : await apiService.getAllQuestions();
            if (allQuestions.length === 0) setAllQuestions(questions);

            const currentQuestion = questions.find(q => q.order === currentQuestionOrder);

            if (currentQuestion && gatingChecks[currentQuestion.key]) {
                const gatingValue = gatingChecks[currentQuestion.key];
                if (String(gatingValue).toLowerCase() === String(answer).toLowerCase()) {
                    setGatingResult({ reason: "Votre profil présente un point bloquant majeur pour l'obtention d'un visa." });
                    setCurrentPage('result');
                    setIsProcessingAnswer(false);
                    return;
                }
            }

            // Trouver la prochaine question valide
            let nextOrder = currentQuestionOrder + 1;
            let nextQuestion = null;

            while (nextOrder <= totalQuestions) {
                const q = questions.find(q => q.order === nextOrder && q.isActive);
                if (!q) {
                    nextOrder++;
                    continue;
                }

                // Vérifier la condition d'affichage
                if (q.conditionalDisplay) {
                    const dependsOnQuestion = questions.find(dq => dq.key === q.conditionalDisplay?.dependsOn);
                    if (dependsOnQuestion) {
                        const previousAnswer = updatedAnswers[dependsOnQuestion.order];
                        if (String(previousAnswer).toLowerCase() !== String(q.conditionalDisplay.showWhen).toLowerCase()) {
                            nextOrder++;
                            continue;
                        }
                    }
                }

                nextQuestion = q;
                break;
            }

            if (nextQuestion) {
                setCurrentQuestionOrder(nextOrder);
                setIsProcessingAnswer(false);
            } else {
                setCurrentPage('result');
                setIsProcessingAnswer(false);
                await submitTest(updatedAnswers);
            }
        } catch (error) {
            console.error("Error in handleAnswer:", error);
            setCurrentPage('result');
            setIsProcessingAnswer(false);
            await submitTest(updatedAnswers);
        }
    };

    const submitTest = async (finalAnswers: Record<number, any>) => {
        setIsSubmitting(true);
        setSubmitError('');

        try {
            if (!apiService.isAuthenticated()) {
                throw new Error('Vous devez être connecté pour soumettre le test');
            }

            const questions = allQuestions.length > 0 ? allQuestions : await apiService.getAllQuestions();

            const answersFormatted: Record<string, any> = {};

            answersFormatted['origin_country'] = originCountry;
            answersFormatted['destination_country'] = destinationCountry;

            Object.entries(finalAnswers).forEach(([order, value]) => {
                const orderNum = parseInt(order);
                if (orderNum > 2) {
                    const question = questions.find(q => q.order === orderNum);
                    if (question) {
                        answersFormatted[question.key] = value;
                    }
                }
            });

            const result = await apiService.submitTest({
                originCountry: getEnglishCountryName(originCountry, ORIGIN_COUNTRIES),
                destinationCountry: getEnglishCountryName(destinationCountry, DESTINATION_COUNTRIES),
                answers: answersFormatted,
            });

            setSubmitResult(result);
            setIsSubmitting(false);
        } catch (error: any) {
            setSubmitError(error.message);
            setIsSubmitting(false);
        }
    };

    const handleBack = async () => {
        if (currentPage === 'origin') {
            setCurrentPage('home');
        } else if (currentPage === 'destination') {
            setCurrentPage('origin');
        } else if (currentPage === 'questions') {
            if (currentQuestionOrder > 3) {
                try {
                    const questions = allQuestions.length > 0 ? allQuestions : await apiService.getAllQuestions();
                    let prevOrder = currentQuestionOrder - 1;

                    while (prevOrder >= 3) {
                        const q = questions.find(q => q.order === prevOrder && q.isActive);
                        if (!q) {
                            prevOrder--;
                            continue;
                        }

                        if (q.conditionalDisplay) {
                            const dependsOnQuestion = questions.find(dq => dq.key === q.conditionalDisplay?.dependsOn);
                            if (dependsOnQuestion) {
                                const previousAnswer = answers[dependsOnQuestion.order];
                                if (String(previousAnswer).toLowerCase() !== String(q.conditionalDisplay.showWhen).toLowerCase()) {
                                    prevOrder--;
                                    continue;
                                }
                            }
                        }
                        break;
                    }

                    if (prevOrder >= 3) {
                        setCurrentQuestionOrder(prevOrder);
                    } else {
                        setCurrentPage('destination');
                    }
                } catch {
                    setCurrentPage('destination');
                }
            } else {
                setCurrentPage('destination');
            }
        }
    };

    const handleRestart = () => {
        setCurrentPage('home');
        setOriginCountry('');
        setDestinationCountry('');
        setCurrentQuestionOrder(3);
        setAnswers({});
        setSubmitResult(null);
        setSubmitError('');
        setGatingResult(null);
    };

    const BriefingContent = ({ data, onBack }: { data: any; onBack: () => void }) => (
        <div className="min-h-screen px-4 py-24">
            <div className="max-w-7xl mx-auto mb-6">
                <button
                    onClick={onBack}
                    className={`px-6 py-3 border-2 border-brand-primary text-brand-primary rounded-lg hover:bg-brand-primary/5 transition-colors font-medium ${isDark ? 'bg-transparent' : 'bg-white'
                        }`}
                >
                    Retour
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className={`w-full p-8 rounded-2xl border-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                    }`}>
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                            Votre Briefing Personnalisé
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                            Analyse complète de votre éligibilité
                        </p>

                        <div className="inline-block">
                            <div className="text-7xl font-bold text-brand-primary mb-2">
                                {data.score}
                                <span className="text-3xl text-neutral-400">/100</span>
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Score d'éligibilité
                            </p>
                        </div>
                    </div>

                    <div className={`p-6 rounded-xl mb-8 ${isDark ? 'bg-neutral-700' : 'bg-neutral-50'
                        }`}>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                    🌍 Pays d'origine
                                </p>
                                <p className="font-bold text-xl text-neutral-900 dark:text-white">
                                    {data.originCountry}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                    🎯 Destination
                                </p>
                                <p className="font-bold text-xl text-neutral-900 dark:text-white">
                                    {data.destinationCountry}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                    📊 Questions répondues
                                </p>
                                <p className="font-bold text-xl text-neutral-900 dark:text-white">
                                    {totalQuestions}/{totalQuestions}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                    📅 Date
                                </p>
                                <p className="font-bold text-xl text-neutral-900 dark:text-white">
                                    {new Date(data.completedAt).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 rounded-xl mb-8 ${isDark ? 'bg-neutral-700' : 'bg-neutral-50'
                        }`}>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Analyse de votre profil
                        </h2>
                        <div className="space-y-4">
                            <div className="prose max-w-none text-blue-900 dark:text-blue-100"
                                dangerouslySetInnerHTML={{ __html: data.briefing ? marked.parse(data.briefing) : '' }} />
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                            🎯 Actions recommandées
                        </h2>
                        <div className="space-y-4">
                            {data.score >= 80 ? (
                                <>
                                    <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded-r-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">✅</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900 dark:text-white text-lg mb-1">Excellent profil !</p>
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    → Préparez votre dossier complet et soumettez votre demande de visa dès que possible.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">📄</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900 dark:text-white text-lg mb-1">Documents requis</p>
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    → Rassemblez tous les documents : diplômes, relevés bancaires, lettre d'admission, certificats de langue.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-r-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">🏛️</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900 dark:text-white text-lg mb-1">Rendez-vous consulaire</p>
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    → Prenez rendez-vous au consulat dès maintenant pour éviter les délais d'attente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : data.score >= 60 ? (
                                <>
                                    <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-r-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">🟡</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900 dark:text-white text-lg mb-1">Profil prometteur</p>
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    → Améliorez votre niveau de langue (IELTS/TOEFL/DELF) et préparez une lettre de motivation convaincante.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">💰</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900 dark:text-white text-lg mb-1">Preuves financières</p>
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    → Préparez des preuves solides de financement (relevés bancaires, bourses, garants).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-r-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">📝</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900 dark:text-white text-lg mb-1">Projet d'études</p>
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    → Clarifiez votre projet professionnel et sa cohérence avec le programme choisi.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-r-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">🔴</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900 dark:text-white text-lg mb-1">Dossier à renforcer</p>
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    → Travaillez sur vos qualifications académiques et linguistiques avant de postuler.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-r-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">📚</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900 dark:text-white text-lg mb-1">Formation préparatoire</p>
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    → Suivez une formation préparatoire ou des cours intensifs de langue pour augmenter vos chances.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-l-4 border-pink-500 bg-pink-50 dark:bg-pink-900/20 p-4 rounded-r-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">👨‍🎓</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900 dark:text-white text-lg mb-1">Conseiller en orientation</p>
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    → Consultez un conseiller spécialisé pour construire un dossier solide.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => window.print()}
                            className="px-8 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Télécharger PDF
                        </button>
                        <button
                            onClick={handleRestart}
                            className="px-8 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors font-semibold"
                        >
                            Nouveau test
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={isDark ? 'dark' : ''}>
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors">
                <Header
                    isDark={isDark}
                    onToggleTheme={() => setIsDark(!isDark)}
                    onNavigateToDashboard={handleNavigateToDashboard}
                    onNavigateToAdmin={handleNavigateToAdmin}
                />

                {currentPage === 'home' && (
                    <HomePage onStartTest={handleStartTest} isDark={isDark} />
                )}

                {currentPage === 'dashboard' && (
                    <DashboardPage
                        isDark={isDark}
                        onStartNewTest={handleStartNewTest}
                        onViewBriefing={handleViewBriefing}
                    />
                )}

                {currentPage === 'admin' && (
                    <AdminDashboardPage
                        isDark={isDark}
                        onBack={() => setCurrentPage('dashboard')}
                        onNavigateToStudents={handleNavigateToStudents}
                    />
                )}

                {currentPage === 'students' && (
                    <StudentManagementPage
                        isDark={isDark}
                        onBack={() => setCurrentPage('admin')}
                    />
                )}

                {currentPage === 'origin' && (
                    <OriginCountryPage
                        onOriginSelect={handleOriginSelect}
                        onBack={handleBack}
                        isDark={isDark}
                        totalQuestions={totalQuestions}
                    />
                )}

                {currentPage === 'destination' && (
                    <DestinationCountryPage
                        originCountry={originCountry}
                        onDestinationSelect={handleDestinationSelect}
                        onBack={handleBack}
                        isDark={isDark}
                        totalQuestions={totalQuestions}
                    />
                )}

                {currentPage === 'questions' && (
                    <QuestionPage
                        originCountry={originCountry}
                        destinationCountry={destinationCountry}
                        questionOrder={currentQuestionOrder}
                        onAnswer={handleAnswer}
                        onBack={handleBack}
                        isDark={isDark}
                        totalQuestions={totalQuestions}
                        userId={user?.id ?? ''}
                        allAnswersCollected={answers}
                    />
                )}

                {currentPage === 'result' && submitResult && (
                    <BriefingContent
                        data={submitResult.submission}
                        onBack={handleNavigateToDashboard}
                    />
                )}

                {currentPage === 'briefing' && selectedTest && (
                    <BriefingContent
                        data={selectedTest}
                        onBack={handleNavigateToDashboard}
                    />
                )}

                {currentPage === 'result' && !submitResult && (
                    <div className="min-h-screen flex items-center justify-center px-4 py-24">
                        <div
                            className={`max-w-2xl w-full text-center p-8 rounded-2xl border-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                                }`}
                        >
                            {gatingResult ? (
                                <div>
                                    <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                        <svg className="w-12 h-12 text-red-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
                                        Profil non éligible
                                    </h2>
                                    <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                                        {gatingResult.reason}
                                    </p>
                                    <button
                                        onClick={handleRestart}
                                        className="px-8 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors font-semibold"
                                    >
                                        Recommencer le test
                                    </button>
                                </div>
                            ) : (isSubmitting || isProcessingAnswer) ? (
                                <div>
                                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mb-4" />
                                    <h2
                                        className="text-3xl font-bold text-neutral-900 dark:text-white mb-4"
                                    >
                                        {isProcessingAnswer ? "Analyse de votre réponse..." : "Génération de votre briefing..."}
                                    </h2>
                                    <p className="text-lg text-neutral-600 dark:text-neutral-400">
                                        Veuillez patienter quelques instants
                                    </p>
                                </div>
                            ) : null}

                            {submitError && !isSubmitting && !isProcessingAnswer && (
                                <div>
                                    <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-12 h-12 text-red-600 dark:text-red-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </div>
                                    <h2
                                        className="text-3xl font-bold text-neutral-900 dark:text-white mb-4"
                                    >
                                        Erreur
                                    </h2>
                                    <p className="text-lg text-red-600 dark:text-red-400 mb-6">
                                        {submitError}
                                    </p>
                                    <button
                                        onClick={() => submitTest(answers)}
                                        className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors font-semibold"
                                    >
                                        Réessayer
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <ChatbotWidget isDark={isDark} />
            </div>
        </div>
    );
}

export default App;
