import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import bcrypt from 'bcrypt';

/**
 * Génère un token JWT valide pour les tests
 */
export function generateTestToken(payload: {
  userId: string;
  email: string;
  role?: string;
}): string {
  return jwt.sign(
    {
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
      role: payload.role || 'TEACHER',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Crée un utilisateur de test dans la base de données
 */
export async function createTestUser(overrides?: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
}) {
  const email = overrides?.email || `test-${Date.now()}@example.com`;
  const password = overrides?.password || 'Test1234!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: overrides?.firstName || 'Test',
      lastName: overrides?.lastName || 'User',
      role: overrides?.role || 'TEACHER',
      emailVerified: true,
    },
  });

  return {
    user,
    password,
    token: generateTestToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    }),
  };
}

/**
 * Crée une année scolaire de test
 */
export async function createTestSchoolYear(userId: string, overrides?: {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}) {
  return prisma.schoolYear.create({
    data: {
      userId,
      name: overrides?.name || '2024-2025',
      startDate: overrides?.startDate || new Date('2024-09-01'),
      endDate: overrides?.endDate || new Date('2025-07-05'),
      isActive: overrides?.isActive ?? true,
    },
  });
}

/**
 * Crée un élève de test
 */
export async function createTestStudent(
  userId: string,
  overrides?: {
    nom?: string;
    prenom?: string;
    schoolYearId?: string;
  }
) {
  return prisma.student.create({
    data: {
      userId,
      nom: overrides?.nom || 'Dupont',
      prenom: overrides?.prenom || 'Jean',
      schoolYearId: overrides?.schoolYearId || null,
    },
  });
}

/**
 * Nettoie toutes les données de test pour un utilisateur
 */
export async function cleanupTestUser(userId: string) {
  // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
  await prisma.photo.deleteMany({ where: { userId } });
  await prisma.tempPhoto.deleteMany({ where: { userId } });
  await prisma.carnet.deleteMany({ where: { userId } });
  await prisma.student.deleteMany({ where: { userId } });
  await prisma.subject.deleteMany({ where: { userId } });
  await prisma.schoolYear.deleteMany({ where: { userId } });
  await prisma.activityLog.deleteMany({ where: { userId } });
  await prisma.backup.deleteMany({ where: { userId } });
  await prisma.userPreferences.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

/**
 * Génère un email unique pour les tests
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}
