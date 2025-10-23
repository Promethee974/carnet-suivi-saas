import { describe, it, expect, afterEach } from 'vitest';
import { SubjectsService } from '../../modules/subjects/subjects.service.js';
import { prisma } from '../../config/database.js';
import {
  createTestUser,
  createTestSchoolYear,
  cleanupTestUser,
} from '../helpers/test-utils.js';

describe('SubjectsService', () => {
  let testUserId: string | null = null;

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('getAll', () => {
    it('devrait retourner toutes les matières d\'une année scolaire', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      // Créer quelques matières
      await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'Français',
          color: 'bg-blue-500',
        },
      });

      await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'Mathématiques',
          color: 'bg-red-500',
        },
      });

      const subjects = await SubjectsService.getAll(user.id, schoolYear.id);

      expect(subjects).toHaveLength(2);
      expect(subjects[0].name).toBe('Français');
      expect(subjects[1].name).toBe('Mathématiques');
    });

    it('devrait retourner un tableau vide si aucune matière', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const subjects = await SubjectsService.getAll(user.id, schoolYear.id);

      expect(subjects).toHaveLength(0);
    });

    it('devrait inclure les domaines, sous-domaines et compétences', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      // Créer une matière
      const subject = await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'Français',
        },
      });

      // Créer un domaine
      const domain = await prisma.domain.create({
        data: {
          subjectId: subject.id,
          name: 'Langage oral',
        },
      });

      // Créer une compétence
      await prisma.skill.create({
        data: {
          domainId: domain.id,
          text: 'S\'exprimer clairement',
        },
      });

      const subjects = await SubjectsService.getAll(user.id, schoolYear.id);

      expect(subjects[0].domains).toHaveLength(1);
      expect(subjects[0].domains[0].skills).toHaveLength(1);
    });

    it('devrait trier par ordre', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'C',
          order: 2,
        },
      });

      await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'A',
          order: 0,
        },
      });

      await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'B',
          order: 1,
        },
      });

      const subjects = await SubjectsService.getAll(user.id, schoolYear.id);

      expect(subjects[0].name).toBe('A');
      expect(subjects[1].name).toBe('B');
      expect(subjects[2].name).toBe('C');
    });
  });

  describe('getById', () => {
    it('devrait retourner une matière par son ID', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const created = await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'Français',
        },
      });

      const subject = await SubjectsService.getById(created.id, user.id);

      expect(subject).toBeDefined();
      expect(subject.id).toBe(created.id);
      expect(subject.name).toBe('Français');
    });

    it('devrait échouer si la matière n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await expect(
        SubjectsService.getById('nonexistent-id', user.id)
      ).rejects.toThrow('Matière introuvable');
    });

    it('ne devrait pas retourner une matière d\'un autre utilisateur', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser();
      testUserId = user1.id;

      const schoolYear = await createTestSchoolYear(user1.id);

      const subject = await prisma.subject.create({
        data: {
          userId: user1.id,
          schoolYearId: schoolYear.id,
          name: 'Test',
        },
      });

      await expect(
        SubjectsService.getById(subject.id, user2.id)
      ).rejects.toThrow();

      await cleanupTestUser(user2.id);
    });
  });

  describe('createSubject', () => {
    it('devrait créer une nouvelle matière', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const subject = await SubjectsService.createSubject(
        user.id,
        schoolYear.id,
        {
          name: 'Sciences',
          color: 'bg-green-500',
          isTransversal: false,
        }
      );

      expect(subject).toBeDefined();
      expect(subject.name).toBe('Sciences');
      expect(subject.color).toBe('bg-green-500');
      expect(subject.isTransversal).toBe(false);
    });

    it('devrait définir l\'ordre automatiquement', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const subject1 = await SubjectsService.createSubject(
        user.id,
        schoolYear.id,
        { name: 'First' }
      );

      const subject2 = await SubjectsService.createSubject(
        user.id,
        schoolYear.id,
        { name: 'Second' }
      );

      expect(subject1.order).toBe(0);
      expect(subject2.order).toBe(1);
    });
  });

  describe('updateSubject', () => {
    it('devrait mettre à jour une matière', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const created = await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'Original',
        },
      });

      const updated = await SubjectsService.updateSubject(
        created.id,
        user.id,
        {
          name: 'Updated',
          color: 'bg-purple-500',
        }
      );

      expect(updated.name).toBe('Updated');
      expect(updated.color).toBe('bg-purple-500');
    });

    it('devrait échouer si la matière n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await expect(
        SubjectsService.updateSubject('nonexistent-id', user.id, {
          name: 'Test',
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteSubject', () => {
    it('devrait supprimer une matière', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const subject = await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'To Delete',
        },
      });

      const deleted = await SubjectsService.deleteSubject(subject.id, user.id);

      expect(deleted).toBe(true);

      await expect(
        SubjectsService.getById(subject.id, user.id)
      ).rejects.toThrow();
    });

    it('devrait retourner false si la matière n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const deleted = await SubjectsService.deleteSubject(
        'nonexistent-id',
        user.id
      );

      expect(deleted).toBe(false);
    });
  });

  describe('createDomain', () => {
    it('devrait créer un nouveau domaine', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const subject = await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'Français',
        },
      });

      const domain = await SubjectsService.createDomain(
        subject.id,
        user.id,
        { name: 'Langage oral' }
      );

      expect(domain).toBeDefined();
      expect(domain.name).toBe('Langage oral');
      expect(domain.subjectId).toBe(subject.id);
    });
  });

  describe('createSkill', () => {
    it('devrait créer une compétence rattachée à un domaine', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const subject = await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'Français',
        },
      });

      const domain = await prisma.domain.create({
        data: {
          subjectId: subject.id,
          name: 'Langage oral',
        },
      });

      const skill = await SubjectsService.createSkill(user.id, {
        domainId: domain.id,
        text: 'S\'exprimer clairement',
      });

      expect(skill).toBeDefined();
      expect(skill.text).toBe('S\'exprimer clairement');
      expect(skill.domainId).toBe(domain.id);
    });
  });

  describe('updateSkill', () => {
    it('devrait mettre à jour une compétence', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const subject = await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'Français',
        },
      });

      const domain = await prisma.domain.create({
        data: {
          subjectId: subject.id,
          name: 'Langage',
        },
      });

      const skill = await prisma.skill.create({
        data: {
          domainId: domain.id,
          text: 'Original',
        },
      });

      const updated = await SubjectsService.updateSkill(skill.id, user.id, {
        text: 'Updated',
      });

      expect(updated.text).toBe('Updated');
    });
  });

  describe('deleteSkill', () => {
    it('devrait supprimer une compétence', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const subject = await prisma.subject.create({
        data: {
          userId: user.id,
          schoolYearId: schoolYear.id,
          name: 'Français',
        },
      });

      const domain = await prisma.domain.create({
        data: {
          subjectId: subject.id,
          name: 'Langage',
        },
      });

      const skill = await prisma.skill.create({
        data: {
          domainId: domain.id,
          text: 'To delete',
        },
      });

      const deleted = await SubjectsService.deleteSkill(skill.id, user.id);

      expect(deleted).toBe(true);
    });
  });
});
