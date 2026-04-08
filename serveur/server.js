require('dotenv').config()

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

const CONFIG = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  DB_NAME: 'visa_requirements',
  COLLECTION_NAME: 'country_requirements',
  
  SCRAPING_TARGETS: [
    {
      country: 'United States',
      iso3: 'USA',
      slug: 'usa',
      urls: [
        'https://studee.com/guides/how-to-apply-for-a-usa-student-visa',
        'https://www.intostudy.com/en/study-abroad/visas-for-the-us',
        'https://www.aecoverseas.com/blog/bank-balance-required-us-student-visa/'
      ],
      operator: 'U.S. Department of State'
    },
    {
      country: 'Canada',
      iso3: 'CAN',
      slug: 'canada',
      urls: [
        'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html#wb-cont',
        'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/inadmissibility/reasons.html',
        'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html',
        'https://www.aims-education.com/how-much-bank-balance-is-required-for-canada-student-visa/'
      ],
      operator: 'Immigration, Refugees and Citizenship Canada'
    },
    {
      country: 'Australia',
      iso3: 'AUS',
      slug: 'australia',
      urls: [
        'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500#Eligibility',
        'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language',
        'https://www.vicpakconsultant.com/bank-statement-for-australia-student-visa/'
      ],
      operator: 'Department of Home Affairs'
    },
    {
      country: 'United Kingdom',
      iso3: 'GBR',
      slug: 'united-kingdom',
      urls: [
        'https://glocaled.org/uk-student-visa-financial-requirements/',
        'https://www.gov.uk/student-visa/knowledge-of-english',
        'https://www.gov.uk/student-visa/documents-you-must-provide',
        'https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-9-grounds-for-refusal'
      ],
      operator: 'UK Visas and Immigration'
    },
    {
      country: 'France',
      iso3: 'FRA',
      slug: 'france',
      urls: [
        'https://www.campusfrance.org/fr/visa-long-sejour-etudiant?utm_source=chatgpt.com',
        'https://www.studely.com/fr/blog/france/procedures-and-visas/les-7-motifs-de-refus-de-visa-etudiant-france/',
        'https://campuslangues.com/blog/un-test-de-francais-obligatoire-des-juillet-2025-pour-la-demande-de-visa'
      ],
      operator: 'Campus France'
    },
    {
      country: 'Germany',
      iso3: 'DEU',
      slug: 'germany',
      urls: [
        'https://www.germany-visa.org/student-visa/student-visa-visum-zu-studienzwecken/',
        'https://www.studying-in-germany.org/german-student-visa/'
      ],
      operator: 'German Diplomatic Missions'
    },
    {
      country: 'Spain',
      iso3: 'ESP',
      slug: 'spain',
      urls: [
        'https://www.estudiohispanico.com/se/visas/',
        'https://spain-internship.com/blog/how-to-demonstrate-income-for-your-spanish-student-visa/',
        'https://partner.studymetro.com/s/article/This-is-why-your-Student-visa-rejected-for-Spain-universities'
      ],
      operator: 'Spanish Consulates'
    },
    {
      country: 'Italia',
      iso3: 'ITA',
      slug: 'italia',
      urls: [
        'https://italyvms.com/student-visa-enrollment-in-universities-of-italy-under-the-laurea-and-laurea-magistrale-programs-in-afam-and-ssml-institutions/',
        'https://yesitaly.in/common-reasons-for-student-visa-rejection-in-italy/',
        'https://yesitaly.in/minimum-bank-balance-for-italy-student-visa/'
      ],
      operator: 'Italian Consulates'
    },
    {
      country: 'Finland',
      iso3: 'FIN',
      slug: 'finland',
      urls: [
        'https://migri.fi/en/studying-in-finland',
        'https://migri.fi/en/residence-permit-application-for-studies',
        'https://www.immigration-residency.eu/blog/main-reasons-why-visa-in-finland-gets-denied/',
        'https://migri.fi/en/language-skills'
      ],
      operator: 'Finnish Immigration Service (Migri)'
    },
    {
      country: 'Ireland',
      iso3: 'IRL',
      slug: 'ireland',
      urls: [
        'https://www.gyandhan.com/student-visa-guide/ireland/rejection?srsltid=AfmBOoqqsC4dyPsOfhLUFvcApd0y_X0UakTZ8CSIwndKONObnoJNuYHm',
        'https://www.irishimmigration.ie/coming-to-study-in-ireland/english-language-requirements-for-study-visas/'
      ],
      operator: 'Irish Naturalisation and Immigration Service (INIS)'
    },
    {
      country: 'Denmark',
      iso3: 'DNK',
      slug: 'denmark',
      urls: [
        'https://aimseducation.co.uk/bd/blog/financial-requirements-for-denmark-student-visa/',
        'https://timesconsultant.com/blog/denmark-student-visa-guide/',
        'https://www.acadfly.com/blogs/university-admission-danish-language-requirements'
      ],
      operator: 'Danish Agency for International Recruitment and Integration (SIRI)'
    },
    {
      country: 'Norway',
      iso3: 'NOR',
      slug: 'norway',
      urls: [
        'https://studyinnorway.no/cost_and_requirements',
        'https://www.udi.no/en/important-messages/changes-to-the-requirements-for-a-permanent-residence-permit/',
        'https://swics.org/norway-visa-refusal-appeal-to-udi-norwegian-directorate-of-immigration/',
        'https://www.nmbu.no/en/studies/first-time-study-permit'
      ],
      operator: 'Norwegian Directorate of Immigration (UDI)'
    },
    {
      country: 'Sweden',
      iso3: 'SWE',
      slug: 'sweden',
      urls: [
        'https://gatewayeduconnect.com/blog/sweden-student-visa-requirements',
        'https://www.snycosmos.com/reach-consultant-for-sweden-to-avoid-student-visa-rejection/',
        'https://languagepartners.nl/en/blog/language/swedish-language-visa-requirements/'
      ],
      operator: 'Swedish Migration Agency (Migrationsverket)'
    },
    {
      country: 'Poland',
      iso3: 'POL',
      slug: 'poland',
      urls: [
        'https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-poland_en',
        'https://www.gov.pl/web/armenia-en/financial-resources-required-from-the-foreigner-to-enter-poland-on-the-basis-of-d-type-national-visa',
        'https://blog.onevasco.com/visa-rejection/poland'
      ],
      operator: 'Office for Foreigners (Urząd do Spraw Cudzoziemców)'
    },
    {
      country: 'Malta',
      iso3: 'MLT',
      slug: 'malta',
      urls: [
        'https://marutivisa.com/malta-study-visa-requirements.php',
        'https://www.um.edu.mt/study/admissionsadvice/international/englishlanguagerequirements/',
        'https://gbs.edu.mt/blog/international-students-common-mistakes-to-avoid-during-malta-student-visa-application/'
      ],
      operator: 'Identity Malta Agency'
    },
    {
      country: 'Belgium',
      iso3: 'BEL',
      slug: 'belgium',
      urls: [
        'https://www.mastersportal.com/articles/1634/how-to-get-a-student-visa-for-belgium.html',
        'https://www.immigration-residency.eu/blog/main-reasons-why-visa-in-belgium-gets-denied/'
      ],
      operator: 'Office des Étrangers'
    },
    {
      country: 'China',
      iso3: 'CHN',
      slug: 'china',
      urls: [
        'https://qogentglobal.com/study-in-china/finance/financial-proof',
        'https://www.visaforchina.cn/LHE3_EN/tongzhigonggao/298356001244057600.html',
        'https://elmevira.com/en/required-documents-for-obtaining-a-student-visa-for-china/'
      ],
      operator: 'Chinese Diplomatic Missions'
    },
    {
      country: 'Turkiye',
      iso3: 'TUR',
      slug: 'turkiye',
      urls: [
        'https://igeoverseas.com/turkey-student-visa-bank-balance-requirement/',
        'https://www.educations.com/study-guides/europe/study-in-turkey/student-visas-20248',
        'https://www.atlys.com/blog/turkey-visa-rejection-reasons'
      ],
      operator: 'Directorate General of Migration Management (DGMM)'
    },
    {
      country: 'South Korea',
      iso3: 'KOR',
      slug: 'south-korea',
      urls: [
        'https://www.atlys.com/blog/minimum-bank-balance-south-korea-visa',
        'https://gsc.korea.ac.kr/usr/international/student_visa.do',
        'https://gogohanguk.com/en/blog/get-a-korean-student-visa/',
        'https://useteleport.com/blog/south-korea-visa-rejection-reasons'
      ],
      operator: 'Korea Immigration Service (KIS)'
    }
  ]
};

