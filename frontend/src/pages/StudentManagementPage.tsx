import { useState, useEffect } from 'react';
import { apiService, type Student, type StudentFilters, type Statistics } from '../services/api';
import Button from '../components/Button';

type StudentManagementPageProps = {
    isDark?: boolean;
    onBack: () => void;
};

function StudentManagementPage({ isDark = false, onBack }: StudentManagementPageProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState('');

    // Pagination & Filters
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [filters, setFilters] = useState<StudentFilters>({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    useEffect(() => {
        fetchStatistics();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [filters]);

    const fetchStatistics = async () => {
        try {
            const response = await apiService.getStatistics();
            if (response.success) {
                setStatistics(response.statistics);
            }
        } catch (err: any) {
            console.error('Error fetching statistics:', err);
        }
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await apiService.getAllStudents(filters);
            setStudents(response.students);
            setTotalPages(response.pagination.totalPages);
            setTotalResults(response.pagination.totalResults);
            setCurrentPage(response.pagination.currentPage);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (key: keyof StudentFilters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
        }));
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await apiService.exportStudentsToExcel(filters);
        } catch (err: any) {
            alert(`Erreur lors de l'export: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
        if (score >= 40) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'in_progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'pending': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
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
                            Gestion des Étudiants
                        </h1>
                        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                            Consultez et exportez les données des étudiants
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleExport}
                            variant="primary"
                            disabled={isExporting || students.length === 0}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {isExporting ? 'Export...' : 'Exporter Excel'}
                        </Button>
                        <Button onClick={onBack} variant="outline">
                            Retour
                        </Button>
                    </div>
                </div>

                {/* Statistics */}
                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className={`p-6 rounded-xl border-2 ${
                            isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                        }`}>
                            <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Total Étudiants
                            </p>
                            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                {statistics.totalStudents}
                            </p>
                        </div>
                        <div className={`p-6 rounded-xl border-2 ${
                            isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                        }`}>
                            <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Soumissions
                            </p>
                            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                {statistics.totalSubmissions}
                            </p>
                        </div>
                        <div className={`p-6 rounded-xl border-2 ${
                            isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                        }`}>
                            <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Score Moyen
                            </p>
                            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                {statistics.averageScore.toFixed(1)}%
                            </p>
                        </div>
                        <div className={`p-6 rounded-xl border-2 ${
                            isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                        }`}>
                            <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Top Destination
                            </p>
                            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                {statistics.topDestinations[0]?.country || '-'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className={`rounded-2xl border-2 p-6 mb-6 ${
                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                }`}>
                    <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        Filtres
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                Rechercher
                            </label>
                            <input
                                type="text"
                                placeholder="Email, nom..."
                                value={filters.search || ''}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border-2 ${
                                    isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                }`}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                Statut
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                                className={`w-full px-4 py-2 rounded-lg border-2 ${
                                    isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                }`}
                            >
                                <option value="">Tous</option>
                                <option value="completed">Complété</option>
                                <option value="in_progress">En cours</option>
                                <option value="pending">En attente</option>
                            </select>
                        </div>

                        {/* Destination Country */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                Pays de destination
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: France"
                                value={filters.destinationCountry || ''}
                                onChange={(e) => handleFilterChange('destinationCountry', e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border-2 ${
                                    isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                }`}
                            />
                        </div>

                        {/* Score Range */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                Score minimum
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={filters.minScore || ''}
                                onChange={(e) => handleFilterChange('minScore', e.target.value ? parseInt(e.target.value) : undefined)}
                                className={`w-full px-4 py-2 rounded-lg border-2 ${
                                    isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Sort & Reset */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-600">
                        <div className="flex gap-3">
                            <select
                                value={`${filters.sortBy}-${filters.sortOrder}`}
                                onChange={(e) => {
                                    const [sortBy, sortOrder] = e.target.value.split('-');
                                    handleFilterChange('sortBy', sortBy);
                                    handleFilterChange('sortOrder', sortOrder);
                                }}
                                className={`px-4 py-2 rounded-lg border-2 ${
                                    isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300'
                                }`}
                            >
                                <option value="createdAt-desc">Plus récent</option>
                                <option value="createdAt-asc">Plus ancien</option>
                                <option value="score-desc">Score décroissant</option>
                                <option value="score-asc">Score croissant</option>
                                <option value="originCountry-asc">Pays d'origine A-Z</option>
                                <option value="destinationCountry-asc">Destination A-Z</option>
                            </select>
                        </div>
                        <Button onClick={resetFilters} variant="outline" size="sm">
                            Réinitialiser
                        </Button>
                    </div>
                </div>

                {/* Students Table */}
                <div className={`rounded-2xl border-2 overflow-hidden ${
                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                }`}>
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                Liste des Étudiants
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                {totalResults} étudiant{totalResults > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12">
                            <p className="text-red-500 mb-4">{error}</p>
                            <Button onClick={fetchStudents} variant="outline">Réessayer</Button>
                        </div>
                    )}

                    {!isLoading && !error && students.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Aucun étudiant trouvé
                            </p>
                        </div>
                    )}

                    {!isLoading && !error && students.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={`${
                                    isDark ? 'bg-neutral-700' : 'bg-neutral-50'
                                }`}>
                                    <tr>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                            isDark ? 'text-neutral-300' : 'text-neutral-500'
                                        }`}>
                                            Étudiant
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                            isDark ? 'text-neutral-300' : 'text-neutral-500'
                                        }`}>
                                            Pays
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                            isDark ? 'text-neutral-300' : 'text-neutral-500'
                                        }`}>
                                            Score
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                            isDark ? 'text-neutral-300' : 'text-neutral-500'
                                        }`}>
                                            Statut
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                            isDark ? 'text-neutral-300' : 'text-neutral-500'
                                        }`}>
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y divide-neutral-200 dark:divide-neutral-700`}>
                                    {students.map((student) => (
                                        <tr key={student.id} className={`${
                                            isDark ? 'hover:bg-neutral-700/50' : 'hover:bg-neutral-50'
                                        } transition-colors`}>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                        {student.user ? (
                                                            student.user.firstName && student.user.lastName
                                                                ? `${student.user.firstName} ${student.user.lastName}`
                                                                : student.user.email || 'Unknown User'
                                                        ) : (
                                                            'Unknown User'
                                                        )}
                                                    </p>
                                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                        {student.user?.email || 'No email'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    <p>{student.originCountry}</p>
                                                    <p className="text-neutral-500">→ {student.destinationCountry}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-lg font-bold ${getScoreColor(student.score)}`}>
                                                    {student.score}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(student.status)}`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                    {new Date(student.completedAt || student.createdAt).toLocaleDateString('fr-FR')}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && !error && totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
                            <div className="flex items-center justify-between">
                                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    Page {currentPage} sur {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleFilterChange('page', currentPage - 1)}
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                    >
                                        Précédent
                                    </Button>
                                    <Button
                                        onClick={() => handleFilterChange('page', currentPage + 1)}
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                    >
                                        Suivant
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentManagementPage;
