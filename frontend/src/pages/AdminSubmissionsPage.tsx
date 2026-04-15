import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Button from '../components/Button';

type AdminSubmissionsPageProps = {
    isDark?: boolean;
    onBack: () => void;
};

interface Submission {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        nationality: string;
    } | null;
    originCountry: string;
    destinationCountry: string;
    score: number;
    status: string;
    analysis: any;
    answers: any;
    briefing: string;
    completedAt: string;
    createdAt: string;
}

function AdminSubmissionsPage({ isDark = false, onBack }: AdminSubmissionsPageProps) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [showDetails, setShowDetails] = useState<string | null>(null);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await apiService.getAllSubmissions();
            setSubmissions(data.submissions || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        const headers = [
            'Date', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Nationalité',
            'Origin', 'Destination', 'Score', 'Status', 'Raw Score', 'Max Score',
            'Hard Fails', 'Reasons',
            'Q3-Mineur', 'Q3ter-Âge', 'Q4-Visa History', 'Q5-Migration',
            'Q6-Casier', 'Q7-Programme', 'Q8-Admission', 'Q9-Langue',
            'Q10-Relevés', 'Q11-Frais', 'Q12-Gaps', 'Q13-Coherence',
            'Q14-Processus', 'Q15-Intention', 'Q16-Mensuels', 'Q17-Financement',
            'Q18-Montant', 'Q19-Bourse', 'Q20-Sponsor',
            'Briefing Complet'
        ];

        const escapeCsv = (val: any) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const cleanBriefing = (text: string) => {
            if (!text) return '';
            // Remove markdown headers, bold markers, bullet points, links
            return text
                .replace(/#{1,6}\s*/g, '')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .replace(/`/g, '')
                .replace(/\n+/g, ' | ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const rows = submissions.map(s => [
            new Date(s.createdAt).toLocaleString('fr-FR'),
            escapeCsv(s.user?.firstName),
            escapeCsv(s.user?.lastName),
            escapeCsv(s.user?.email),
            escapeCsv(s.user?.phone),
            escapeCsv(s.user?.nationality),
            escapeCsv(s.originCountry),
            escapeCsv(s.destinationCountry),
            s.score,
            s.status,
            s.analysis?.rawScore ?? '',
            s.analysis?.maxScore ?? '',
            escapeCsv(Array.isArray(s.analysis?.hardFails) ? s.analysis.hardFails.join('; ') : ''),
            escapeCsv(Array.isArray(s.analysis?.reasons) ? s.analysis.reasons.join('; ') : ''),
            escapeCsv(s.answers?.Q3_is_minor || ''),
            escapeCsv(s.answers?.Q3ter_age_range || ''),
            escapeCsv(s.answers?.Q4_visa_history || ''),
            escapeCsv(s.answers?.Q5_migration_issues || ''),
            escapeCsv(s.answers?.Q6_criminal_record || ''),
            escapeCsv(s.answers?.Q7_program_type || ''),
            escapeCsv(s.answers?.Q8_admission_status || ''),
            escapeCsv(s.answers?.Q9_language_level_status || ''),
            escapeCsv(s.answers?.Q10_transcripts_available ?? ''),
            escapeCsv(s.answers?.Q11_tuition_payment_proof ?? ''),
            escapeCsv(s.answers?.Q12_gaps_justified || ''),
            escapeCsv(s.answers?.Q13_project_coherence || ''),
            escapeCsv(s.answers?.Q14_official_process_started ?? ''),
            escapeCsv(s.answers?.Q15_main_intent_study ?? ''),
            escapeCsv(s.answers?.Q16_monthly_means_ratio || ''),
            escapeCsv(Array.isArray(s.answers?.Q17_funding_sources) ? s.answers.Q17_funding_sources.join('; ') : ''),
            escapeCsv(s.answers?.Q18_first_year_amount_eur || ''),
            escapeCsv(s.answers?.Q19_scholarship_proof || ''),
            escapeCsv(s.answers?.Q20_sponsor_commitment ?? ''),
            escapeCsv(cleanBriefing(s.briefing || ''))
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `submissions_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ELIGIBLE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'MITIGE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'FAIBLE': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            case 'A_RISQUE': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            Soumissions
                        </h1>
                        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                            Liste des tests soumis par les candidats
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleExportCSV} variant="outline" disabled={submissions.length === 0}>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export CSV
                        </Button>
                        <Button onClick={onBack} variant="outline">
                            Retour
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className={`p-6 rounded-xl border-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Total</p>
                        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{submissions.length}</p>
                    </div>
                    <div className={`p-6 rounded-xl border-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Éligibles</p>
                        <p className={`text-3xl font-bold text-green-500`}>{submissions.filter(s => s.status === 'ELIGIBLE').length}</p>
                    </div>
                    <div className={`p-6 rounded-xl border-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>À risque</p>
                        <p className={`text-3xl font-bold text-red-500`}>{submissions.filter(s => s.status === 'A_RISQUE').length}</p>
                    </div>
                    <div className={`p-6 rounded-xl border-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Score moyen</p>
                        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {submissions.length > 0 ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length) : 0}
                        </p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                        {error}
                    </div>
                )}

                {/* Submissions Table */}
                <div className={`rounded-2xl border-2 p-6 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Aucune soumission pour le moment</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-sm ${isDark ? 'text-neutral-400 border-neutral-700' : 'text-neutral-600 border-neutral-200'} border-b`}>
                                        <th className="pb-3 font-medium">Date</th>
                                        <th className="pb-3 font-medium">Nom</th>
                                        <th className="pb-3 font-medium">Email</th>
                                        <th className="pb-3 font-medium">Téléphone</th>
                                        <th className="pb-3 font-medium">Origin</th>
                                        <th className="pb-3 font-medium">Destination</th>
                                        <th className="pb-3 font-medium">Score</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((sub) => (
                                        <>
                                            <tr key={sub.id} className={`border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                                                <td className={`py-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    {new Date(sub.createdAt).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className={`py-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    {sub.user ? `${sub.user.firstName} ${sub.user.lastName}` : '—'}
                                                </td>
                                                <td className={`py-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    {sub.user?.email || '—'}
                                                </td>
                                                <td className={`py-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    {sub.user?.phone || '—'}
                                                </td>
                                                <td className={`py-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    {sub.originCountry}
                                                </td>
                                                <td className={`py-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    {sub.destinationCountry}
                                                </td>
                                                <td className={`py-3 font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                    {sub.score}/100
                                                </td>
                                                <td className="py-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(sub.status)}`}>
                                                        {sub.status}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setShowDetails(showDetails === sub.id ? null : sub.id)}
                                                            className="text-xs text-blue-500 hover:underline"
                                                        >
                                                            {showDetails === sub.id ? 'Masquer' : 'Détails'}
                                                        </button>
                                                        {sub.briefing && (
                                                            <button
                                                                onClick={() => setSelectedSubmission(sub)}
                                                                className="text-xs text-brand-primary hover:underline"
                                                            >
                                                                Briefing
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {showDetails === sub.id && (
                                                <tr>
                                                    <td colSpan={9} className={`py-4 px-4 ${isDark ? 'bg-neutral-700/50' : 'bg-neutral-50'}`}>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                            <div>
                                                                <span className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Programme:</span>
                                                                <p className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>{sub.answers?.Q7_program_type || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <span className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Admission:</span>
                                                                <p className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>{sub.answers?.Q8_admission_status || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <span className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Langue:</span>
                                                                <p className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>{sub.answers?.Q9_language_level_status || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <span className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Montant:</span>
                                                                <p className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>{sub.answers?.Q18_first_year_amount_eur || '—'} €</p>
                                                            </div>
                                                            <div>
                                                                <span className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Financement:</span>
                                                                <p className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>
                                                                    {Array.isArray(sub.answers?.Q17_funding_sources) ? sub.answers.Q17_funding_sources.join(', ') : '—'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Visa History:</span>
                                                                <p className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>{sub.answers?.Q4_visa_history || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <span className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Migrants:</span>
                                                                <p className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>{sub.answers?.Q5_migration_issues || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <span className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Casier:</span>
                                                                <p className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>{sub.answers?.Q6_criminal_record || '—'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Briefing Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className={`relative w-full max-w-3xl rounded-2xl shadow-2xl my-8 max-h-[80vh] overflow-y-auto ${isDark ? 'bg-neutral-800 border-2 border-neutral-700' : 'bg-white'}`}>
                        <button
                            onClick={() => setSelectedSubmission(null)}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-6">
                            <div className="mb-4">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(selectedSubmission.status)}`}>
                                    {selectedSubmission.status}
                                </span>
                                <span className={`ml-3 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    Score: {selectedSubmission.score}/100
                                </span>
                            </div>

                            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                Briefing AI
                            </h3>

                            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                                <pre className={`whitespace-pre-wrap text-sm font-sans ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    {selectedSubmission.briefing}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminSubmissionsPage;
