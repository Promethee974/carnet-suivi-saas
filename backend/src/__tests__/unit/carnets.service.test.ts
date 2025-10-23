import { describe, it, expect, afterEach } from 'vitest';
import { CarnetsService } from '../../modules/carnets/carnets.service.js';
import {
  createTestUser,
  createTestStudent,
  createTestSchoolYear,
  cleanupTestUser,
} from '../helpers/test-utils.js';

describe('CarnetsService', () => {
  let carnetsService: CarnetsService;
  let testUserId: string | null = null;

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('getCarnetByStudent', () => {
    it('devrait créer un carnet automatiquement s\'il n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      carnetsService = new CarnetsService();

      const schoolYear = await createTestSchoolYear(user.id);
      const student = await createTestStudent(user.id, {
        schoolYearId: schoolYear.id,
      });

      const carnet = await carnetsService.getCarnetByStudent(
        student.id,
        user.id
      );

      expect(carnet).toBeDefined();
      expect(carnet.studentId).toBe(student.id);
      expect(carnet.userId).toBe(user.id);
      expect(carnet.meta).toBeDefined();
      expect(carnet.skills).toBeDefined();
      expect(carnet.synthese).toBeDefined();
    });

    it('devrait retourner le carnet existant', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      carnetsService = new CarnetsService();

      const student = await createTestStudent(user.id);

      // Récupérer/créer le carnet une première fois
      const carnet1 = await carnetsService.getCarnetByStudent(
        student.id,
        user.id
      );

      // Récupérer le carnet une deuxième fois
      const carnet2 = await carnetsService.getCarnetByStudent(
        student.id,
        user.id
      );

      expect(carnet1.id).toBe(carnet2.id);
    });

    it('devrait échouer si l\'élève n\'appartient pas à l\'utilisateur', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser();
      testUserId = user1.id;
      carnetsService = new CarnetsService();

      const student = await createTestStudent(user1.id);

      await expect(
        carnetsService.getCarnetByStudent(student.id, user2.id)
      ).rejects.toThrow('Élève non trouvé');

      // Cleanup user2
      await cleanupTestUser(user2.id);
    });

    it('devrait inclure les informations de l\'élève', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      carnetsService = new CarnetsService();

      const student = await createTestStudent(user.id, {
        nom: 'Dupont',
        prenom: 'Marie',
      });

      const carnet = await carnetsService.getCarnetByStudent(
        student.id,
        user.id
      );

      expect(carnet.student).toBeDefined();
      expect(carnet.student.nom).toBe('Dupont');
      expect(carnet.student.prenom).toBe('Marie');
    });
  });

  describe('updateCarnet', () => {
    it('devrait mettre à jour les métadonnées', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      carnetsService = new CarnetsService();

      const student = await createTestStudent(user.id);
      const carnet = await carnetsService.getCarnetByStudent(
        student.id,
        user.id
      );

      const updated = await carnetsService.updateCarnet(
        carnet.id,
        user.id,
        {
          meta: {
            periode: 'Période 1',
            enseignant: {
              nom: 'Martin',
              prenom: 'Paul',
            },
          },
        }
      );

      expect(updated.meta).toMatchObject({
        periode: 'Période 1',
        enseignant: {
          nom: 'Martin',
          prenom: 'Paul',
        },
      });
    });

    it('devrait mettre à jour les compétences', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      carnetsService = new CarnetsService();

      const student = await createTestStudent(user.id);
      const carnet = await carnetsService.getCarnetByStudent(
        student.id,
        user.id
      );

      const updated = await carnetsService.updateCarnet(
        carnet.id,
        user.id,
        {
          skills: {
            'skill-1': {
              status: 'acquired',
              comment: 'Très bien',
              period: 1,
            },
            'skill-2': {
              status: 'in_progress',
              comment: 'En cours d\'acquisition',
              period: 1,
            },
          },
        }
      );

      expect(updated.skills).toMatchObject({
        'skill-1': {
          status: 'acquired',
          comment: 'Très bien',
          period: 1,
        },
        'skill-2': {
          status: 'in_progress',
          comment: 'En cours d\'acquisition',
          period: 1,
        },
      });
    });

    it('devrait mettre à jour la synthèse', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      carnetsService = new CarnetsService();

      const student = await createTestStudent(user.id);
      const carnet = await carnetsService.getCarnetByStudent(
        student.id,
        user.id
      );

      const updated = await carnetsService.updateCarnet(
        carnet.id,
        user.id,
        {
          synthese: {
            forces: 'Bon en mathématiques',
            axes: 'Améliorer la lecture',
            projets: 'Continuer sur cette lancée',
          },
        }
      );

      expect(updated.synthese).toMatchObject({
        forces: 'Bon en mathématiques',
        axes: 'Améliorer la lecture',
        projets: 'Continuer sur cette lancée',
      });
    });

    it('devrait fusionner les données existantes', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      carnetsService = new CarnetsService();

      const student = await createTestStudent(user.id);
      const carnet = await carnetsService.getCarnetByStudent(
        student.id,
        user.id
      );

      // Première mise à jour
      await carnetsService.updateCarnet(carnet.id, user.id, {
        skills: {
          'skill-1': { status: 'acquired' },
        },
      });

      // Deuxième mise à jour
      const updated = await carnetsService.updateCarnet(
        carnet.id,
        user.id,
        {
          skills: {
            'skill-2': { status: 'in_progress' },
          },
        }
      );

      // Les deux compétences doivent être présentes
      expect(updated.skills).toHaveProperty('skill-1');
      expect(updated.skills).toHaveProperty('skill-2');
    });

    it('devrait échouer si le carnet n\'appartient pas à l\'utilisateur', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser();
      testUserId = user1.id;
      carnetsService = new CarnetsService();

      const student = await createTestStudent(user1.id);
      const carnet = await carnetsService.getCarnetByStudent(
        student.id,
        user1.id
      );

      await expect(
        carnetsService.updateCarnet(carnet.id, user2.id, {
          meta: { periode: 'Test' },
        })
      ).rejects.toThrow();

      // Cleanup user2
      await cleanupTestUser(user2.id);
    });
  });

  describe('deleteCarnet', () => {
    it('devrait supprimer un carnet', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      carnetsService = new CarnetsService();

      const student = await createTestStudent(user.id);
      const carnet = await carnetsService.getCarnetByStudent(
        student.id,
        user.id
      );

      const deleted = await carnetsService.deleteCarnet(carnet.id, user.id);

      expect(deleted).toBe(true);
    });

    it('devrait retourner false si le carnet n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      carnetsService = new CarnetsService();

      const deleted = await carnetsService.deleteCarnet(
        'nonexistent-id',
        user.id
      );

      expect(deleted).toBe(false);
    });
  });
});
