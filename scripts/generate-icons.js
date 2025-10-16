const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const SIZES = [192, 512];
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

async function generateIcons() {
  const publicDir = path.join(__dirname, '../public');
  await ensureDir(publicDir);

  // Vérifier si l'image source existe
  const sourceIcon = path.join(__dirname, 'icon.png');
  try {
    await fs.access(sourceIcon);
  } catch (err) {
    console.error('Erreur: Le fichier icon.png est introuvable dans le dossier scripts/');
    console.log('Veuillez placer une icône 1024x1024px nommée icon.png dans le dossier scripts/');
    return;
  }

  console.log('Génération des icônes...');
  
  // Générer les icônes dans différentes tailles
  await Promise.all(
    SIZES.map(async (size) => {
      const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
      await sharp(sourceIcon)
        .resize(size, size)
        .toFile(outputPath);
      console.log(`Icône générée: ${outputPath}`);
    })
  );

  // Créer un favicon
  await sharp(sourceIcon)
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Favicon généré');

  // Créer un fichier SVG pour le favicon
  await fs.copyFile(
    path.join(__dirname, 'icon.svg'),
    path.join(publicDir, 'icon.svg')
  );
  console.log('Icône SVG copiée');

  console.log('Toutes les icônes ont été générées avec succès!');
  console.log('\nPlacez maintenant une image de 1242x2436px nommée splash-original.png dans le dossier scripts/ et exécutez:');
  console.log('node scripts/generate-splash.js');
}

generateIcons().catch(console.error);
