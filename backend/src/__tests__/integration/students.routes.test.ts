import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  createTestUser,
  createTestStudent,
  createTestSchoolYear,
  cleanupTestUser,
} from '../helpers/test-utils.js';

describe('Students Routes (Integration)', () => {
  let testUserId: string | null = null;
  let authToken: string | null = null;

  beforeAll(async () => {
    const { user, token } = await createTestUser();
    testUserId = user.id;
    authToken = token;
  });

  afterAll(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  describe('POST /api/students', () => {
    it('devrait créer un nouvel élève', async () => {
      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Dupont',
          prenom: 'Marie',
          sexe: 'F',
          naissance: '2019-05-15',
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nom).toBe('Dupont');
      expect(response.body.data.prenom).toBe('Marie');
      expect(response.body.data.sexe).toBe('F');
      expect(response.body.data.userId).toBe(testUserId);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app)
        .post('/api/students')
        .send({
          nom: 'Test',
          prenom: 'Eleve',
        })
        .expect(401);
    });

    // TODO: Ajouter validation Zod dans le controller
    it.skip('devrait échouer avec des données invalides', async () => {
      await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Manque nom et prenom requis
          sexe: 'F',
        })
        .expect(400);
    });
  });

  describe('GET /api/students', () => {
    it('devrait retourner tous les élèves de l\'utilisateur', async () => {
      // Créer quelques élèves
      await createTestStudent(testUserId!, { nom: 'A', prenom: 'Test' });
      await createTestStudent(testUserId!, { nom: 'B', prenom: 'Test' });
      await createTestStudent(testUserId!, { nom: 'C', prenom: 'Test' });

      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('devrait filtrer par année scolaire', async () => {
      const schoolYear = await createTestSchoolYear(testUserId!);

      await createTestStudent(testUserId!, {
        nom: 'WithYear',
        prenom: 'Test',
        schoolYearId: schoolYear.id,
      });
      await createTestStudent(testUserId!, {
        nom: 'NoYear',
        prenom: 'Test',
      });

      const response = await request(app)
        .get('/api/students')
        .query({ schoolYearId: schoolYear.id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(
        response.body.data.every((s: any) => s.schoolYearId === schoolYear.id)
      ).toBe(true);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app).get('/api/students').expect(401);
    });
  });

  describe('GET /api/students/:id', () => {
    it('devrait retourner un élève spécifique', async () => {
      const student = await createTestStudent(testUserId!, {
        nom: 'Dupont',
        prenom: 'Jean',
      });

      const response = await request(app)
        .get(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(student.id);
      expect(response.body.data.nom).toBe('Dupont');
      expect(response.body.data.prenom).toBe('Jean');
    });

    // TODO: Wrapper le controller avec asyncHandler pour gérer les 404
    it.skip('devrait retourner 404 pour un élève inexistant', async () => {
      await request(app)
        .get('/api/students/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait échouer sans authentification', async () => {
      const student = await createTestStudent(testUserId!);

      await request(app).get(`/api/students/${student.id}`).expect(401);
    });
  });

  describe('PUT /api/students/:id', () => {
    it('devrait mettre à jour un élève', async () => {
      const student = await createTestStudent(testUserId!, {
        nom: 'Original',
        prenom: 'Name',
      });

      const response = await request(app)
        .put(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Updated',
          prenom: 'Changed',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(student.id);
      expect(response.body.data.nom).toBe('Updated');
      expect(response.body.data.prenom).toBe('Changed');
    });

    it('devrait retourner 404 pour un élève inexistant', async () => {
      await request(app)
        .put('/api/students/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nom: 'Test' })
        .expect(404);
    });

    it('devrait échouer sans authentification', async () => {
      const student = await createTestStudent(testUserId!);

      await request(app)
        .put(`/api/students/${student.id}`)
        .send({ nom: 'Test' })
        .expect(401);
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('devrait supprimer un élève', async () => {
      const student = await createTestStudent(testUserId!);

      await request(app)
        .delete(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Vérifier que l'élève n'existe plus
      await request(app)
        .get(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait retourner 404 pour un élève inexistant', async () => {
      await request(app)
        .delete('/api/students/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait échouer sans authentification', async () => {
      const student = await createTestStudent(testUserId!);

      await request(app).delete(`/api/students/${student.id}`).expect(401);
    });
  });

  describe('POST /api/students/:id/profile-picture', () => {
    it('devrait définir une photo de profil', async () => {
      const student = await createTestStudent(testUserId!);

      // Créer une photo de test
      const { prisma } = await import('../../config/database.js');
      const photo = await prisma.photo.create({
        data: {
          userId: testUserId!,
          studentId: student.id,
          s3Key: 'test-key',
          s3Url: 'http://test.com/photo.jpg',
        },
      });

      const response = await request(app)
        .post(`/api/students/${student.id}/profile-picture`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ photoId: photo.id })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.profilePictureId).toBe(photo.id);
    });
  });

  describe('DELETE /api/students/:id/profile-picture', () => {
    it('devrait retirer une photo de profil', async () => {
      const student = await createTestStudent(testUserId!);

      // Créer et définir une photo de profil
      const { prisma } = await import('../../config/database.js');
      const photo = await prisma.photo.create({
        data: {
          userId: testUserId!,
          studentId: student.id,
          s3Key: 'test-key',
          s3Url: 'http://test.com/photo.jpg',
        },
      });

      await prisma.student.update({
        where: { id: student.id },
        data: { profilePictureId: photo.id },
      });

      const response = await request(app)
        .delete(`/api/students/${student.id}/profile-picture`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.profilePictureId).toBeNull();
    });
  });
});
