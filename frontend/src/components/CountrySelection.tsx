import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ORIGIN_COUNTRIES, getOriginCountriesByRegion } from '../data/origin-countries';

type CountrySelectionProps = {
    onOriginSelect: (country: string) => void;
    isDark?: boolean;
};

// Coordonnées GPS précises pour chaque pays
const COUNTRY_POSITIONS: Record<string, { top: number; left: number }> = {
    // MENA
    'MAR': { top: 36.4, left: 41.8 },
    'TUN': { top: 32.1, left: 47.2 },
    'DZA': { top: 37.8, left: 44.9 },
    'EGY': { top: 38.7, left: 53.5 },
    'LBY': { top: 38.0, left: 49.1 },
    'SAU': { top: 39.6, left: 58.4 },
    'ARE': { top: 40.5, left: 61.5 },
    'KWT': { top: 36.0, left: 59.9 },
    'IRQ': { top: 30.6, left: 58.7 },
    'QAT': { top: 39.3, left: 60.8 },
    'SYR': { top: 30.8, left: 57.1 },
    'OMN': { top: 42.9, left: 62.6 },
    'JOR': { top: 34.2, left: 56.1 },
    'LBN': { top: 32.6, left: 56.1 },

    // Afrique subsaharienne - Ouest
    'SEN': { top: 46.1, left: 39.5 },
    'MLI': { top: 43.8, left: 43.5 },
    'MRT': { top: 42.5, left: 41.3 },
    'GIN': { top: 50.4, left: 40.5 },
    'CIV': { top: 54.0, left: 42.2 },
    'GHA': { top: 53.5, left: 43.5 },
    'TGO': { top: 53.3, left: 44.1 },
    'BEN': { top: 52.4, left: 44.5 },
    'BFA': { top: 51.0, left: 43.4 },
    'NGA': { top: 51.9, left: 46.9 },

    // Afrique centrale
    'NER': { top: 45.2, left: 45.9 },
    'TCD': { top: 45.2, left: 48.5 },
    'CMR': { top: 54.9, left: 48.6 },
    'COD': { top: 57.6, left: 49.7 },

    // Afrique de l'Est
    'ETH': { top: 52.4, left: 58.4 },
    'UGA': { top: 54.9, left: 56.7 },
    'KEN': { top: 56.9, left: 57.8 },
    'RWA': { top: 56.9, left: 56.1 },
    'TZA': { top: 61.2, left: 56.6 },

    // Afrique australe
    'MOZ': { top: 72.4, left: 55.3 },
    'MDG': { top: 73.1, left: 59.6 },
    'ZAF': { top: 81.6, left: 52.1 },

    // Asie du Sud
    'AFG': { top: 32.6, left: 66.1 },
    'PAK': { top: 35.7, left: 67.5 },
    'IND': { top: 38.4, left: 70.2 },
    'BGD': { top: 40.7, left: 73.8 },

    // Asie du Sud-Est
    'THA': { top: 47.2, left: 78.0 },
    'VNM': { top: 48.6, left: 80.2 },
    'MYS': { top: 57.3, left: 80.1 },
    'IDN': { top: 61.4, left: 80.4 },
    'PHL': { top: 48.8, left: 85.2 },

    // Asie de l'Est
    'CHN': { top: 32.8, left: 74.1 },
};

