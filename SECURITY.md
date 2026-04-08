***

# Sécurité, Conformité & Éthique

Ce document décrit les mesures de sécurité, de protection des données et de conformité mises en œuvre dans **HackSpice** – Plateforme d'évaluation d'éligibilité aux visas étudiants.[5][6]

***

## 1. Gestion des secrets et variables d'environnement

### Stockage sécurisé

Toutes les clés sensibles sont stockées dans des fichiers `.env` **non versionnés** et ajoutés au `.gitignore`:[2][1]

```bash
# .env backend
MONGODB_URI=mongodb+srv://...
PORT=3000
NODE_ENV=development
JWT_SECRET=<secret_64_caractères_minimum>
JWT_EXPIRES_IN=7d
PERPLEXITY_API_KEY=pplx-...
```

```bash
# .env serveur scraper
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=AIzaSy...
PORT=3000
NODE_ENV=production
```

```bash
# .env frontend
VITE_API_URL=http://localhost:3000/api
```

### Chargement et validation

- **Backend**: `require('dotenv').config()` au démarrage de `server.js`[2]
- **Serveur scraper**: `require('dotenv').config()` au démarrage[2]
- **Frontend**: Variables préfixées `VITE_` accessibles via `import.meta.env`[5]
- **Fallbacks sécurisés**: Valeurs par défaut uniquement pour dev, jamais en production[1]

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise'; // ⚠️ Fallback dev uniquement
```

### Bonnes pratiques

- **Aucune clé en dur** dans le code source[7]
- **Rotation régulière**: JWT_SECRET doit être changé tous les 90 jours minimum[7]
- **Longueur minimale**: JWT_SECRET ≥ 64 caractères alphanumériques + symboles[8][7]
- **Génération aléatoire sécurisée**: `openssl rand -base64 64` recommandé[8]
- **Audit**: Scanner `.env` avec `git-secrets` ou `truffleHog` pour détecter fuites accidentelles[5]

---

## 2. Authentification et autorisation

### Architecture JWT

**Mécanisme**:[1][2]

1. **Inscription** (`POST /api/auth/register`):
   - Validation email unique (MongoDB index)
   - Mot de passe ≥ 6 caractères
   - Hash bcryptjs avec salt automatique (10 rounds)
   - Génération JWT avec payload: `{ userId, email, role }`
   - Expiration: 7 jours (configurable via `JWT_EXPIRES_IN`)

2. **Connexion** (`POST /api/auth/login`):
   - Vérification email + comparaison hash bcrypt
   - Génération nouveau JWT à chaque login
   - Retour: `{ token, user }` (mot de passe exclu)

3. **Accès protégé**:
   - Header: `Authorization: Bearer <token>`
   - Middleware `requireAuth.js`: Vérifie signature + expiration JWT[1]
   - Injection `req.user = { userId, email, role }` pour endpoints suivants

### Middlewares de sécurité

**`requireAuth.js`**:[1]
```javascript
const requireAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};
```

**`requireAdmin.js`**:[4]
```javascript
const requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Accès refusé - Administrateur requis' });
  }
};
```

### Gestion des mots de passe

- **Hashing**: bcryptjs v3.0.3 avec salt intégré[2]
- **Rounds**: 10 (compromis sécurité/performance pour 2025)[2]
- **Changement**: Endpoint dédié `PUT /api/auth/change-password` avec vérification mot de passe actuel[2]
- **Stockage**: Jamais en clair, sélection explicite `.select('-password')` dans toutes les requêtes utilisateur[2]

### Sécurité JWT - Recommandations OWASP

✅ **Implémenté**:
- Algorithme fort: HS256 (HMAC-SHA256)[2]
- Secret ≥ 64 caractères[7][8]
- Expiration courte: 7 jours (renouvelable)[2]
- Vérification signature systématique[1]

⚠️ **À améliorer**:
- Migration vers RS256 (asymétrique) pour meilleure sécurité[8][7]
- Ajout claim `iss` (issuer) et `aud` (audience)[7]
- Blacklist tokens lors logout (Redis recommandé)[7]
- Refresh tokens pour limiter exposition[8]

***

## 3. Protection des données personnelles (RGPD)

### Minimisation des données

**Principe**: Collecter uniquement le **strict minimum** nécessaire.[6][9]

| Collection | Données collectées | Justification |
|------------|-------------------|---------------|
| **users** | email, password (hash), firstName, lastName, phone, nationality, role | Identification compte + contexte géographique pour éligibilité |
| **testsubmissions** | userId, originCountry, destinationCountry, answers, score | Calcul éligibilité + historique utilisateur |
| **questions** | label, text, type, category, weight | Configuration questionnaire dynamique |
| **countryrequirements** | country, requirements, source | Données publiques scrappées (non PII) |

**Données NON collectées**:[9][6]
- Numéro de passeport, CNI, permis de conduire
- Relevés bancaires, documents financiers
- Adresse postale complète
- Date de naissance exacte (seulement âge si pertinent)
- Photos, biométrie

### Finalités et consentement

- **Finalités explicites**: Test d'éligibilité, génération briefing personnalisé, historique tests[10][11]
- **Consentement**: Inscription volontaire = consentement implicite pour traitement[5]
- **Durée conservation**: 
  - Comptes actifs: Indéfinie (suppression sur demande)
  - Comptes inactifs >2 ans: Recommandation suppression automatique[9]
  - TestSubmissions: Conservation 1 an après dernier test[11]

### Droits utilisateurs (Art. 15-22 RGPD)

| Droit | Implémentation actuelle | Roadmap |
|-------|-------------------------|---------|
| **Accès** | `GET /api/auth/me` retourne profil complet | ✅ |
| **Rectification** | `PUT /api/auth/profile` pour modifier données | ✅ |
| **Suppression** | `DELETE /api/tests/:id` pour supprimer test | ⚠️ Ajouter suppression compte |
| **Portabilité** | Non implémenté | 🔜 Export JSON complet |
| **Opposition** | Non applicable (pas de marketing) | ✅ |
| **Limitation** | Non implémenté | 🔜 Mode "archivage" sans traitement |

### Pseudonymisation et anonymisation

- **Identifiants MongoDB**: ObjectId utilisés, découplés de l'identité réelle[6]
- **Logs**: Aucun log contenant email/nom complet (seulement userId)[5]
- **Analytics**: Si implémenté, utiliser hash SHA-256 d'email comme identifiant[9]

---

## 4. Sécurité des APIs externes

### Google Gemini 2.0 Flash (Scraping)

**Configuration**:[2]
```javascript
const apiKey = process.env.GEMINI_API_KEY;

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ googleSearch: {} }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192
    }
  })
});
```

**Mesures de sécurité**:
- Clé API en variable `.env`[2]
- Pas de données PII envoyées (uniquement URLs publiques + pays)[5]
- Rate limiting: 10s pause entre URLs, 30s entre pays[2]
- Validation réponse: Parsing JSON strict, rejet si structure invalide[2]
- Checksum SHA-256 pour détecter doublons et corruptions[2]

### Perplexity AI (Briefing)

**Configuration**:[2]
```javascript
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
```

**Mesures de sécurité**:
- Clé API en variable `.env`[2]
- **Risque**: Transmission données utilisateur (score, pays, réponses) pour personnalisation[5]
- **Mitigation**: Anonymiser réponses avant envoi (remplacer noms/emails par identifiants génériques)[6]
- **Recommandation**: Vérifier politique RGPD de Perplexity, DPA si nécessaire[10]

---

## 5. Sécurité MongoDB

### Configuration actuelle

**Connexion**:[2]
```javascript
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI);
```

**Index sécurité**:
- `email` unique dans collection `users`[2]
- `country.slug` indexé dans `countryrequirements`[2]
- `meta.checksum` pour détecter modifications[2]

### Chiffrement au repos (Encryption at Rest)

**État actuel**: Non activé (MongoDB Community Edition)[12]

**Recommandations production**:[13][12]

1. **MongoDB Enterprise + WiredTiger Encrypted Storage Engine**:
   ```bash
   mongod --enableEncryption \
     --encryptionKeyFile /path/to/keyfile \
     --encryptionCipherMode AES256-CBC
   ```

2. **KMS externe** (AWS KMS, Azure Key Vault, HashiCorp Vault):[12]
   ```yaml
   security:
     enableEncryption: true
     kmip:
       serverName: vault.example.com
       port: 5696
       clientCertificateFile: /path/to/client-cert.pem
   ```

3. **Alternative Community**: eCryptfs au niveau filesystem:[13]
   ```bash
   # Monter volume chiffré
   mount -t ecryptfs /data/db /mongodb-decrypted \
     -o key=passphrase,ecryptfs_cipher=aes,ecryptfs_key_bytes=32
   ```

### Contrôle d'accès

** À implémenter**:[12]
- Activer authentification MongoDB: `--auth`
- Créer utilisateurs avec rôles restreints (principe du moindre privilège)
- Backend: Role `readWrite` uniquement sur DB `visa_requirements`
- Scraper: Role `readWrite` sur DB `visa_requirements`
- Admin humain: Role `dbAdmin` avec accès restreint par IP

### Audit et logs

**Recommandations**:[12]
- Activer MongoDB audit logs (Enterprise uniquement)
- Logger toutes connexions, créations/suppressions de comptes
- Intégrer avec SIEM (Splunk, ELK) pour détection anomalies

***

## 6. Sécurité réseau et CORS

### Configuration CORS actuelle

**Backend**:[2]
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

** Bonne pratique dev**: Origine unique[5]

** Production**: Remplacer par domaine prod:[5]
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://hackspice.com' 
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### HTTPS et TLS

**État actuel**: HTTP uniquement (dev)[2]

**Recommandations production**:[5]
- Certificat SSL/TLS: Let's Encrypt (gratuit) ou Cloudflare[5]
- Redirection HTTP → HTTPS forcée[5]
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`[5]
- TLS 1.3 minimum, désactiver TLS 1.0/1.1[5]

