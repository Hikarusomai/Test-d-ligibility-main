# Coûts et Dépenses - HackSpice

Ce document détaille l'ensemble des coûts associés au fonctionnement de la plateforme HackSpice, incluant les services API et l'hébergement de la base de données.

---

## Vue d'ensemble des coûts mensuels estimés

| Service | Usage | Coût mensuel estimé |
|---------|-------|---------------------|
| Google Gemini Pro API | Scraping mensuel (1er lundi du mois) | $0 - $5 |
| Perplexity API | Génération de briefings personnalisés | $0 - $5 |
| MongoDB Atlas | Base de données (stockage données scrapées) | $0 (forfait gratuit) |
| Hébergement | Aucun hébergement cloud externe | $0 |
| **TOTAL ESTIMÉ** | | **$0 - $10/mois** |

---

## Détail des coûts par service

### 1. Google Gemini Pro API

**Usage :** Scraping automatique des données visa (19 pays) le premier lundi de chaque mois à 3h du matin.

**Tarification (2025) :**
- **Gemini 2.5 Pro :**
  - Input : $1.25 par million de tokens (≤ 200K tokens)
  - Output : $10.00 par million de tokens (≤ 200K tokens)
- **Gemini 2.5 Flash (alternative économique) :**
  - Input : $0.15 par million de tokens
  - Output : $0.60 par million de tokens (sans raisonnement)

**Estimation mensuelle :**
- 1 exécution par mois (premier lundi du mois uniquement)
- Environ 50K-100K tokens par scraping session
- **Coût estimé : $0 - $5/mois**
- Note : Le tier gratuit offre 1,500 requêtes gratuites par jour, largement suffisant pour une exécution mensuelle

**Optimisation possible :**
- Utiliser Gemini 2.5 Flash pour réduire les coûts de 80-90%
- Mettre en cache les résultats pour éviter les requêtes redondantes
- Avec 1 scraping/mois, forte probabilité de rester dans le tier gratuit

---

### 2. Perplexity API

**Usage :** Génération de briefings personnalisés à la fin de chaque test étudiant, en utilisant les données scrapées stockées dans MongoDB.

**Tarification (2025) :**
- **Crédit gratuit inclus :** $5 offerts
- **Coût par briefing :** $0.01 (1 centime) par génération, voire $0 selon optimisation
- Une fois les $5 gratuits consommés : facturation au centime près

**Estimation mensuelle :**
- Avec $5 gratuits : **500 briefings gratuits**
- Au-delà : **$0.01 par briefing supplémentaire**
- Pour un usage modéré (< 500 briefings/mois) : **$0/mois**
- Pour un usage élevé (500-1000 briefings/mois) : **$0-5/mois**

**Notes :**
- Les $5 gratuits permettent de démarrer sans coût
- Monitoring recommandé pour anticiper le dépassement
- Possibilité d'optimiser les prompts pour réduire encore les coûts

---

### 3. MongoDB Atlas

