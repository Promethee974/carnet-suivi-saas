import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { prisma } from '../config/database.js';

// Configuration globale des tests
beforeAll(async () => {
  console.log('🧪 Initialisation de l\'environnement de test...');

  // Vérifier que nous sommes bien en environnement de test
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  NODE_ENV n\'est pas défini sur "test"');
  }
});

afterAll(async () => {
  console.log('🧹 Nettoyage de l\'environnement de test...');

  // Fermer la connexion Prisma
  await prisma.$disconnect();
});

// Nettoyer la base de données avant chaque test
beforeEach(async () => {
  // Note: En production, utiliser une base de données de test séparée
  // et nettoyer toutes les tables avant chaque test
});

afterEach(async () => {
  // Cleanup après chaque test si nécessaire
});
