import { prisma } from '../config/database.js';

async function cleanCarnets() {
  try {
    console.log('🧹 Nettoyage des carnets de suivi statiques...');

    // Supprimer tous les carnets existants pour forcer la regénération avec le programme dynamique
    const deleted = await prisma.carnet.deleteMany({});

    console.log(`✅ ${deleted.count} carnets supprimés`);
    console.log('✅ Les carnets seront regénérés automatiquement avec le programme dynamique lors de la prochaine consultation');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

cleanCarnets();