let db;
let collection;

// Structure pour tracker les liens inefficaces
const scrapingReport = {
  startTime: null,
  endTime: null,
  totalUrls: 0,
  successfulUrls: 0,
  failedUrls: [],
  duplicateUrls: [],
  emptyDataUrls: []
};

function resetScrapingReport() {
  scrapingReport.startTime = new Date().toISOString();
  scrapingReport.endTime = null;
  scrapingReport.totalUrls = 0;
  scrapingReport.successfulUrls = 0;
  scrapingReport.failedUrls = [];
  scrapingReport.duplicateUrls = [];
  scrapingReport.emptyDataUrls = [];
}

async function connectDB() {
  try {
    const client = await MongoClient.connect(CONFIG.MONGODB_URI);
    
    db = client.db(CONFIG.DB_NAME);
    collection = db.collection(CONFIG.COLLECTION_NAME);
    
    await collection.createIndex({ 'country.slug': 1 });
    await collection.createIndex({ 'source.last_scraped': -1 });
    await collection.createIndex({ 'meta.checksum': 1 });
    
    console.log('✅ Connexion MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

async function scrapeWithGemini(url, country) {
  try {
    console.log(`🔍 Scraping ${url}...`);
    scrapingReport.totalUrls++;
    
    const extractedData = await extractWithGemini(url, country);
    
    // Vérifier si les données sont vides ou inutiles
    if (isEmptyData(extractedData)) {
      console.log(`⚠️  Données vides ou inutiles pour ${url}`);
      scrapingReport.emptyDataUrls.push({
        url,
        country,
        reason: 'Données vides ou non pertinentes',
        timestamp: new Date().toISOString()
      });
      return null;
    }
    
    scrapingReport.successfulUrls++;
    return extractedData;
    
  } catch (error) {
    console.error(`❌ Erreur scraping ${url}:`, error.message);
    scrapingReport.failedUrls.push({
      url,
      country,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return null;
  }
}

// Fonction pour vérifier si les données sont vides/inutiles
function isEmptyData(data) {
  if (!data) return true;
  
  // Vérifier si toutes les valeurs importantes sont nulles ou vides
  const hasFinancial = data.financial?.min_monthly_eur || data.financial?.min_annual_eur;
  const hasLanguage = data.language?.tests_accepted?.length > 0;
  const hasAdmission = data.admission?.required !== undefined;
  const hasDocuments = data.documents?.mandatory?.length > 0;
  const hasFees = data.fees?.visa_fee_eur !== null;
  const hasProcessing = data.processing?.average_delay_days !== null;
  
  // Si au moins 2 sections ont des données, on considère que c'est valide
  const validSections = [hasFinancial, hasLanguage, hasAdmission, hasDocuments, hasFees, hasProcessing]
    .filter(Boolean).length;
  
  return validSections < 2;
}

async function extractWithGemini(url, country) {
  const prompt = `Recherche sur le web les exigences officielles pour un visa étudiant pour ${country}.

Extrais et structure les informations suivantes depuis ${url}:

1. EXIGENCES FINANCIÈRES:
   - Montant minimum requis (mensuel et annuel en EUR)
   - Devise
   - Types de preuves acceptées

2. EXIGENCES LINGUISTIQUES:
   - Tests de langue acceptés (avec niveau)
   - Validité en mois
   - Exemptions possibles

3. ADMISSION:
   - Obligatoire ou non
   - Types de preuves acceptées
   - Portail officiel
   - Notes spéciales

4. DOCUMENTS OBLIGATOIRES ET OPTIONNELS

5. FRAIS:
   - Frais de visa en EUR
   - Frais de service en EUR
   - Modes de paiement

6. TRAITEMENT:
   - Délai moyen en jours
   - Rendez-vous requis
   - Centre de traitement

7. RED FLAGS (drapeaux rouges)

RÉPONDS UNIQUEMENT AVEC UN OBJET JSON VALIDE suivant cette structure exacte:
{
  "financial": {
    "min_monthly_eur": null,
    "min_annual_eur": null,
    "currency": "",
    "proof_accepted": [],
    "source_url": "${url}"
  },
  "language": {
    "tests_accepted": [{"name": "", "level": ""}],
    "validity_months": null,
    "exemptions": [],
    "source_url": "${url}"
  },
  "admission": {
    "required": true,
    "proof_types": [],
    "official_portal": "",
    "special_notes": "",
    "source_url": "${url}"
  },
  "documents": {
    "mandatory": [],
    "optional": []
  },
  "fees": {
    "visa_fee_eur": null,
    "service_fee_eur": null,
    "payment_modes": [],
    "source_url": "${url}"
  },
  "processing": {
    "average_delay_days": null,
    "appointment_required": null,
    "center": "",
    "source_url": "${url}"
  },
  "red_flags": {}
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('⚠️  GEMINI_API_KEY non trouvée dans .env');
      return getDemoData(country);
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          tools: [{
            googleSearch: {}
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`API Gemini erreur: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Format de réponse API invalide');
    }
    
    const textContent = data.candidates[0].content.parts
      .map(part => part.text || '')
      .join('\n');
    
    const jsonMatch = textContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                      textContent.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Aucun JSON trouvé dans la réponse de Gemini');
    }
    
    const extractedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    
    return extractedData;
    
  } catch (error) {
    console.error('❌ Erreur extraction Gemini:', error.message);
    throw error;
  }
}

function getDemoData(country) {
  // ... (même fonction qu'avant)
}

function mergeCountryData(dataArray) {
  const merged = {
    financial: {},
    language: { tests_accepted: [] },
    admission: {},
    documents: { mandatory: [], optional: [] },
    fees: {},
    processing: {},
    red_flags: {}
  };
  
  const seenData = new Set();
  
  dataArray.forEach((data, index) => {
    if (!data) return;
    
    // Détecter les doublons
    const dataHash = calculateChecksum(data);
    if (seenData.has(dataHash)) {
      console.log(`⚠️  Doublon détecté pour l'URL ${index + 1}`);
      return;
    }
    seenData.add(dataHash);
    
    Object.keys(merged).forEach(key => {
      if (data[key]) {
        if (key === 'documents') {
          merged[key].mandatory = [...new Set([...merged[key].mandatory, ...(data[key].mandatory || [])])];
          merged[key].optional = [...new Set([...merged[key].optional, ...(data[key].optional || [])])];
        } else if (key === 'language' && data[key].tests_accepted) {
          merged[key].tests_accepted = [...merged[key].tests_accepted, ...data[key].tests_accepted];
          merged[key] = { ...merged[key], ...data[key] };
        } else if (typeof merged[key] === 'object' && !Array.isArray(merged[key])) {
          merged[key] = { ...merged[key], ...data[key] };
        }
      }
    });
  });
  
  return merged;
}

function calculateChecksum(data) {
  const str = JSON.stringify(data, null, 0);
  return 'sha256:' + crypto.createHash('sha256').update(str).digest('hex').substring(0, 8);
}

async function scrapeCountry(countryConfig) {
  console.log(`\n🌍 Début scraping: ${countryConfig.country}`);
  
  const results = [];
  const urlHashes = new Map();
  
  for (const url of countryConfig.urls) {
    const data = await scrapeWithGemini(url, countryConfig.country);
    
    if (data) {
      const dataHash = calculateChecksum(data);
      
      // Détecter si ces données ont déjà été récupérées d'une autre URL
      if (urlHashes.has(dataHash)) {
        const originalUrl = urlHashes.get(dataHash);
        console.log(`⚠️  Doublon détecté: ${url} contient les mêmes données que ${originalUrl}`);
        scrapingReport.duplicateUrls.push({
          url,
          country: countryConfig.country,
          duplicateOf: originalUrl,
          timestamp: new Date().toISOString()
        });
      } else {
        urlHashes.set(dataHash, url);
        results.push(data);
      }
    }
    
    console.log('⏳ Pause de 10s...');
    await sleep(10000);
  }
  
  if (results.length === 0) {
    console.log(`⚠️  Aucune donnée extraite pour ${countryConfig.country}`);
    return null;
  }
  
  const mergedRequirements = mergeCountryData(results);
  
  const document = {
    country: {
      name: countryConfig.country,
      iso3: countryConfig.iso3,
      slug: countryConfig.slug
    },
    source: {
      url: countryConfig.urls[0],
      operator: countryConfig.operator,
      last_scraped: new Date().toISOString().split('T')[0],
      last_updated: new Date().toISOString().split('T')[0]
    },
    requirements: mergedRequirements,
    meta: {
      version: '2025.1',
      checksum: calculateChecksum(mergedRequirements),
      validated_by: 'gemini_api_v2',
      last_patch: new Date().toISOString()
    }
  };
  
  console.log(`✅ Scraping terminé: ${countryConfig.country}`);
  
  return document;
}

async function saveToMongoDB(document) {
  try {
    const existingDoc = await collection.findOne({ 
      'country.slug': document.country.slug 
    });
    
    if (existingDoc && existingDoc.meta.checksum === document.meta.checksum) {
      console.log(`ℹ️  Aucun changement détecté pour ${document.country.name}`);
      return { modified: false };
    }
    
    const result = await collection.updateOne(
      { 'country.slug': document.country.slug },
      { 
        $set: document,
        $push: {
          history: {
            checksum: existingDoc?.meta.checksum,
            date: existingDoc?.meta.last_patch
          }
        }
      },
      { upsert: true }
    );
    
    console.log(`💾 Sauvegarde MongoDB: ${document.country.name}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde MongoDB:', error);
    throw error;
  }
}

// NOUVEAUX ENDPOINTS

// Endpoint pour récupérer le rapport de scraping
app.get('/scraping-report', (req, res) => {
  const totalIneffective = scrapingReport.failedUrls.length + 
                           scrapingReport.duplicateUrls.length + 
                           scrapingReport.emptyDataUrls.length;
  
  const report = {
    ...scrapingReport,
    summary: {
      totalUrls: scrapingReport.totalUrls,
      successfulUrls: scrapingReport.successfulUrls,
      failedUrls: scrapingReport.failedUrls.length,
      duplicateUrls: scrapingReport.duplicateUrls.length,
      emptyDataUrls: scrapingReport.emptyDataUrls.length,
      totalIneffectiveUrls: totalIneffective,
      successRate: scrapingReport.totalUrls > 0 
        ? ((scrapingReport.successfulUrls / scrapingReport.totalUrls) * 100).toFixed(2) + '%'
        : '0%'
    }
  };
  
  res.json(report);
});

// Endpoint pour récupérer uniquement les liens inefficaces
app.get('/ineffective-urls', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    total: scrapingReport.failedUrls.length + 
           scrapingReport.duplicateUrls.length + 
           scrapingReport.emptyDataUrls.length,
    categories: {
      failed: {
        count: scrapingReport.failedUrls.length,
        urls: scrapingReport.failedUrls
      },
      duplicates: {
        count: scrapingReport.duplicateUrls.length,
        urls: scrapingReport.duplicateUrls
      },
      emptyData: {
        count: scrapingReport.emptyDataUrls.length,
        urls: scrapingReport.emptyDataUrls
      }
    }
  });
});

app.get('/scrape/:country', async (req, res) => {
  const countrySlug = req.params.country.toLowerCase();
  
  const countryConfig = CONFIG.SCRAPING_TARGETS.find(
    c => c.slug === countrySlug
  );
  
  if (!countryConfig) {
    return res.status(404).json({ 
      error: 'Pays non trouvé',
      available: CONFIG.SCRAPING_TARGETS.map(c => c.slug)
    });
  }
  
  try {
    resetScrapingReport();
    
    const document = await scrapeCountry(countryConfig);
    
    if (!document) {
      return res.status(500).json({ error: 'Échec du scraping' });
    }
    
    await saveToMongoDB(document);
    
    scrapingReport.endTime = new Date().toISOString();
    
    res.json({
      success: true,
      country: document.country.name,
      checksum: document.meta.checksum,
      requirements: document.requirements,
      scrapingReport: {
        totalUrls: scrapingReport.totalUrls,
        successfulUrls: scrapingReport.successfulUrls,
        ineffectiveUrls: scrapingReport.failedUrls.length + 
                        scrapingReport.duplicateUrls.length + 
                        scrapingReport.emptyDataUrls.length
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/scrape/all', async (req, res) => {
  res.json({ 
    message: 'Scraping lancé en arrière-plan',
    countries: CONFIG.SCRAPING_TARGETS.map(c => c.slug),
    trackingEndpoint: '/scraping-report'
  });
  
  scrapeAllCountries();
});

app.get('/requirements/:country', async (req, res) => {
  try {
    const document = await collection.findOne({
      'country.slug': req.params.country.toLowerCase()
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Pays non trouvé' });
    }
    
    res.json(document);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/requirements', async (req, res) => {
  try {
    const documents = await collection.find({}, {
      projection: {
        'country': 1,
        'source.last_scraped': 1,
        'meta.checksum': 1
      }
    }).toArray();
    
    res.json({
      total: documents.length,
      countries: documents
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', async (req, res) => {
  const dbStatus = db ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

async function scrapeAllCountries() {
  console.log('\n🚀 Démarrage du scraping automatique...');
  resetScrapingReport();
  
  for (const countryConfig of CONFIG.SCRAPING_TARGETS) {
    try {
      const document = await scrapeCountry(countryConfig);
      
      if (document) {
        await saveToMongoDB(document);
      }
      
      console.log('⏳ Pause de 30s avant le prochain pays...');
      await sleep(30000);
      
    } catch (error) {
      console.error(`❌ Erreur pour ${countryConfig.country}:`, error.message);
    }
  }
  
  scrapingReport.endTime = new Date().toISOString();
  
  console.log('\n✅ Scraping automatique terminé');
  console.log('\n📊 Rapport de scraping:');
  console.log(`   Total URLs: ${scrapingReport.totalUrls}`);
  console.log(`   Succès: ${scrapingReport.successfulUrls}`);
  console.log(`   Échecs: ${scrapingReport.failedUrls.length}`);
  console.log(`   Doublons: ${scrapingReport.duplicateUrls.length}`);
  console.log(`   Données vides: ${scrapingReport.emptyDataUrls.length}\n`);
}

cron.schedule('55 12 * * 1', () => {
  console.log('⏰ Déclenchement du scraping hebdomadaire');
  scrapeAllCountries();
}, {
  timezone: 'Europe/Paris'
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startServer() {
  await connectDB();
  
  app.listen(CONFIG.PORT, () => {
    console.log(`\n🚀 Serveur de scraping démarré sur http://localhost:${CONFIG.PORT}`);
    console.log(`📊 MongoDB connecté: ${CONFIG.DB_NAME}`);
    console.log(`🌍 Pays configurés: ${CONFIG.SCRAPING_TARGETS.length}`);
    console.log(`🤖 IA utilisée: Google Gemini 2.0 Flash`);
    console.log('\n📍 Endpoints disponibles:');
    console.log(`   GET  /scrape/:country        - Scraper un pays`);
    console.log(`   POST /scrape/all             - Scraper tous les pays`);
    console.log(`   GET  /requirements/:country  - Récupérer les exigences`);
    console.log(`   GET  /requirements           - Liste tous les pays`);
    console.log(`   GET  /scraping-report        - 📊 Rapport de scraping complet`);
    console.log(`   GET  /ineffective-urls       - 🚫 Liens inefficaces uniquement`);
    console.log(`   GET  /health                 - État du serveur`);
    console.log('\n⏰ Scraping automatique: Tous les dimanches à 21h30\n');
  });
}

startServer().catch(console.error);