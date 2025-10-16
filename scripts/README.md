# Générateur d'icônes et d'écrans de démarrage

Ce dossier contient des scripts pour générer les différentes tailles d'icônes et d'écrans de démarrage nécessaires pour l'application PWA.

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn

## Installation des dépendances

```bash
npm install
```

## Génération des icônes

1. Placez une image carrée de 1024x1024px nommée `icon.png` dans ce dossier
2. Exécutez la commande :
   ```bash
   npm run generate-icons
   ```

## Génération des écrans de démarrage

1. Placez une image de 1242x2436px nommée `splash-original.png` dans ce dossier
2. Exécutez la commande :
   ```bash
   npm run generate-splash
   ```

## Génération de tous les assets

Pour générer à la fois les icônes et les écrans de démarrage :

```bash
npm run prepare-assets
```

## Fichiers générés

Les fichiers générés seront placés dans le dossier `public/` :

- `icon-192x192.png` - Icône pour Android/Chrome
- `icon-512x512.png` - Icône pour les écrans haute résolution
- `splash.png` - Écran de démarrage pour iPhone X/11/12/13
- `splash-*.png` - Autres tailles d'écrans de démarrage

## Notes

- Assurez-vous que les images sources ont une résolution suffisante pour éviter le flou
- Les images générées sont automatiquement optimisées pour le web
