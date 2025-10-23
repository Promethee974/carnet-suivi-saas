import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  createTestUser,
  createTestStudent,
  cleanupTestUser,
} from '../helpers/test-utils.js';

describe('Carnets Routes (Integration)', () => {
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

  describe('GET /api/carnets/students/:studentId/carnet', () => {
    it('devrait récupérer le carnet d\'un élève', async () => {
      const student = await createTestStudent(testUserId!);

      const response = await request(app)
        .get(`/api/carnets/students/${student.id}/carnet`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('studentId', student.id);
      expect(response.body.data).toHaveProperty('meta');
      expect(response.body.data).toHaveProperty('skills');
      expect(response.body.data).toHaveProperty('synthese');
    });

    it('devrait créer automatiquement un carnet s\'il n\'existe pas', async () => {
      const student = await createTestStudent(testUserId!);

      const response = await request(app)
        .get(`/api/carnets/students/${student.id}/carnet`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.studentId).toBe(student.id);
    });

    it('devrait échouer sans authentification', async () => {
      const student = await createTestStudent(testUserId!);

      await request(app)
        .get(`/api/carnets/students/${student.id}/carnet`)
        .expect(401);
    });

    it('devrait échouer si l\'élève n\'appartient pas à l\'utilisateur', async () => {
      const { user: user2, token: token2 } = await createTestUser();
      const student = await createTestStudent(testUserId!);

      await request(app)
        .get(`/api/carnets/students/${student.id}/carnet`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404);

      await cleanupTestUser(user2.id);
    });
  });

  describe('PUT /api/carnets/students/:studentId/carnet', () => {
    it('devrait mettre à jour les métadonnées d\'un carnet', async () => {
      const student = await createTestStudent(testUserId!);

      // Mettre à jour
      const response = await request(app)
        .put(`/api/carnets/students/${student.id}/carnet`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          meta: {
            periode: 'Période 1',
            enseignant: {
              nom: 'Dupont',
              prenom: 'Jean',
            },
          },
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.meta).toMatchObject({
        periode: 'Période 1',
        enseignant: {
          nom: 'Dupont',
          prenom: 'Jean',
        },
      });
    });

    it('devrait mettre à jour les compétences', async () => {
      const student = await createTestStudent(testUserId!);

      const response = await request(app)
        .put(`/api/carnets/students/${student.id}/carnet`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skills: {
            'skill-1': {
              status: 'acquired',
              comment: 'Très bien',
              period: 1,
            },
          },
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.skills).toHaveProperty('skill-1');
      expect(response.body.data.skills['skill-1'].status).toBe('acquired');
    });

    it('devrait mettre à jour la synthèse', async () => {
      const student = await createTestStudent(testUserId!);

      const response = await request(app)
        .put(`/api/carnets/students/${student.id}/carnet`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          synthese: {
            forces: 'Bon élève',
            axes: 'Améliorer la lecture',
            projets: 'Continuer',
          },
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.synthese).toMatchObject({
        forces: 'Bon élève',
        axes: 'Améliorer la lecture',
        projets: 'Continuer',
      });
    });

    it('devrait échouer sans authentification', async () => {
      const student = await createTestStudent(testUserId!);

      await request(app)
        .put(`/api/carnets/students/${student.id}/carnet`)
        .send({ meta: { periode: 'Test' } })
        .expect(401);
    });

    it('devrait échouer si le carnet n\'appartient pas à l\'utilisateur', async () => {
      const { user: user2, token: token2 } = await createTestUser();
      const student = await createTestStudent(testUserId!);

      await request(app)
        .put(`/api/carnets/students/${student.id}/carnet`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ meta: { periode: 'Test' } })
        .expect(404);

      await cleanupTestUser(user2.id);
    });
  });

  describe('DELETE /api/carnets/students/:studentId/carnet', () => {
    it('devrait supprimer un carnet', async () => {
      const student = await createTestStudent(testUserId!);

      await request(app)
        .delete(`/api/carnets/students/${student.id}/carnet`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('devrait échouer sans authentification', async () => {
      const student = await createTestStudent(testUserId!);

      await request(app)
        .delete(`/api/carnets/students/${student.id}/carnet`)
        .expect(401);
    });

    it('devrait retourner 404 si l\'élève n\'existe pas', async () => {
      await request(app)
        .delete('/api/carnets/students/nonexistent-id/carnet')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