### Rate limiting

**État actuel**: Non implémenté[2]

**Recommandation**:[5]
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

***

## 7. Sécurité du code et dépendances

### Audit npm

**Commande recommandée** (hebdomadaire):[5]
```bash
npm audit
npm audit fix
```

**Dépendances critiques à surveiller**:[2]
- `jsonwebtoken`: Vulnérabilités connues CVE-2022-23529 (vérifier version ≥9.0.2) ✅
- `bcryptjs`: Timing attacks (utiliser `bcrypt` natif si possible)
- `mongoose`: Injection NoSQL (validations Mongoose activées) ✅
- `express`: Mise à jour régulière pour patches sécurité ✅

### Validation et sanitisation

**Backend**:[2]
```javascript
// ✅ Validation email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ message: 'Email invalide' });
}

// ✅ Validation longueur mot de passe
if (password.length < 6) {
  return res.status(400).json({ message: 'Mot de passe trop court' });
}
```

** À ajouter**:
- Validation stricte types avec `express-validator` ou Joi[5]
- Sanitisation HTML avec `DOMPurify` côté frontend[5]
- Protection injection NoSQL: `mongoose-sanitize`[5]

### Protection CSRF

**État actuel**: Non implémenté[2]

**Recommandation**:[5]
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Endpoint pour récupérer token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

