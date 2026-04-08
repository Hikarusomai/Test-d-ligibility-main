export interface DestinationCountry {
  name: string;              // Nom français
  nameEn: string;           // Nom anglais
  iso3: string;             // Code ISO 3166-1 alpha-3
  slug: string;             // URL-friendly slug
  region: 'north-america' | 'europe' | 'asia';
  flag: string;             // Emoji drapeau
  requirements: {
    financialProof: string;
    languageTest: string[];
    processingTime: string;
  };
}

export const DESTINATION_COUNTRIES: DestinationCountry[] = [
  // Amérique du Nord
  {
    name: 'États-Unis',
    nameEn: 'United States',
    iso3: 'USA',
    slug: 'usa',
    region: 'north-america',
    flag: '🇺🇸',
    requirements: {
      financialProof: '40 000 - 60 000 USD/an',
      languageTest: ['TOEFL', 'IELTS', 'Duolingo'],
      processingTime: '2-4 mois'
    }
  },
  {
    name: 'Canada',
    nameEn: 'Canada',
    iso3: 'CAN',
    slug: 'canada',
    region: 'north-america',
    flag: '🇨🇦',
    requirements: {
      financialProof: '20 000 - 30 000 CAD/an',
      languageTest: ['IELTS', 'TEF', 'CELPIP'],
      processingTime: '2-3 mois'
    }
  },
  {
    name: 'Australie',
    nameEn: 'Australia',
    iso3: 'AUS',
    slug: 'australie',
    region: 'north-america', // Groupé avec Amérique du Nord pour simplifier
    flag: '🇦🇺',
    requirements: {
      financialProof: '25 000 - 35 000 AUD/an',
      languageTest: ['IELTS', 'TOEFL', 'PTE'],
      processingTime: '1-3 mois'
    }
  },

  // Europe
  {
    name: 'Royaume-Uni',
    nameEn: 'United Kingdom',
    iso3: 'GBR',
    slug: 'uk',
    region: 'europe',
    flag: '🇬🇧',
    requirements: {
      financialProof: '15 000 - 25 000 GBP/an',
      languageTest: ['IELTS', 'TOEFL'],
      processingTime: '2-3 mois'
    }
  },
  {
    name: 'France',
    nameEn: 'France',
    iso3: 'FRA',
    slug: 'france',
    region: 'europe',
    flag: '🇫🇷',
    requirements: {
      financialProof: '615 EUR/mois minimum',
      languageTest: ['TCF', 'DELF', 'DALF'],
      processingTime: '1-2 mois'
    }
  },
  {
    name: 'Allemagne',
    nameEn: 'Germany',
    iso3: 'DEU',
    slug: 'germany',
    region: 'europe',
    flag: '🇩🇪',
    requirements: {
      financialProof: '11 208 EUR/an (compte bloqué)',
      languageTest: ['TestDaF', 'DSH', 'Goethe'],
      processingTime: '6-12 semaines'
    }
  },
  {
    name: 'Espagne',
    nameEn: 'Spain',
    iso3: 'ESP',
    slug: 'spain',
    region: 'europe',
    flag: '🇪🇸',
    requirements: {
      financialProof: '6 000 - 10 000 EUR/an',
      languageTest: ['DELE', 'SIELE'],
      processingTime: '1-3 mois'
    }
  },
  {
    name: 'Italie',
    nameEn: 'Italy',
    iso3: 'ITA',
    slug: 'italy',
    region: 'europe',
    flag: '🇮🇹',
    requirements: {
      financialProof: '6 000 - 8 000 EUR/an',
      languageTest: ['CILS', 'CELI', 'PLIDA'],
      processingTime: '30-60 jours'
    }
  },
  {
    name: 'Finlande',
    nameEn: 'Finland',
    iso3: 'FIN',
    slug: 'finlande',
    region: 'europe',
    flag: '🇫🇮',
    requirements: {
      financialProof: '6 720 EUR/an',
      languageTest: ['IELTS', 'TOEFL'],
      processingTime: '1-2 mois'
    }
  },
  {
    name: 'Irlande',
    nameEn: 'Ireland',
    iso3: 'IRL',
    slug: 'ireland',
    region: 'europe',
    flag: '🇮🇪',
    requirements: {
      financialProof: '10 000 EUR/an',
      languageTest: ['IELTS', 'TOEFL'],
      processingTime: '8 semaines'
    }
  },
  {
    name: 'Danemark',
    nameEn: 'Denmark',
    iso3: 'DNK',
    slug: 'danemark',
    region: 'europe',
    flag: '🇩🇰',
    requirements: {
      financialProof: '1 100 DKK/mois',
      languageTest: ['IELTS', 'TOEFL'],
      processingTime: '2-3 mois'
    }
  },
  {
    name: 'Norvège',
    nameEn: 'Norway',
    iso3: 'NOR',
    slug: 'norvege',
    region: 'europe',
    flag: '🇳🇴',
    requirements: {
      financialProof: '123 519 NOK/an',
      languageTest: ['IELTS', 'TOEFL'],
      processingTime: '2-3 mois'
    }
  },
  {
    name: 'Suède',
    nameEn: 'Sweden',
    iso3: 'SWE',
    slug: 'suede',
    region: 'europe',
    flag: '🇸🇪',
    requirements: {
      financialProof: '9 450 SEK/mois',
      languageTest: ['IELTS', 'TOEFL'],
      processingTime: '2-4 mois'
    }
  },
  {
    name: 'Pologne',
    nameEn: 'Poland',
    iso3: 'POL',
    slug: 'pologne',
    region: 'europe',
    flag: '🇵🇱',
    requirements: {
      financialProof: '700 PLN/mois',
      languageTest: ['IELTS', 'TOEFL'],
      processingTime: '1-2 mois'
    }
  },
  {
    name: 'Malte',
    nameEn: 'Malta',
    iso3: 'MLT',
    slug: 'malte',
    region: 'europe',
    flag: '🇲🇹',
    requirements: {
      financialProof: '4 800 EUR/an',
      languageTest: ['IELTS', 'TOEFL'],
      processingTime: '6-8 semaines'
    }
  },
  {
    name: 'Belgique',
    nameEn: 'Belgium',
    iso3: 'BEL',
    slug: 'belgique',
    region: 'europe',
    flag: '🇧🇪',
    requirements: {
      financialProof: '670 EUR/mois',
      languageTest: ['TCF', 'DELF', 'IELTS'],
      processingTime: '1-3 mois'
    }
  },

  // Asie
  {
    name: 'Chine',
    nameEn: 'China',
    iso3: 'CHN',
    slug: 'chine',
    region: 'asia',
    flag: '🇨🇳',
    requirements: {
      financialProof: '3 000 - 5 000 USD/an',
      languageTest: ['HSK', 'IELTS'],
      processingTime: '1-2 mois'
    }
  },
  {
    name: 'Turquie',
    nameEn: 'Turkey',
    iso3: 'TUR',
    slug: 'turquie',
    region: 'asia',
    flag: '🇹🇷',
    requirements: {
      financialProof: '500 - 1 000 USD/mois',
      languageTest: ['TOMER', 'IELTS'],
      processingTime: '1 mois'
    }
  },
  {
    name: 'Corée du Sud',
    nameEn: 'South Korea',
    iso3: 'KOR',
    slug: 'coree-du-sud',
    region: 'asia',
    flag: '🇰🇷',
    requirements: {
      financialProof: '10 000 - 15 000 USD/an',
      languageTest: ['TOPIK', 'IELTS'],
      processingTime: '2-3 mois'
    }
  },
];

export function findDestinationCountry(slug: string): DestinationCountry | undefined {
  return DESTINATION_COUNTRIES.find(country => country.slug === slug);
}

export function getDestinationCountriesByRegion(region: 'north-america' | 'europe' | 'asia'): DestinationCountry[] {
  return DESTINATION_COUNTRIES.filter(c => c.region === region);
}
