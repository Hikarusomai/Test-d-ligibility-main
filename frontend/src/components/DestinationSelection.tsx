import { useState } from 'react';
import { DESTINATION_COUNTRIES } from "../data/destination-countries";
import Button from './Button';

type Region = 'all' | 'north-america' | 'europe' | 'asia';

type DestinationSelectionProps = {
    originCountry: string;
    onDestinationSelect: (destination: string) => void;
    onBack?: () => void; // Ajout optionnel pour éviter l’erreur TS
    isDark?: boolean;
};

function DestinationSelection({ originCountry, onDestinationSelect, isDark = false }: DestinationSelectionProps) {
    const [selectedRegion, setSelectedRegion] = useState<Region>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

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

    const handleCountryClick = (countryName: string) => {
        setSelectedCountry(countryName);
    };

    const handleConfirm = () => {
        if (selectedCountry) {
            const country = DESTINATION_COUNTRIES.find(c => c.name === selectedCountry);
            if (country) {
                onDestinationSelect(country.nameEn);
            }
        }
    };

    const handleChangeSelection = () => {
        setSelectedCountry(null);
    };

    // Si un pays est sélectionné, afficher seulement celui-ci
    const displayedCountries = selectedCountry
        ? filteredCountries.filter(c => c.name === selectedCountry)
        : filteredCountries;

    const selectedCountryData = selectedCountry
        ? DESTINATION_COUNTRIES.find(c => c.name === selectedCountry)
        : null;

    return (
        <div className={`rounded-2xl border-2 p-6 md:p-8 ${
            isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
        }`}>
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
                <span className="text-neutral-500 dark:text-neutral-400">Destination</span>
            </div>

            {/* Si aucun pays sélectionné, afficher la recherche et les filtres */}
            {!selectedCountry && (
                <>
                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Rechercher un pays..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full px-4 py-3 pl-12 rounded-lg border ${
                                isDark
                                    ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400'
                                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-500'
                            } focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all`}
                        />
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Region Filter */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => setSelectedRegion('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                selectedRegion === 'all'
                                    ? 'bg-brand-primary text-white'
                                    : isDark
                                        ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                        >
                            Tous les pays ({regionCounts.all})
                        </button>
                        <button
                            onClick={() => setSelectedRegion('north-america')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                selectedRegion === 'north-america'
                                    ? 'bg-brand-primary text-white'
                                    : isDark
                                        ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                        >
                            Amérique & Océanie ({regionCounts['north-america']})
                        </button>
                        <button
                            onClick={() => setSelectedRegion('europe')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                selectedRegion === 'europe'
                                    ? 'bg-brand-primary text-white'
                                    : isDark
                                        ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                        >
                            Europe ({regionCounts.europe})
                        </button>
                        <button
                            onClick={() => setSelectedRegion('asia')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                selectedRegion === 'asia'
                                    ? 'bg-brand-primary text-white'
                                    : isDark
                                        ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                        >
                            Asie ({regionCounts.asia})
                        </button>
                    </div>

                    {/* Results count */}
                    <p className={`mb-4 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {filteredCountries.length} destination{filteredCountries.length > 1 ? 's' : ''} disponible{filteredCountries.length > 1 ? 's' : ''} :
                    </p>
                </>
            )}

            {/* Si un pays est sélectionné, afficher un message */}
            {selectedCountry && selectedCountryData && (
                <div className={`mb-6 p-4 rounded-lg ${
                    isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className={`font-semibold ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                                Destination sélectionnée : {selectedCountryData.flag} {selectedCountry}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                                Cliquez sur "Confirmer" pour continuer ou "Changer" pour choisir une autre destination
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Countries Grid */}
            <div className={`grid gap-4 ${
                selectedCountry
                    ? 'grid-cols-1 max-w-2xl mx-auto'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto pr-2'
            } mb-6`}>
                {displayedCountries.map((country) => (
                    <div
                        key={country.iso3}
                        className={`group relative p-6 rounded-xl border-2 transition-all ${
                            selectedCountry === country.name
                                ? 'border-brand-primary bg-brand-primary/10 shadow-lg scale-105'
                                : isDark
                                    ? 'bg-neutral-700 border-neutral-600 hover:border-brand-primary hover:bg-neutral-600 cursor-pointer'
                                    : 'bg-white border-neutral-200 hover:border-brand-primary hover:shadow-md cursor-pointer'
                        }`}
                        onClick={() => !selectedCountry && handleCountryClick(country.name)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <span className="text-5xl">{country.flag}</span>
                                <div>
                                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                        {country.name}
                                    </h3>
                                    <span className={`text-sm px-2 py-0.5 rounded-full ${
                                        isDark ? 'bg-neutral-600 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                                    }`}>
                  {country.iso3}
                </span>
                                </div>
                            </div>
                            {selectedCountry === country.name && (
                                <svg className="w-8 h-8 text-brand-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>

                        <span className={`inline-block text-xs px-3 py-1 rounded-full mb-4 ${
                            isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-600'
                        }`}>
                  • {country.region === 'north-america' ? 'Amérique & Océanie' :
                            country.region === 'europe' ? 'Europe' : 'Asie'}
                </span>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className={`font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                    {country.requirements.financialProof}
                  </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className={`font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                    {country.requirements.processingTime}
                  </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* No results */}
            {!selectedCountry && filteredCountries.length === 0 && (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        Aucun pays trouvé pour "{searchTerm}"
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
                {selectedCountry ? (
                    <>
                        <Button
                            onClick={handleChangeSelection}
                            variant="outline"
                            size="lg"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Modifier la destination
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            variant="primary"
                            size="lg"
                        >
                            Confirmer la destination
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Button>
                    </>
                ) : (
                    <div className="w-full flex justify-end">
                        <Button
                            onClick={handleConfirm}
                            variant="primary"
                            size="lg"
                            disabled={!selectedCountry}
                        >
                            Sélectionnez une destination
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DestinationSelection;
