import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StudentsService } from '../../modules/students/students.service.js';
import {
  createTestUser,
  createTestStudent,
  createTestSchoolYear,
  cleanupTestUser,
} from '../helpers/test-utils.js';

describe('StudentsService', () => {
  let studentsService: StudentsService;
  let testUserId: string | null = null;

  beforeEach(() => {
    studentsService = new StudentsService();
  });

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('create', () => {
    it('devrait créer un nouvel élève avec succès', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await studentsService.create(user.id, {
        nom: 'Dupont',
        prenom: 'Marie',
        sexe: 'F',
        naissance: new Date('2019-05-15'),
      });

      expect(student).toBeDefined();
      expect(student.nom).toBe('Dupont');
      expect(student.prenom).toBe('Marie');
      expect(student.sexe).toBe('F');
      expect(student.userId).toBe(user.id);
    });

    it('devrait créer un élève sans données optionnelles', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await studentsService.create(user.id, {
        nom: 'Martin',
        prenom: 'Lucas',
      });

      expect(student).toBeDefined();
      expect(student.nom).toBe('Martin');
      expect(student.prenom).toBe('Lucas');
      expect(student.sexe).toBeNull();
      expect(student.naissance).toBeNull();
    });

    it('devrait lier un élève à une année scolaire', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const student = await studentsService.create(user.id, {
        nom: 'Dupont',
        prenom: 'Marie',
        schoolYearId: schoolYear.id,
      });

      expect(student.schoolYearId).toBe(schoolYear.id);
    });
  });

  describe('getAll', () => {
    it('devrait retourner tous les élèves d\'un utilisateur', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await createTestStudent(user.id, { nom: 'A', prenom: 'Eleve' });
      await createTestStudent(user.id, { nom: 'B', prenom: 'Eleve' });
      await createTestStudent(user.id, { nom: 'C', prenom: 'Eleve' });

      const students = await studentsService.getAll(user.id);

      expect(students).toHaveLength(3);
      expect(students[0].nom).toBe('A');
      expect(students[1].nom).toBe('B');
      expect(students[2].nom).toBe('C');
    });

    it('devrait retourner un tableau vide si aucun élève', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const students = await studentsService.getAll(user.id);

      expect(students).toHaveLength(0);
    });

    it('devrait filtrer par année scolaire', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear1 = await createTestSchoolYear(user.id, {
        name: '2023-2024',
      });
      const schoolYear2 = await createTestSchoolYear(user.id, {
        name: '2024-2025',
      });

      await createTestStudent(user.id, {
        nom: 'A',
        schoolYearId: schoolYear1.id,
      });
      await createTestStudent(user.id, {
        nom: 'B',
        schoolYearId: schoolYear2.id,
      });
      await createTestStudent(user.id, {
        nom: 'C',
        schoolYearId: schoolYear2.id,
      });

      const students = await studentsService.getAll(user.id, schoolYear2.id);

      expect(students).toHaveLength(2);
      expect(students.every((s) => s.schoolYearId === schoolYear2.id)).toBe(
        true
      );
    });
  });

  describe('getById', () => {
    it('devrait retourner un élève par son ID', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const created = await createTestStudent(user.id, {
        nom: 'Dupont',
        prenom: 'Marie',
      });

      const student = await studentsService.getById(created.id, user.id);

      expect(student).toBeDefined();
      expect(student?.id).toBe(created.id);
      expect(student?.nom).toBe('Dupont');
      expect(student?.prenom).toBe('Marie');
    });

    it('devrait retourner null si l\'élève n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await studentsService.getById('nonexistent-id', user.id);

      expect(student).toBeNull();
    });

    it('ne devrait pas retourner un élève d\'un autre utilisateur', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser();
      testUserId = user1.id;

      const student = await createTestStudent(user1.id);

      const result = await studentsService.getById(student.id, user2.id);

      expect(result).toBeNull();

      // Cleanup user2
      await cleanupTestUser(user2.id);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un élève', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id, {
        nom: 'Dupont',
        prenom: 'Marie',
      });

      const updated = await studentsService.update(student.id, user.id, {
        nom: 'Martin',
        prenom: 'Sophie',
      });

      expect(updated).toBeDefined();
      expect(updated?.nom).toBe('Martin');
      expect(updated?.prenom).toBe('Sophie');
    });

    it('devrait retourner null si l\'élève n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const updated = await studentsService.update('nonexistent-id', user.id, {
        nom: 'Test',
      });

      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('devrait supprimer un élève', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      const deleted = await studentsService.delete(student.id, user.id);

      expect(deleted).toBe(true);

      const found = await studentsService.getById(student.id, user.id);
      expect(found).toBeNull();
    });

    it('devrait retourner false si l\'élève n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const deleted = await studentsService.delete('nonexistent-id', user.id);

      expect(deleted).toBe(false);
    });
  });

  describe('setProfilePicture', () => {
    it('devrait définir une photo de profil pour un élève', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      // Créer une photo de test
      const { prisma } = await import('../../config/database.js');
      const photo = await prisma.photo.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'test-key',
          s3Url: 'http://test.com/photo.jpg',
        },
      });

      const updated = await studentsService.setProfilePicture(
        student.id,
        user.id,
        photo.id
      );

      expect(updated).toBeDefined();
      expect(updated?.profilePictureId).toBe(photo.id);
    });
  });

  describe('removeProfilePicture', () => {
    it('devrait retirer la photo de profil d\'un élève', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      // Créer une photo et la définir comme photo de profil
      const { prisma } = await import('../../config/database.js');
      const photo = await prisma.photo.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'test-key',
          s3Url: 'http://test.com/photo.jpg',
        },
      });

      await studentsService.setProfilePicture(student.id, user.id, photo.id);

      const updated = await studentsService.removeProfilePicture(
        student.id,
        user.id
      );

      expect(updated).toBeDefined();
      expect(updated?.profilePictureId).toBeNull();
    });
  });
});
