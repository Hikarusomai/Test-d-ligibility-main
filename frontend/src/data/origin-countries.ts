export interface OriginCountry {
    name: string;
    nameEn: string;
    iso3: string;
    region: 'mena' | 'africa' | 'asia';
}

export const ORIGIN_COUNTRIES: OriginCountry[] = [
    // MENA (Moyen-Orient et Afrique du Nord)
    { name: 'Maroc', nameEn: 'Morocco', iso3: 'MAR', region: 'mena' },
    { name: 'Tunisie', nameEn: 'Tunisia', iso3: 'TUN', region: 'mena' },
    { name: 'Algérie', nameEn: 'Algeria', iso3: 'DZA', region: 'mena' },
    { name: 'Égypte', nameEn: 'Egypt', iso3: 'EGY', region: 'mena' },
    { name: 'Libye', nameEn: 'Libya', iso3: 'LBY', region: 'mena' },
    { name: 'Arabie saoudite', nameEn: 'Saudi Arabia', iso3: 'SAU', region: 'mena' },
    { name: 'Émirats arabes unis', nameEn: 'United Arab Emirates', iso3: 'ARE', region: 'mena' },
    { name: 'Koweït', nameEn: 'Kuwait', iso3: 'KWT', region: 'mena' },
    { name: 'Irak', nameEn: 'Iraq', iso3: 'IRQ', region: 'mena' },
    { name: 'Qatar', nameEn: 'Qatar', iso3: 'QAT', region: 'mena' },
    { name: 'Syrie', nameEn: 'Syria', iso3: 'SYR', region: 'mena' },
    { name: 'Oman', nameEn: 'Oman', iso3: 'OMN', region: 'mena' },
    { name: 'Jordanie', nameEn: 'Jordan', iso3: 'JOR', region: 'mena' },
    { name: 'Liban', nameEn: 'Lebanon', iso3: 'LBN', region: 'mena' },

    // Afrique subsaharienne
    { name: 'Sénégal', nameEn: 'Senegal', iso3: 'SEN', region: 'africa' },
    { name: 'Côte d\'Ivoire', nameEn: 'Ivory Coast', iso3: 'CIV', region: 'africa' },
    { name: 'Cameroun', nameEn: 'Cameroon', iso3: 'CMR', region: 'africa' },
    { name: 'Mali', nameEn: 'Mali', iso3: 'MLI', region: 'africa' },
    { name: 'Burkina Faso', nameEn: 'Burkina Faso', iso3: 'BFA', region: 'africa' },
    { name: 'Niger', nameEn: 'Niger', iso3: 'NER', region: 'africa' },
    { name: 'Tchad', nameEn: 'Chad', iso3: 'TCD', region: 'africa' },
    { name: 'Mauritanie', nameEn: 'Mauritania', iso3: 'MRT', region: 'africa' },
    { name: 'Bénin', nameEn: 'Benin', iso3: 'BEN', region: 'africa' },
    { name: 'Togo', nameEn: 'Togo', iso3: 'TGO', region: 'africa' },
    { name: 'Guinée', nameEn: 'Guinea', iso3: 'GIN', region: 'africa' },
    { name: 'Ghana', nameEn: 'Ghana', iso3: 'GHA', region: 'africa' },
    { name: 'Nigeria', nameEn: 'Nigeria', iso3: 'NGA', region: 'africa' },
    { name: 'Kenya', nameEn: 'Kenya', iso3: 'KEN', region: 'africa' },
    { name: 'Éthiopie', nameEn: 'Ethiopia', iso3: 'ETH', region: 'africa' },
    { name: 'Tanzanie', nameEn: 'Tanzania', iso3: 'TZA', region: 'africa' },
    { name: 'Ouganda', nameEn: 'Uganda', iso3: 'UGA', region: 'africa' },
    { name: 'Rwanda', nameEn: 'Rwanda', iso3: 'RWA', region: 'africa' },
    { name: 'Congo (RDC)', nameEn: 'DR Congo', iso3: 'COD', region: 'africa' },
    { name: 'Afrique du Sud', nameEn: 'South Africa', iso3: 'ZAF', region: 'africa' },
    { name: 'Madagascar', nameEn: 'Madagascar', iso3: 'MDG', region: 'africa' },
    { name: 'Mozambique', nameEn: 'Mozambique', iso3: 'MOZ', region: 'africa' },

    // Asie
    { name: 'Pakistan', nameEn: 'Pakistan', iso3: 'PAK', region: 'asia' },
    { name: 'Bangladesh', nameEn: 'Bangladesh', iso3: 'BGD', region: 'asia' },
    { name: 'Afghanistan', nameEn: 'Afghanistan', iso3: 'AFG', region: 'asia' },
    { name: 'Inde', nameEn: 'India', iso3: 'IND', region: 'asia' },
    { name: 'Indonésie', nameEn: 'Indonesia', iso3: 'IDN', region: 'asia' },
    { name: 'Malaisie', nameEn: 'Malaysia', iso3: 'MYS', region: 'asia' },
    { name: 'Philippines', nameEn: 'Philippines', iso3: 'PHL', region: 'asia' },
    { name: 'Thaïlande', nameEn: 'Thailand', iso3: 'THA', region: 'asia' },
    { name: 'Vietnam', nameEn: 'Vietnam', iso3: 'VNM', region: 'asia' },
    { name: 'Chine', nameEn: 'China', iso3: 'CHN', region: 'asia' },
];

export function getOriginCountriesByRegion(region: 'mena' | 'africa' | 'asia'): OriginCountry[] {
    return ORIGIN_COUNTRIES.filter(country => country.region === region);
}

export function getOriginCountryByName(name: string): OriginCountry | undefined {
    return ORIGIN_COUNTRIES.find(country => country.name === name);
}
