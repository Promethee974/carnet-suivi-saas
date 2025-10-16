# Carnet de Suivi GS - Programmes 2025

Application web moderne pour le suivi des apprentissages en Grande Section de maternelle, conforme aux programmes officiels 2025.

## Fonctionnalités Principales

### Gestion Multi-Élèves
- Création/modification d'élèves avec avatars
- Import CSV pour création en masse
- Suppression sécurisée avec confirmation
- Interface en cartes responsive

### Évaluation des Compétences
- 8 domaines des programmes 2025 avec couleurs
- ~150 compétences détaillées
- Notation NA/EC/A avec commentaires
- Galeries photos par compétence
- Mise à jour temps réel des statistiques
- États : **NA** (Non acquis) / **EC** (En cours) / **A** (Acquis)
- Observations textuelles par compétence
- Progression visuelle par domaine (barres + pourcentages)
- **Migration automatique** des anciennes données

### ✅ Galerie photos
- Photos par compétence (miniatures + plein écran)
- Capture caméra si disponible
- Compression automatique (max 1280px, JPEG 85%)
- Stockage en IndexedDB (offline)

### ✅ Export/Import Multi-Élèves
- **Export individuel** par élève (JSON + photos)
- **Import CSV français** pour créer plusieurs élèves
- **Import de carnet** vers un élève existant
- **Impression/PDF** par élève avec styles dédiés

### ✅ Interface moderne
- Thème clair/sombre persistant
- Design responsive (mobile-first)
- Web Components modulaires
- Accessibilité (ARIA, focus management)

### ✅ PWA offline-first
- Service Worker + cache statique
- Manifest pour installation
- Fonctionne sans connexion

## 🛠 Tech Stack

- **TypeScript** + **Vite** (dev/build)
- **Tailwind CSS** (design system)
- **Web Components** (Custom Elements)
- **IndexedDB** via `idb` (stockage offline)
- **PWA** (vite-plugin-pwa)

## 📦 Installation & Développement

```bash
# Installation
npm install

# Serveur de développement
npm run dev

# Build production
npm run build

# Aperçu build
npm run preview
```

## 📁 Structure

```
src/
├── main.ts              # Bootstrap, router, thème
├── styles/
│   ├── tailwind.css     # Styles principaux
│   └── print.css        # Styles d'impression
├── components/          # Web Components
│   ├── app-header.ts    # Entête + métadonnées
│   ├── domain-card.ts   # Carte domaine + progression
│   ├── skill-item.ts    # Compétence + évaluation
│   └── photo-gallery.ts # Galerie photos
├── data/
│   ├── schema.ts        # Types TypeScript
│   └── skills.ts        # Catalogue compétences GS
├── store/
│   ├── db.ts           # Configuration IndexedDB
│   └── repo.ts         # API CRUD (carnet, photos)
├── utils/
│   ├── image.ts        # Compression images
3. **Évaluer les compétences** : cliquer sur "Détails" dans chaque domaine
4. **Ajouter observations et photos** pour chaque compétence
5. **Suivre la progression** via les statistiques personnalisées

### 💾 Sauvegarde et Export
1. **Export individuel** : Sauvegarder le carnet d'un élève (JSON + photos)
2. **Import de carnet** : Restaurer les données d'un élève
3. **Impression** : Générer un PDF du carnet par élève

## 📱 PWA

L'application peut être installée sur mobile/desktop :
- Chrome/Edge : bouton "Installer l'app" dans la barre d'adresse
- Safari iOS : "Partager" > "Sur l'écran d'accueil"

## 🎨 Thèmes

Basculer entre thème clair/sombre via le bouton "Thème" dans la barre d'outils.
Le choix est persistant (localStorage).

## 📄 Impression

Styles d'impression optimisés pour A4 :
- Masquage des éléments interactifs
- Mise en page adaptée
- Conservation des couleurs d'état

---

**Développé avec ❤️ pour les enseignants de maternelle**
