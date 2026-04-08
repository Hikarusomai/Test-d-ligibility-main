import { useState, useEffect } from 'react';
import { apiService, type SavedTest } from '../services/api';
import Button from '../components/Button';

type DashboardPageProps = {
    isDark?: boolean;
    onStartNewTest: () => void;
    onViewBriefing?: (test: SavedTest) => void; // 👈 Nouvelle prop
};

function DashboardPage({ isDark = false, onStartNewTest, onViewBriefing }: DashboardPageProps) {
    const [tests, setTests] = useState<SavedTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const user = apiService.getStoredUser();

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await apiService.getMyTests();
            setTests(response.tests);
            console.log('✅ Tests loaded:', response.tests);
        } catch (err: any) {
            console.error('❌ Error loading tests:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTest = async (testId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) return;

        try {
            await apiService.deleteTest(testId);
            setTests(tests.filter(t => t.id !== testId));
            alert('Test supprimé avec succès');
        } catch (err: any) {
            alert(`Erreur: ${err.message}`);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 ${
            isDark ? 'bg-neutral-900' : 'bg-neutral-50'
        }`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        Mon Dashboard
                    </h1>
                    <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                        Bienvenue {user?.firstName || user?.email} ! Voici l'historique de vos tests.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className={`p-6 rounded-xl border-2 ${
                        isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                    }`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    Tests complétés
                                </p>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                    {tests.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 rounded-xl border-2 ${
                        isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                    }`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    Score moyen
                                </p>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                    {tests.length > 0
                                        ? Math.round(tests.reduce((acc, t) => acc + t.score, 0) / tests.length)
                                        : 0
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 rounded-xl border-2 ${
                        isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                    }`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                </svg>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    Destinations testées
                                </p>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                    {new Set(tests.map(t => t.destinationCountry)).size}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* New Test Button */}
                <div className="mb-6">
                    <Button onClick={onStartNewTest} variant="primary" size="lg">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nouveau test d'éligibilité
                    </Button>
                </div>

                {/* Tests List */}
                <div className={`rounded-2xl border-2 p-6 ${
                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                }`}>
                    <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        Historique des tests
                    </h2>

                    {isLoading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
                            <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                                Chargement...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12">
                            <p className="text-red-500 mb-4">{error}</p>
                            <Button onClick={fetchTests} variant="outline">
                                Réessayer
                            </Button>
                        </div>
                    )}

                    {!isLoading && !error && tests.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className={`text-lg mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Vous n'avez pas encore complété de test
                            </p>
                            <Button onClick={onStartNewTest} variant="primary">
                                Commencer mon premier test
                            </Button>
                        </div>
                    )}

                    {!isLoading && !error && tests.length > 0 && (
                        <div className="space-y-4">
                            {tests.map((test) => (
                                <div
                                    key={test.id}
                                    className={`p-4 rounded-lg border-2 ${
                                        isDark ? 'bg-neutral-700 border-neutral-600' : 'bg-neutral-50 border-neutral-200'
                                    }`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          {test.originCountry}
                        </span>
                                                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          {test.destinationCountry}
                        </span>
                                            </div>
                                            <p className={`text-sm mb-3 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                {formatDate(test.completedAt)}
                                            </p>
                                            <div className="flex items-center gap-4 flex-wrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            test.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        }`}>
                          {test.status === 'completed' ? 'Complété' : 'En attente'}
                        </span>
                                                <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          Score: <span className="font-bold text-brand-primary text-base">{test.score}</span>
                        </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Bouton Voir briefing */}
                                            {onViewBriefing && (
                                                <button
                                                    onClick={() => onViewBriefing(test)}
                                                    className="p-2 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition-colors flex items-center gap-1 px-3"
                                                    title="Voir le briefing"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="text-sm font-medium">Briefing</span>
                                                </button>
                                            )}
                                            {/* Bouton supprimer */}
                                            <button
                                                onClick={() => handleDeleteTest(test.id)}
                                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Supprimer"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