function CountrySelection({ onOriginSelect, isDark = false }: CountrySelectionProps) {
    const { t } = useTranslation();
    const [selectedRegion, setSelectedRegion] = useState<'all' | 'mena' | 'africa' | 'asia'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

    const filteredCountries = selectedRegion === 'all'
        ? ORIGIN_COUNTRIES
        : getOriginCountriesByRegion(selectedRegion);

    // Filtrer par recherche textuelle
    const searchFilteredCountries = searchQuery
        ? filteredCountries.filter(country =>
            country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            country.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : filteredCountries;

    const getRegionColor = (region: string) => {
        switch(region) {
            case 'mena': return '#F97316';
            case 'africa': return '#10B981';
            case 'asia': return '#3B82F6';
            default: return '#6B7280';
        }
    };

    // Déterminer quels pays afficher sur la carte
    const displayedCountries = hoveredCountry
        ? ORIGIN_COUNTRIES.filter(c => c.name === hoveredCountry)
        : searchQuery
            ? searchFilteredCountries
            : searchFilteredCountries;

    return (
        <div className="space-y-6">
            {/* Region Filters - En haut, compacts */}
            <div className="flex flex-wrap justify-center gap-2">
                <button
                    onClick={() => setSelectedRegion('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedRegion === 'all'
                            ? 'bg-brand-primary text-white shadow-md'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
                    }`}
                >
                    Tous ({ORIGIN_COUNTRIES.length})
                </button>
                <button
                    onClick={() => setSelectedRegion('mena')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedRegion === 'mena'
                            ? 'bg-[#F97316] text-white shadow-md'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
                    }`}
                >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                    MENA ({getOriginCountriesByRegion('mena').length})
                </button>
                <button
                    onClick={() => setSelectedRegion('africa')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedRegion === 'africa'
                            ? 'bg-[#10B981] text-white shadow-md'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
                    }`}
                >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                    Afrique ({getOriginCountriesByRegion('africa').length})
                </button>
                <button
                    onClick={() => setSelectedRegion('asia')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedRegion === 'asia'
                            ? 'bg-[#3B82F6] text-white shadow-md'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
                    }`}
                >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
                    Asie ({getOriginCountriesByRegion('asia').length})
                </button>
            </div>

            {/* World Map avec aspect ratio fixe */}
            <div className="flex justify-center items-center py-8">
                <div className="w-full max-w-5xl">
                    {/* Conteneur avec aspect ratio 2:1 */}
                    <div className="relative w-full" style={{ paddingBottom: '50%' }}>
                        {/* Image de la world map */}
                        <img
                            src="/assets/world-map.png"
                            alt="Carte du monde"
                            className={`absolute inset-0 w-full h-full ${isDark ? 'opacity-80 brightness-90' : 'opacity-90'}`}
                            style={{ objectFit: 'contain' }}
                        />

                        {/* Points sur la carte - CLIQUABLES 👇 */}
                        <div className="absolute inset-0">
                            {displayedCountries.map((country) => {
                                const position = COUNTRY_POSITIONS[country.iso3];
                                if (!position) return null;

                                const isHovered = hoveredCountry === country.name;
                                const regionColor = getRegionColor(country.region);

                                return (
                                    <button
                                        key={country.iso3}
                                        onClick={() => onOriginSelect(country.name)} // 👈 Cliquable
                                        onMouseEnter={() => setHoveredCountry(country.name)} // 👈 Hover
                                        onMouseLeave={() => setHoveredCountry(null)}
                                        className="absolute cursor-pointer group" // 👈 Ajout cursor-pointer
                                        style={{
                                            top: `${position.top}%`,
                                            left: `${position.left}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        {/* Point animé si survolé */}
                                        {isHovered && (
                                            <div
                                                className="absolute w-6 h-6 rounded-full animate-ping"
                                                style={{ backgroundColor: regionColor, opacity: 0.5 }}
                                            />
                                        )}
                                        {/* Point principal */}
                                        <div
                                            className={`rounded-full border-2 border-white shadow-lg transition-all group-hover:scale-125 ${
                                                isHovered ? 'w-4 h-4 scale-125' : 'w-2.5 h-2.5'
                                            }`}
                                            style={{ backgroundColor: regionColor }}
                                        />
                                        {/* Label si survolé */}
                                        {isHovered && (
                                            <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 pointer-events-none">
                                                <div
                                                    className="px-2 py-1 rounded text-xs font-semibold text-white shadow-lg"
                                                    style={{ backgroundColor: regionColor }}
                                                >
                                                    {country.name}
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Barre de recherche */}
            <div className="max-w-2xl mx-auto">
                <div className="relative">
                    <svg
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Rechercher un pays..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-full border-2 transition-colors ${
                            isDark
                                ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 focus:border-brand-primary'
                                : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-brand-primary'
                        } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                    />
                </div>
            </div>

            {/* Liste des pays */}
            <div className="max-w-4xl mx-auto">
                <div className={`rounded-2xl border-2 overflow-hidden ${
                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                }`}>
                    <div className="max-h-[400px] overflow-y-auto">
                        {searchFilteredCountries.length === 0 ? (
                            <div className="p-8 text-center">
                                <svg className="w-16 h-16 mx-auto mb-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-neutral-500 dark:text-neutral-400">{t('countrySelection.noResults')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {searchFilteredCountries.map((country) => (
                                    <button
                                        key={country.iso3}
                                        onClick={() => onOriginSelect(country.name)}
                                        onMouseEnter={() => setHoveredCountry(country.name)}
                                        onMouseLeave={() => setHoveredCountry(null)}
                                        className={`w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors group ${
                                            isDark ? 'text-white' : 'text-neutral-900'
                                        } ${hoveredCountry === country.name ? 'bg-brand-primary/5' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: getRegionColor(country.region) }}
                                            />
                                            <span className="font-medium group-hover:text-brand-primary transition-colors">
                        {country.name}
                      </span>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full font-mono ${
                                            isDark ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                                        }`}>
                      {country.iso3}
                    </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-4">
                    {searchFilteredCountries.length > 1 ? t('countrySelection.paysDisponibles', { count: searchFilteredCountries.length }) : t('countrySelection.paysDisponible', { count: searchFilteredCountries.length })}
                </p>
            </div>
        </div>
    );
}

export default CountrySelection;
