# HackSpice – Test d’éligibilité aux visas étudiants

HackSpice est une plateforme web interactive qui aide les étudiants à évaluer leur niveau d’admissibilité pour obtenir un visa étudiant en fonction de leur pays d’origine, du pays de destination, et de leur profil académique et administratif.  
Le projet combine une application web (frontend + backend) et un serveur de scraping automatisé collectant des données de référence sur les visas étudiants.

---

## Table des matières

- Structure du projet
- Installation
- Lancement du projet
- Scraping automatique des données
- Technologies utilisées
- Organisation du code
- Fonctionnalités principales
- Améliorations futures

---

## Structure du projet

Le projet est organisé en trois parties principales :

```bash
.
├── backend/ # API et logique serveur Node.js (tests, utilisateurs, etc.)
├── frontend/ # Application web React/TypeScript
├── serveur/ # Scraper de données sur les visas étudiants
├── package-lock.json
└── package.json
```

---

## Installation

Avant de commencer, vérifie que tu as Node.js v20+ et npm installés sur ta machine.

Clone le projet :

```bash
git clone https://github.com/melissaepitech/hackspice.git
cd hackspice
```

Installe les dépendances des trois modules :

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../serveur && npm install
```

---

## Lancement du projet

### Démarrer le frontend

```bash
cd frontend
npm run dev
```

L’application frontend est disponible sur http://localhost:5173 (ou autre port configuré par Vite).

### Démarrer le backend

```bash
cd backend
npm run dev
```

Le backend écoute par défaut sur http://localhost:3000.

### Démarrer le serveur de scraping

```bash
cd serveur
npm start
```

Ce serveur extrait automatiquement les données relatives aux visas depuis des sources officielles et les stocke dans ta base de données.

---

## Scraping automatique des données

Le scraper est configuré pour s’exécuter tous les lundis à 3h du matin.  
Il récupère et met à jour les informations de 19 pays occidentaux concernant les critères d’admissibilité, pièces justificatives et exigences de visa étudiant.

Les données extraites sont enregistrées dans un fichier `test-scraper.json` et/ou synchronisées avec la base de données du backend selon la configuration.

---

## Technologies utilisées

### Backend

- Node.js / Express
- MongoDB / Mongoose
- Dotenv (gestion des variables d’environnement)
- Nodemon (développement)
- Middlewares d’authentification (JWT)

### Frontend

- React + TypeScript
- Vite
- Axios (requêtes API)
- Composants modulaires TypeScript

### Serveur de scraping

- Node.js
- Puppeteer / Cheerio
- Cron (planification du scraping automatique)

---

## Organisation du code

### Backend

```bash
backend/
├── controllers/ # Logique métier : auth, questions, résultats, etc.
├── middlewares/ # Authentification et autorisation
├── models/ # Schémas Mongoose
├── routes/ # Routes Express
├── utils/ # Fonctions utilitaires
└── server.js # Point d’entrée du serveur
```

### Frontend

```bash
frontend/src/
├── components/ # Composants réutilisables (questions, menus, widgets…)
├── pages/ # Pages principales (Home, Dashboard, ResultPage…)
├── services/ # Fichier api.ts pour communication backend
└── data/ # Données statiques (pays d’origine/destination)
```

### Serveur

```bash
serveur/
├── server.js # Lancement du scraping et planification
└── test-scraper.json # Données extraites
```

---

## Fonctionnalités principales

- Création de compte étudiant et authentification (JWT)
- Sélection du pays d’origine et du pays de destination
- Test d’admissibilité interactif basé sur des questions dynamiques
- Tableau de bord administrateur pour visualiser les résultats
- Scraping automatique hebdomadaire des données visa
- Interface utilisateur moderne et responsive

---

## Améliorations futures

- Intégration de notifications pour informer les utilisateurs des changements de critères de visa
- Support de nouvelles zones géographiques au-delà des 19 pays actuels
- Ajout d’une API publique pour partenaires institutionnels
- Tableau de bord data analytics (statistiques globales, tendances par pays)

