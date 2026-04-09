import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DESTINATION_COUNTRIES } from "../data/destination-countries";
import Button from '../components/Button';
import { apiService, type Question } from '../services/api';

type Region = 'all' | 'north-america' | 'europe' | 'asia';

type DestinationSelectionProps = {
    originCountry: string;
    onDestinationSelect: (destination: string) => void;
    onBack: () => void;
    isDark?: boolean;
    totalQuestions?: number;
};

function DestinationSelection({
                                  originCountry,
                                  onDestinationSelect,
                                  onBack,
                                  isDark = false,
                                  totalQuestions = 20
                              }: DestinationSelectionProps) {
    const [selectedRegion, setSelectedRegion] = useState<Region>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [question, setQuestion] = useState<Question | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        fetchQuestion();
    }, []);

    const fetchQuestion = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getQuestionByOrder(2);
            setQuestion(data);
            setIsLoading(false);
        } catch (err) {
            setError(t('originCountry.errorLoading'));
            setIsLoading(false);
        }
    };

    const filteredCountries = DESTINATION_COUNTRIES.filter(country => {
        const matchesSearch = country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            country.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = selectedRegion === 'all' || country.region === selectedRegion;
        return matchesSearch && matchesRegion;
    });

    const regionCounts = {
        all: DESTINATION_COUNTRIES.length,
        'north-america': DESTINATION_COUNTRIES.filter(c => c.region === 'north-america').length,
        europe: DESTINATION_COUNTRIES.filter(c => c.region === 'europe').length,
        asia: DESTINATION_COUNTRIES.filter(c => c.region === 'asia').length,
    };

    const handleCountryClick = (countryName: string) => setSelectedCountry(countryName);

    // Modifié : envoie le nom anglais au backend
    const handleConfirm = () => {
        if (selectedCountry) {
            const countryData = DESTINATION_COUNTRIES.find(c => c.name === selectedCountry);
            if (countryData) {
                setIsExiting(true);
                setTimeout(() => {
                    onDestinationSelect(countryData.nameEn); // envoie le nom anglais attendu par le backend
                }, 700);
            }
        }
    };

    const handleChangeSelection = () => setSelectedCountry(null);

    const displayedCountries = selectedCountry
        ? filteredCountries.filter(c => c.name === selectedCountry)
        : filteredCountries;

    const selectedCountryData = selectedCountry
        ? DESTINATION_COUNTRIES.find(c => c.name === selectedCountry)
        : null;

    const currentQuestionOrder = question?.order || 2;
    const questionTitle = i18n.language === 'en' && question?.labelEn ? question.labelEn : (question?.label || question?.text || '');
    const questionDescription = i18n.language === 'en' && question?.descriptionEn ? question.descriptionEn : (question?.description || '');
    const progressPercentage = Math.round((currentQuestionOrder / totalQuestions) * 100);

    return (
        <div className={`min-h-screen ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'} overflow-hidden`}>
            <div className={`min-h-screen transition-transform duration-700 ease-in-out ${
                isExiting ? '-translate-x-full' : 'translate-x-0'
            } pt-24 pb-12 px-4 sm:px-6 lg:px-8`}>
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Button
                            onClick={onBack}
                            variant="ghost"
                            size="sm"
                            disabled={isLoading}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t('quiz.backButton')}
                        </Button>
                    </div>

                    {/* Progress Bar */}
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
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                {t('common.loadingQuestion')}
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className={`rounded-xl border-2 p-6 mb-8 ${
                            isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">{t('quiz.error')}</h3>
                                    <p className="text-red-700 dark:text-red-300 mb-3">{error}</p>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={fetchQuestion}
                                            variant="outline"
                                            size="sm"
                                        >
                                            {t('common.retry')}
                                        </Button>
                                        <Button
                                            onClick={onBack}
                                            variant="ghost"
                                            size="sm"
                                        >
                                            {t('quiz.returnHome')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Question Title */}
                    {question && questionTitle && (
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
                                {questionTitle}
                            </h2>
                            {questionDescription && (
                                <p className="text-lg text-neutral-600 dark:text-neutral-400">
                                    {questionDescription}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="pt-0 pb-12">
                        <div className="max-w-7xl mx-auto">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 mb-6 text-sm">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 rounded-full">
                                    <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-semibold text-brand-primary">{originCountry}</span>
                                </div>
                                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                <span className="text-neutral-500">{t('result.destination')}</span>
                            </div>

                            {/* Search Bar and Region Filter */}
                            {!selectedCountry && (
                                <>
                                    <div className="relative mb-6">
                                        <input
                                            type="text"
                                            placeholder={t('countrySelection.searchPlaceholder')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-4 py-3 pl-12 rounded-lg border bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                                        />
                                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {(['all', 'north-america', 'europe', 'asia'] as Region[]).map(region => (
                                            <button
                                                key={region}
                                                onClick={() => setSelectedRegion(region)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                                    selectedRegion === region
                                                        ? 'bg-brand-primary text-white'
                                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                                }`}
                                            >
                                                {region === 'all' ? `${t('countrySelection.allRegions')} (${regionCounts.all})`
                                                    : region === 'north-america' ? `${t('countrySelection.northAmerica')} (${regionCounts['north-america']})`
                                                        : region === 'europe' ? `${t('countrySelection.europe')} (${regionCounts.europe})`
                                                            : `${t('countrySelection.asiaRegion')} (${regionCounts.asia})`}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mb-4 text-sm text-neutral-600">
                                        {filteredCountries.length} {t('countrySelection.destinationsDisponibles')} :
                                    </p>
                                </>
                            )}

                            {/* Selected country summary */}
                            {selectedCountry && selectedCountryData && (
                                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="font-semibold text-green-800">
                                                {t('countrySelection.destinationSelected')} {selectedCountryData.flag} {selectedCountry}
                                            </p>
                                            <p className="text-sm text-green-700">
                                                {t('countrySelection.clickConfirm')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Countries Grid */}
                            <div className={`grid gap-4 ${selectedCountry ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} mb-6`}>
                                {displayedCountries.map((country) => (
                                    <div
                                        key={country.iso3}
                                        className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                                            selectedCountry === country.name
                                                ? 'border-brand-primary bg-brand-primary/10 shadow-lg scale-105'
                                                : 'bg-white border-neutral-200 hover:border-brand-primary hover:shadow-md'
                                        }`}
                                        onClick={() => !selectedCountry && handleCountryClick(country.name)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-5xl">{country.flag}</span>
                                                <div>
                                                    <h3 className="text-xl font-bold text-neutral-900">{i18n.language === 'en' ? country.nameEn : country.name}</h3>
                                                    <span className="text-sm px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{country.iso3}</span>
                                                </div>
                                            </div>
                                            {selectedCountry === country.name && (
                                                <svg className="w-8 h-8 text-brand-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="inline-block text-xs px-3 py-1 rounded-full mb-4 bg-blue-50 text-blue-600">
                                            • {country.region === 'north-america' ? t('countrySelection.northAmerica') : country.region === 'europe' ? t('countrySelection.europe') : t('countrySelection.asiaRegion')}
                                        </span>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium text-neutral-600">{country.requirements.financialProof}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium text-neutral-600">{country.requirements.processingTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!selectedCountry && filteredCountries.length === 0 && (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <p className="text-lg text-neutral-600">{t('countrySelection.noCountryFound', { search: searchTerm })}</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-6">
                                {selectedCountry ? (
                                    <>
                                        <Button onClick={handleChangeSelection} variant="outline" size="lg">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                            {t('countrySelection.changeDestination')}
                                        </Button>
                                        <Button onClick={handleConfirm} variant="primary" size="lg">
                                            {t('countrySelection.confirmDestination')}
                                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </Button>
                                    </>
                                ) : (
                                    <div className="w-full flex justify-end">
                                        <Button onClick={handleConfirm} variant="primary" size="lg" disabled={!selectedCountry}>
                                            {t('countrySelection.selectDestination')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DestinationSelection;