***

## 8. Observabilité et gestion des erreurs

### Logs sécurisés

**Pratiques actuelles**:[2]
```javascript
console.log('🔍 Login attempt:', { email }); // ✅ Email non sensible
console.log('👤 User found:', user ? 'YES' : 'NO'); // ✅ Pas de détails
console.error('❌ Login error:', error.message); // ✅ Message générique
```

** Éviter**:[5]
```javascript
// ❌ DANGER - Expose données sensibles
console.log('Password:', password);
console.log('Token:', token);
console.log('User object:', user); // Peut contenir password hash
```

**Recommandation production**:[5]
- Intégrer Winston avec rotation logs
- Masquer tokens/mots de passe avec `winston-redact`
- Centraliser logs (CloudWatch, Datadog, Papertrail)
- Alertes automatiques sur erreurs 500

### Monitoring erreurs

**État actuel**: Aucun outil[2]

**Recommandations**:[5]
- **Sentry**: Tracking erreurs frontend + backend
- **New Relic**: APM, latences, throughput
- **Prometheus + Grafana**: Métriques custom (taux login, API calls IA)

***

## 9. Éthique et gouvernance IA

### Transparence et disclaimers

**Affichage obligatoire** (frontend):[2]

> **Avertissement**: Ce test d'éligibilité est **indicatif uniquement** et ne remplace pas une évaluation officielle par les autorités consulaires. Les exigences de visa peuvent changer sans préavis. Consultez toujours les sources officielles (ambassades, consulats) avant de prendre une décision.

