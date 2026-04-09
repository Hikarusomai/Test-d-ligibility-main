import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface BriefingData {
    score: number;
    analysis: any;
    briefing: string;
    recommendations: Array<{
        priority: string;
        category: string;
        message: string;
        action?: string;
    }>;
}

export default function Briefing() {
    const { t, i18n } = useTranslation();
    const { submissionId } = useParams();
    const [briefing, setBriefing] = useState<BriefingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBriefing();
    }, [submissionId]);

    const fetchBriefing = async () => {
        try {
            setLoading(true);
            // Utilise bien le bon endpoint backend :
            const response = await axios.get(
                `https://hackspice-backend.onrender.com/api/tests/briefing/${submissionId}?lang=${i18n.language}`
            );
            console.log('API Briefing Response:', response.data);
            setBriefing(response.data);
            setError(null);
        } catch (error: any) {
            console.error('Erreur chargement briefing:', error);
            setError(
                error.response?.data?.message ||
                error.message ||
                t('result.errorLoadingBriefing')
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">{t('result.generatingBriefing')}</p>
                    <p className="text-sm text-gray-500 mt-2">{t('result.pleaseWait')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-bold text-red-800 mb-2">{t('quiz.error')}</h2>
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        {t('result.returnDashboard')}
                    </button>
                </div>
            </div>
        );
    }

    if (!briefing) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="text-center">
                    <p>{t('result.noData')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Debug info */}
            <pre className="p-2 bg-gray-100 border mb-4 rounded text-xs max-w-full overflow-x-auto">
                {JSON.stringify(briefing, null, 2)}
            </pre>

            {/* Bouton retour en haut à gauche */}
            <div className="mb-6">
                <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 rounded-lg border-2 border-gray-200 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium">{t('result.returnDashboard')}</span>
                </button>
            </div>

            {/* Contenu du briefing */}
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Score */}
                    <div className="mb-8 text-center">
                        <div className="inline-block">
                            <div className={`text-6xl font-bold ${
                                briefing.score >= 80 ? 'text-green-600' :
                                    briefing.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {briefing.score}
                                <span className="text-2xl text-gray-500">/100</span>
                            </div>
                        </div>
                    </div>

                    {/* Briefing texte markdown */}
                    <div className="prose prose-lg max-w-none mb-8">
                        <ReactMarkdown>
                            {briefing.briefing || t('result.noBriefing')}
                        </ReactMarkdown>
                    </div>

                    {/* Recommandations */}
                    {briefing.recommendations && briefing.recommendations.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold mb-4">{t('result.recommendedActions')}</h2>
                            <div className="space-y-4">
                                {briefing.recommendations.map((rec, index) => (
                                    <div
                                        key={index}
                                        className={`border-l-4 p-4 rounded-r-lg ${
                                            rec.priority === 'high'
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-yellow-500 bg-yellow-50'
                                        }`}
                                    >
                                        <div className="flex items-start">
                                            <span className="font-semibold mr-2 text-xl">
                                                {rec.priority === 'high' ? '🔴' : '🟡'}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-white">
                                                        {rec.category}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-gray-800 mb-1">{rec.message}</p>
                                                {rec.action && (
                                                    <p className="text-sm text-gray-600 mt-1">→ {rec.action}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => window.print()}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            {t('common.downloadPdf')}
                        </button>
                        <button
                            onClick={fetchBriefing}
                            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {t('result.regenerateWithAI')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
