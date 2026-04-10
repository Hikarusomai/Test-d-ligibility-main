import { useState, useEffect } from 'react';
import { apiService, type Question } from '../services/api';
import Button from '../components/Button';

type AdminDashboardPageProps = {
    isDark?: boolean;
    onBack: () => void;
    onViewSubmissions: () => void;
};

function AdminDashboardPage({ isDark = false, onBack, onViewSubmissions }: AdminDashboardPageProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await apiService.getAllQuestions();
            setQuestions(data.sort((a, b) => a.order - b.order));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportData = () => {
        const headers = ['order', 'key', 'label', 'labelEn', 'type', 'category', 'weight', 'isActive'];
        const rows = questions.map(q => [
            q.order,
            q.key,
            (q.label || '').replace(/,/g, ';'),
            ((q as any).labelEn || '').replace(/,/g, ';'),
            q.type,
            q.category,
            q.weight,
            q.isActive
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'questions_export.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) return;

        try {
            await apiService.deleteQuestion(id);
            setQuestions(questions.filter(q => q._id !== id));
            alert('Question supprimée avec succès');
        } catch (err: any) {
            alert(`Erreur: ${err.message}`);
        }
    };

    return (
        <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 ${
            isDark ? 'bg-neutral-900' : 'bg-neutral-50'
        }`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            Dashboard Admin
                        </h1>
                        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                            Gérez les questions du questionnaire
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleExportData} variant="outline" disabled={questions.length === 0}>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export questions
                        </Button>
                        <Button onClick={onViewSubmissions} variant="outline">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Voir soumissions
                        </Button>
                        <Button onClick={() => setIsAddingNew(true)} variant="primary">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nouvelle question
                        </Button>
                        <Button onClick={onBack} variant="outline">
                            Retour
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className={`p-6 rounded-xl border-2 ${
                        isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                    }`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Total questions
                        </p>
                        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {questions.length}
                        </p>
                    </div>
                    <div className={`p-6 rounded-xl border-2 ${
                        isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                    }`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Choix multiple
                        </p>
                        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {questions.filter(q => q.type === 'multi_choice').length}
                        </p>
                    </div>
                    <div className={`p-6 rounded-xl border-2 ${
                        isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                    }`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Choix unique
                        </p>
                        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {questions.filter(q => q.type === 'single_choice').length}
                        </p>
                    </div>
                    <div className={`p-6 rounded-xl border-2 ${
                        isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                    }`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Autres types
                        </p>
                        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {questions.filter(q => !['multi_choice', 'single_choice'].includes(q.type)).length}
                        </p>
                    </div>
                </div>

                {/* Questions List */}
                <div className={`rounded-2xl border-2 p-6 ${
                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                }`}>
                    <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        Liste des questions
                    </h2>

                    {isLoading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12">
                            <p className="text-red-500 mb-4">{error}</p>
                            <Button onClick={fetchQuestions} variant="outline">Réessayer</Button>
                        </div>
                    )}

                    {!isLoading && !error && (
                        <div className="space-y-3">
                            {questions.map((question) => (
                                <div
                                    key={question._id}
                                    className={`p-4 rounded-lg border-2 ${
                                        isDark ? 'bg-neutral-700 border-neutral-600' : 'bg-neutral-50 border-neutral-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                            isDark ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-primary/10 text-brand-primary'
                        }`}>
                          #{question.order}
                        </span>
                                                <span className={`text-sm px-2 py-1 rounded ${
                                                    isDark ? 'bg-neutral-600 text-neutral-300' : 'bg-neutral-200 text-neutral-700'
                                                }`}>
                          {question.type}
                        </span>
                                                <span className={`text-sm px-2 py-1 rounded ${
                                                    isDark ? 'bg-neutral-600 text-neutral-300' : 'bg-neutral-200 text-neutral-700'
                                                }`}>
                          {question.category}
                        </span>
                                            </div>
                                            <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                {question.label}
                                            </p>
                                            {question.options && question.options.length > 0 && (
                                                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                    {question.options.length} option(s)
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingQuestion(question)}
                                                className="p-2 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition-colors"
                                                title="Modifier"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuestion(question._id)}
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

            {/* Edit/Add Modal */}
            {(editingQuestion || isAddingNew) && (
                <QuestionModal
                    question={editingQuestion}
                    isDark={isDark}
                    onClose={() => {
                        setEditingQuestion(null);
                        setIsAddingNew(false);
                    }}
                    onSave={() => {
                        fetchQuestions();
                        setEditingQuestion(null);
                        setIsAddingNew(false);
                    }}
                />
            )}
        </div>
    );
}

// Modal de modification/ajout
function QuestionModal({
                           question,
                           isDark,
                           onClose,
                           onSave
                       }: {
    question: Question | null;
    isDark: boolean;
    onClose: () => void;
    onSave: () => void;
}) {
    const [formData, setFormData] = useState({
        label: question?.label || '',
        key: question?.key || '',
        category: question?.category || '',
        type: question?.type || 'single_choice' as any,
        options: question?.options?.join('\n') || '',
        order: question?.order || 1,
        weight: question?.weight || 0,
        isRequired: question?.isRequired ?? true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const questionData = {
                ...formData,
                options: formData.options ? formData.options.split('\n').filter(o => o.trim()) : []
            };

            if (question) {
                await apiService.updateQuestion(question._id, questionData);
            } else {
                await apiService.createQuestion(questionData);
            }

            onSave();
        } catch (err: any) {
            setError(err.message);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl my-8 ${
                isDark ? 'bg-neutral-800 border-2 border-neutral-700' : 'bg-white'
            }`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6">
                    <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {question ? 'Modifier la question' : 'Nouvelle question'}
                    </h2>

                    {error && (
                        <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    Label *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.label}
                                    onChange={(e) => setFormData({...formData, label: e.target.value})}
                                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                                        isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    Key *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.key}
                                    onChange={(e) => setFormData({...formData, key: e.target.value})}
                                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                                        isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                    }`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    Type *
                                </label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                                        isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                    }`}
                                >
                                    <option value="single_choice">Choix unique</option>
                                    <option value="multi_choice">Choix multiple</option>
                                    <option value="boolean">Oui/Non</option>
                                    <option value="text">Texte</option>
                                    <option value="number">Nombre</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    Catégorie *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                                        isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    Ordre *
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.order}
                                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                                        isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                    }`}
                                />
                            </div>
                        </div>

                        {(formData.type === 'single_choice' || formData.type === 'multi_choice') && (
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    Options (une par ligne)
                                </label>
                                <textarea
                                    rows={5}
                                    value={formData.options}
                                    onChange={(e) => setFormData({...formData, options: e.target.value})}
                                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                                        isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                    }`}
                                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button type="submit" variant="primary" disabled={isSaving} className="flex-1">
                                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Annuler
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboardPage;
