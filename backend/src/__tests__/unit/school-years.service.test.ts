import { describe, it, expect, afterEach } from 'vitest';
import { SchoolYearsService } from '../../modules/school-years/school-years.service.js';
import {
  createTestUser,
  createTestSchoolYear,
  cleanupTestUser,
} from '../helpers/test-utils.js';

describe('SchoolYearsService', () => {
  let testUserId: string | null = null;

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('getAll', () => {
    it('devrait retourner toutes les années scolaires d\'un utilisateur', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await createTestSchoolYear(user.id, { name: '2023-2024' });
      await createTestSchoolYear(user.id, { name: '2024-2025' });
      await createTestSchoolYear(user.id, { name: '2025-2026' });

      const schoolYears = await SchoolYearsService.getAll(user.id);

      expect(schoolYears).toHaveLength(3);
    });

    it('devrait retourner un tableau vide si aucune année scolaire', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYears = await SchoolYearsService.getAll(user.id);

      expect(schoolYears).toHaveLength(0);
    });

    it('devrait trier les années par date de début décroissante', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await createTestSchoolYear(user.id, {
        name: '2023-2024',
        startDate: new Date('2023-09-01'),
      });
      await createTestSchoolYear(user.id, {
        name: '2024-2025',
        startDate: new Date('2024-09-01'),
      });
      await createTestSchoolYear(user.id, {
        name: '2025-2026',
        startDate: new Date('2025-09-01'),
      });

      const schoolYears = await SchoolYearsService.getAll(user.id);

      expect(schoolYears[0].name).toBe('2025-2026');
      expect(schoolYears[1].name).toBe('2024-2025');
      expect(schoolYears[2].name).toBe('2023-2024');
    });

    it('devrait inclure le compteur d\'élèves et de carnets', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await createTestSchoolYear(user.id);

      const schoolYears = await SchoolYearsService.getAll(user.id);

      expect(schoolYears[0]).toHaveProperty('_count');
      expect(schoolYears[0]._count).toHaveProperty('students');
      expect(schoolYears[0]._count).toHaveProperty('carnets');
    });
  });

  describe('getActive', () => {
    it('devrait retourner l\'année scolaire active', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await createTestSchoolYear(user.id, {
        name: 'Non active',
        isActive: false,
      });
      const active = await createTestSchoolYear(user.id, {
        name: 'Active',
        isActive: true,
      });

      const result = await SchoolYearsService.getActive(user.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(active.id);
      expect(result?.name).toBe('Active');
    });

    it('devrait retourner null si aucune année active', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await createTestSchoolYear(user.id, { isActive: false });

      const result = await SchoolYearsService.getActive(user.id);

      expect(result).toBeNull();
    });

    it('ne devrait pas retourner les années archivées', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const { prisma } = await import('../../config/database.js');
      await prisma.schoolYear.create({
        data: {
          userId: user.id,
          name: 'Archived',
          startDate: new Date('2022-09-01'),
          endDate: new Date('2023-07-05'),
          isActive: true,
          isArchived: true,
        },
      });

      const result = await SchoolYearsService.getActive(user.id);

      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('devrait retourner une année scolaire par son ID', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const created = await createTestSchoolYear(user.id, {
        name: '2024-2025',
      });

      const result = await SchoolYearsService.getById(created.id, user.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.name).toBe('2024-2025');
    });

    it('devrait échouer si l\'année n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await expect(
        SchoolYearsService.getById('nonexistent-id', user.id)
      ).rejects.toThrow('Année scolaire non trouvée');
    });

    it('ne devrait pas retourner une année d\'un autre utilisateur', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser();
      testUserId = user1.id;

      const schoolYear = await createTestSchoolYear(user1.id);

      await expect(
        SchoolYearsService.getById(schoolYear.id, user2.id)
      ).rejects.toThrow();

      // Cleanup user2
      await cleanupTestUser(user2.id);
    });
  });

  describe('create', () => {
    it('devrait créer une nouvelle année scolaire', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await SchoolYearsService.create(user.id, {
        name: '2024-2025',
        school: 'École Test',
        classLevel: 'GS',
        startDate: '2024-09-01',
        endDate: '2025-07-05',
      });

      expect(schoolYear).toBeDefined();
      expect(schoolYear.name).toBe('2024-2025');
      expect(schoolYear.school).toBe('École Test');
      expect(schoolYear.userId).toBe(user.id);
    });

    it('devrait définir la nouvelle année comme active par défaut', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await SchoolYearsService.create(user.id, {
        name: '2024-2025',
        startDate: '2024-09-01',
        endDate: '2025-07-05',
      });

      expect(schoolYear.isActive).toBe(true);
    });

    it('devrait désactiver les autres années lors de la création', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const first = await SchoolYearsService.create(user.id, {
        name: '2023-2024',
        startDate: '2023-09-01',
        endDate: '2024-07-05',
      });

      expect(first.isActive).toBe(true);

      const second = await SchoolYearsService.create(user.id, {
        name: '2024-2025',
        startDate: '2024-09-01',
        endDate: '2025-07-05',
      });

      // Vérifier que la première est désactivée
      const { prisma } = await import('../../config/database.js');
      const updated = await prisma.schoolYear.findUnique({
        where: { id: first.id },
      });

      expect(second.isActive).toBe(true);
      expect(updated?.isActive).toBe(false);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une année scolaire', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const created = await createTestSchoolYear(user.id, {
        name: 'Original',
        school: 'École A',
      });

      const updated = await SchoolYearsService.update(
        created.id,
        user.id,
        {
          name: 'Updated',
          school: 'École B',
        }
      );

      expect(updated.name).toBe('Updated');
      expect(updated.school).toBe('École B');
    });

    it('devrait échouer si l\'année n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await expect(
        SchoolYearsService.update('nonexistent-id', user.id, { name: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('devrait supprimer une année scolaire', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const deleted = await SchoolYearsService.delete(schoolYear.id, user.id);

      expect(deleted).toBe(true);

      await expect(
        SchoolYearsService.getById(schoolYear.id, user.id)
      ).rejects.toThrow();
    });

    it('devrait retourner false si l\'année n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const deleted = await SchoolYearsService.delete(
        'nonexistent-id',
        user.id
      );

      expect(deleted).toBe(false);
    });
  });

  describe('archive', () => {
    it('devrait archiver une année scolaire', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id, {
        isActive: true,
      });

      const archived = await SchoolYearsService.archive(
        schoolYear.id,
        user.id
      );

      expect(archived.isArchived).toBe(true);
      expect(archived.isActive).toBe(false);
    });
  });

  describe('activate', () => {
    it('devrait activer une année scolaire', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id, {
        isActive: false,
      });

      const activated = await SchoolYearsService.activate(
        schoolYear.id,
        user.id
      );

      expect(activated.isActive).toBe(true);
    });

    it('devrait désactiver les autres années', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const first = await createTestSchoolYear(user.id, { isActive: true });
      const second = await createTestSchoolYear(user.id, { isActive: false });

      await SchoolYearsService.activate(second.id, user.id);

      const { prisma } = await import('../../config/database.js');
      const updated = await prisma.schoolYear.findUnique({
        where: { id: first.id },
      });

      expect(updated?.isActive).toBe(false);
    });
  });
});
