# 🎨 Quiz App - Guide de Handover

## 📋 Vue d'ensemble

Application de quiz interactive construite avec React, TypeScript et Tailwind CSS, alignée sur le design system de Match My School.

## 🎯 Design System

### Tokens de design
Tous les tokens sont définis dans `src/tokens/design-tokens.json` et configurés dans `tailwind.config.js`.

#### Couleurs
- **Primary**: `#6366F1` (Indigo)
- **Secondary**: `#EC4899` (Pink)
- **Neutral**: Échelle de gris de 50 à 900
- **Semantic**: Success (vert), Warning (orange), Error (rouge), Info (bleu)

#### Espacements
- `xs`: 0.25rem (4px)
- `sm`: 0.5rem (8px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `2xl`: 3rem (48px)
- `3xl`: 4rem (64px)

#### Border Radius
- `sm`: 0.375rem
- `md`: 0.5rem
- `lg`: 0.75rem
- `xl`: 1rem
- `2xl`: 1.5rem

#### Shadows
- `sm`, `md`, `lg`, `xl` - Définis selon Material Design

### Typographie
- **Sans**: Inter (texte courant)
- **Heading**: Poppins (titres)
- Tailles: xs (12px) à 4xl (36px)

## ♿ Accessibilité

### Contrastes WCAG AA
Tous les textes respectent un ratio de contraste minimum de 4.5:1 (texte normal) ou 3:1 (texte large).

### Cibles tactiles
- Minimum: 44x44px (classe `.touch-target`)
- Tous les boutons et éléments interactifs respectent cette taille

### Focus visible
- Tous les éléments interactifs ont un outline visible au focus
- Classe utilitaire `.focus-ring` disponible
- Couleur: `#6366F1` avec 2px de largeur

### Navigation clavier
- Tous les modals se ferment avec `Escape`
- Focus trap dans les modals
- Ordre de tabulation logique

## 🖼️ Iframe / WebView

### Gestion du thème
```javascript
// L'hôte peut envoyer le thème via postMessage
window.postMessage({
  type: 'theme',
  theme: 'dark' // ou 'light'
}, '*');