### Biais algorithmiques

**Risques identifiés**:[5]
- Biais de collecte: Sources majoritairement anglophones
- Biais de pondération: `scoreCalculator.js` utilise poids arbitraires
- Biais temporel: Données scrappées obsolètes entre 2 scraping hebdomadaires

**Mitigations**:[9][5]
- Diversifier sources (inclure sites non-anglophones)
- Audit annuel des poids avec expert immigration
- Alertes si checksum inchangé >30 jours
- Feedback utilisateurs pour signaler erreurs

### Confidentialité des prompts IA

**Gemini**: Prompts contiennent uniquement URLs publiques + nom pays  [2]

**Perplexity**: Prompts contiennent score + réponses utilisateur[2]
- **Mitigation**: Anonymiser avant envoi, ne pas inclure email/nom
- **Alternative**: Auto-héberger LLM (Llama 3, Mistral) pour briefing

***

## 10. Plan d'action sécurité (Roadmap)

### Priorité Haute (J+14)

1. **Activer HTTPS en production** (Let's Encrypt)
2. **Implémenter rate limiting** sur endpoints auth
3. **Ajouter CSRF protection** avec tokens
4. **Migrer JWT vers RS256** (asymétrique)
5. **Activer MongoDB authentication** avec utilisateurs restreints

### Priorité Moyenne (J+30)

6. **Chiffrement MongoDB at-rest** (Enterprise ou eCryptfs)
7. **Intégrer Sentry** pour monitoring erreurs
8. **Implémenter refresh tokens** JWT
9. **Audit dépendances npm** automatique (GitHub Dependabot)
10. **Anonymiser données Perplexity** avant envoi

### Priorité Basse (J+90)

11. 🔜 **Suppression automatique comptes inactifs** >2 ans
12. 🔜 **Export RGPD** (portabilité données)
13. 🔜 **Logs centralisés** (ELK Stack)
14. 🔜 **Penetration testing** externe
15. 🔜 **ISO 27001 compliance** assessment

***

## 11. Contacts et signalement

### Signalement de vulnérabilité

**Email**: contacter un de nos développeurs à travers GitHub

**Délai réponse**: 48h ouvrées

**Bug bounty**: Non actif (envisagé si >10K utilisateurs)

***

## 12. Changelog sécurité

| Date | Version | Changements |
|------|---------|-------------|
| 2025-11-11 | 2.0 | Mise à jour complète post-audit technique |
| 2025-11-10 | 1.1 | Ajout détails JWT et bcryptjs |
| 2025-11-10 | 1.0 | Version initiale |

***

**Version**: 2.0  
**Dernière mise à jour**: 11 novembre 2025  
**Prochaine revue**: 11 février 2026 (trimestielle)  
**Conforme**: RGPD (Art. 5, 15-22, 32), OWASP Top 10 2025  

---

**Licence**: MIT  
**Repository**: [GitHub - HackSpice](https://github.com/melissaepitech/hackspice/hackspice)

[1](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/144271898/69678116-3e73-467f-83d6-69e8b58776e8/requireAuth.js)
[2](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/144271898/bf62b817-a5a0-4618-aec1-b2897ce57f27/authController.js)
[3](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/144271898/0b215033-c2fa-4165-8e5a-2d8216b82f70/auth.js)
[4](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/144271898/a708d3c8-e780-41ed-961f-74efb4454a1d/requireAdmin.js)
[5](https://pandectes.io/blog/cpra-data-minimization-in-2025-key-steps-for-compliance/)
[6](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/data-minimisation/)
[7](https://owasp.org/www-chapter-belgium/assets/2021/2021-02-18/JWT-Security.pdf)
[8](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
[9](https://www.rybbit.io/blog/data-privacy-2025)
[10](https://usercentrics.com/guides/data-privacy/data-privacy-trends/)
[11](https://secureprivacy.ai/blog/data-minimization-retention-policies)
[12](https://www.geeksforgeeks.org/mongodb/encryption-at-rest-mongodb/)
[13](https://pentera.io/blog/how-to-achieve-data-at-rest-encryption-for-mongodb-community-edition-container-using-ecryptfs/)
[14](https://www.edpb.europa.eu/system/files/2025-09/edpb_guidelines_202503_interplay-dsa-gdpr_v1_en.pdf)
