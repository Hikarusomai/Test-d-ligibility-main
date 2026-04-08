================================================================================
EMAIL À COPIER-COLLER
================================================================================

Objet : Module Test Visa - Specs + Clé API

Salut Mohcine,

Je t'envoie les specs pour le module Test d'Éligibilité VISA à intégrer dans
MatchMySchool.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📎 Pièces jointes

• DOCUMENTATION_COMPLETE_PDF.pdf     → Toute la doc technique
• VISA_QUESTIONS.json                 → Les 23 questions à intégrer
• [Lien vidéo démo]                    → Capture du test en action
• http://visa.leadops.website/        → Backend pour tester en live

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 Clé API Perplexity (pour les briefings IA)

PERPLEXITY_API_KEY=[À FOURNIR SÉPARÉMENT PAR EMAIL SÉCURISÉ]

À ajouter dans le .env de MMS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Ce qu'on demande

Intégrer ce test VISA dans MatchMySchool à cet endroit :

[Insérer capture/schéma du popup admission ou header]

Le bouton "Test d'Éligibilité VISA" doit :
- Soit s'afficher dans le popup d'admission
- Soit dans le header menu

L'UI sera refaite pour matcher le design MMS (l'actuelle est juste pour le test).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️ Technique - 5 points à retenir

1. **Backoffice Builder** : Les questions doivent suivre le format MMS
   (voir doc/MMS_BUILDER_STRUCTURE.md). Le JSON joint est en FR pour référence.

2. **Bilingue FR/EN** : Le builder MMS gère déjà le multi-langue (🇫🇷/🇬🇧).
   Chaque question a title + title_en, chaque option a title + title_en.

3. **Type "VISA"** : Créer un nouveau type de test "VISA" (comme "Special" et "Custom").

4. **DB** : collections MMS existantes + country_requirements (nouvelle).

5. **Limitations** : 3 tests/semaine, 10 tests/mois, 100 questions chatbot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Variables .env à ajouter :

GEMINI_API_KEY=[à fournir]
PERPLEXITY_API_KEY=[À FOURNIR SÉPARÉMENT PAR EMAIL SÉCURISÉ]
VISA_TEST_WEEKLY_LIMIT=3
VISA_TEST_MONTHLY_LIMIT=10
CHATBOT_QUOTA_PER_USER=100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API Endpoints :

POST /api/visa/test/submit
GET  /api/visa/test/my
GET  /api/visa/briefing/:id

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dispo pour un call si tu as des questions.

À+

[Ton Nom]

================================================================================
