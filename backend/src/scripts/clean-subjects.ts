import { prisma } from '../config/database.js';

async function cleanSubjects() {
  try {
    console.log('🧹 Nettoyage des matières sans school_year_id...');

    // Supprimer toutes les matières
    const deleted = await prisma.subject.deleteMany({});

    console.log(`✅ ${deleted.count} matières supprimées`);
    console.log('✅ Base de données nettoyée avec succès');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

cleanSubjects();