**Usage :** Stockage des données scrapées (exigences visa, critères d'admissibilité), profils utilisateurs, soumissions de tests.

**Forfait utilisé : Shared Cluster M0 (gratuit à vie)**

**Caractéristiques du forfait gratuit :**
- **Stockage :** 512 MB
- **RAM :** Partagée
- **vCPUs :** Partagés
- **Opérations :** Jusqu'à 100 ops/seconde
- **Bande passante :** Incluse
- **Sauvegardes :** Non automatiques (snapshots manuels possibles)

**Coût mensuel : $0 (gratuit à vie)**

**Capacité estimée :**
- Données de 19 pays (structures visa, critères) : ~20-50 MB
- Profils utilisateurs (quelques milliers) : ~50-100 MB
- Soumissions de tests : ~100-200 MB
- **Total prévu : < 400 MB** → Largement dans la limite des 512 MB

**Notes :**
- Aucun coût prévu tant que le stockage reste sous 512 MB
- Migration vers M2 ($9/mois) possible si dépassement

---

### 4. Hébergement

**Configuration actuelle :** Aucun hébergement cloud externe

**Coût : $0/mois**

**Notes :**
- Frontend, backend et serveur de scraping tournent en local ou sur infrastructure personnelle
- Aucun frais d'hébergement cloud (Vercel, Render, AWS, etc.)
- Si déploiement cloud futur envisagé : prévoir $0-40/mois selon la solution choisie

---

## Scénarios de coûts

### Scénario actuel : Configuration minimale

**Coûts mensuels :**
- Gemini Pro API (1 scraping/mois) : **$0** (tier gratuit suffisant)
- Perplexity API (< 500 briefings/mois) : **$0** ($5 gratuits non épuisés)
- MongoDB Atlas (forfait gratuit) : **$0**
- Hébergement : **$0**

**TOTAL ACTUEL : $0/mois**

---

### Scénario 1 : Usage modéré (500-1000 briefings/mois)
- Gemini Pro : **$0-2**
- Perplexity API (dépassement des $5 gratuits) : **$0-5**
- MongoDB : **$0**
- Hébergement : **$0**

**TOTAL : $0-7/mois**

---

### Scénario 2 : Usage intensif (1000+ briefings/mois)
- Gemini Pro : **$2-5**
- Perplexity API (1000+ briefings) : **$5-10**
- MongoDB : **$0** (ou $9 si migration vers M2)
- Hébergement : **$0**

**TOTAL : $7-15/mois** (sans hébergement cloud)

---

## Projection annuelle

### Année 1 - Phase de test et validation

**Hypothèses :**
- Scraping mensuel (12 fois/an)
- Moyenne de 300 briefings/mois
- Pas de déploiement cloud

**Coûts annuels estimés :**
- Gemini Pro : **$0-24**
- Perplexity : **$0-36** (après épuisement des $5 gratuits)
- MongoDB : **$0**
- Hébergement : **$0**

**TOTAL ANNUEL : $0-60**

---

## Recommandations d'optimisation des coûts

### Optimisations actuelles (déjà en place)
MongoDB gratuit (tier M0) : économie de $57/mois  
Pas d'hébergement cloud : économie de $40-80/mois  
Scraping mensuel uniquement (vs hebdomadaire) : économie de 75% sur Gemini  
Utilisation des $5 gratuits Perplexity : 500 briefings sans coût  

### Optimisations supplémentaires recommandées

**Court terme :**
1. **Mettre en cache les briefings similaires** pour éviter les appels API redondants
2. **Optimiser les prompts Perplexity** pour rester sous la barre de $0.01 par briefing
3. **Utiliser Gemini Flash** au lieu de Pro pour le scraping (économie de 80%)
4. **Monitorer le stockage MongoDB** pour anticiper un éventuel dépassement des 512 MB

**Moyen terme :**
1. **Implémenter un système de templates** pour les briefings récurrents
2. **Compresser les données scrapées** dans MongoDB pour optimiser le stockage
3. **Limiter les briefings personnalisés** aux utilisateurs premium (si modèle freemium)
4. **Scheduler intelligemment** le scraping pour éviter les heures de pointe API

**Long terme :**
1. **Auto-héberger certaines fonctionnalités** si le volume justifie l'investissement
2. **Négocier des tarifs entreprise** avec Perplexity au-delà de 10,000 briefings/mois
3. **Évaluer des alternatives open-source** pour certaines fonctionnalités IA

---

## Monitoring et alertes recommandées

### Surveillance des quotas
- **Perplexity :** Créer une alerte à $4/$5 de crédit consommé
- **MongoDB :** Surveiller l'utilisation du stockage (alerte à 400 MB / 512 MB)
- **Gemini :** Tracker le nombre de tokens consommés par scraping

### Dashboard de suivi
- Nombre de briefings générés / mois
- Tokens consommés par service
- Espace de stockage MongoDB utilisé
- Coût cumulé mensuel et annuel

### Révision mensuelle
- Analyser les pics d'utilisation
- Identifier les opportunités d'optimisation
- Ajuster la stratégie si dépassement des seuils gratuits

---

## Points d'attention

### Limites du forfait gratuit MongoDB (M0)
- **Pas de sauvegardes automatiques** : prévoir des exports manuels réguliers
- **Performances limitées** : 100 opérations/sec max (suffisant pour usage actuel)
- **Pas de déploiement multi-région** : données hébergées sur une seule région
- **Support communautaire uniquement** : pas de SLA garanti

### Risques de dépassement
1. **Perplexity :** Si > 500 briefings/mois, facturation au centime près
2. **MongoDB :** Si stockage > 512 MB, migration forcée vers M2 ($9/mois)
3. **Gemini :** Si augmentation de la fréquence de scraping, coûts proportionnels

---

## Conclusion

Grâce à une configuration optimisée, HackSpice fonctionne actuellement **à coût zéro** :
- Scraping mensuel uniquement (vs hebdomadaire)
- MongoDB en forfait gratuit permanent
- Utilisation intelligente des crédits gratuits Perplexity
- Pas d'hébergement cloud externe

**Coût opérationnel actuel : $0/mois**

Les premiers coûts n'apparaîtront qu'au-delà de :
- **500 briefings/mois** (Perplexity)
- **512 MB de données** (MongoDB)
- **Usage intensif du scraping** (Gemini)

Cette configuration permet de valider le concept et d'acquérir des utilisateurs sans investissement financier, avec une migration progressive vers des services payants uniquement en cas de succès et de croissance significative.

---

*Dernière mise à jour : Novembre 2025*
