const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const SPLASH_SIZES = [
  { width: 1242, height: 2436, name: 'splash.png' },
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' },
  { width: 1536, height: 2048, name: 'splash-1536x2048.png' },
  { width: 1668, height: 2224, name: 'splash-1668x2224.png' },
  { width: 2048, height: 2732, name: 'splash-2048x2732.png' },
];

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function generateSplashScreens() {
  const publicDir = path.join(__dirname, '../public');
  await ensureDir(publicDir);

  // Vérifier si l'image source existe
  const sourceSplash = path.join(__dirname, 'splash-original.png');
  try {
    await fs.access(sourceSplash);
  } catch (err) {
    console.error('Erreur: Le fichier splash-original.png est introuvable dans le dossier scripts/');
    console.log('Veuillez placer une image 1242x2436px nommée splash-original.png dans le dossier scripts/');
    return;
  }

  console.log('Génération des écrans de démarrage...');
  
  // Générer les différentes tailles d'écrans de démarrage
  await Promise.all(
    SPLASH_SIZES.map(async ({ width, height, name }) => {
      const outputPath = path.join(publicDir, name);
      await sharp(sourceSplash)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .toFile(outputPath);
      console.log(`Écran généré: ${outputPath}`);
    })
  );

  console.log('Tous les écrans de démarrage ont été générés avec succès!');
}

generateSplashScreens().catch(console.error);
