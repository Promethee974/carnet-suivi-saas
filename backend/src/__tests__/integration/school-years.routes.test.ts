import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  createTestUser,
  createTestSchoolYear,
  cleanupTestUser,
} from '../helpers/test-utils.js';

describe('School Years Routes', () => {
  let testUserId: string | null = null;
  let token: string;

  beforeAll(async () => {
    const { user, token: userToken } = await createTestUser();
    testUserId = user.id;
    token = userToken;
  });

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('GET /api/school-years', () => {
    it('devrait retourner toutes les années scolaires', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      await createTestSchoolYear(user.id, { name: '2023-2024' });
      await createTestSchoolYear(user.id, { name: '2024-2025' });

      const response = await request(app)
        .get('/api/school-years')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(2);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app).get('/api/school-years').expect(401);
    });

    it('devrait retourner un tableau vide si aucune année', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const response = await request(app)
        .get('/api/school-years')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/school-years/active', () => {
    it('devrait retourner l\'année scolaire active', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      await createTestSchoolYear(user.id, {
        name: 'Non active',
        isActive: false,
      });
      const active = await createTestSchoolYear(user.id, {
        name: 'Active',
        isActive: true,
      });

      const response = await request(app)
        .get('/api/school-years/active')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(active.id);
      expect(response.body.data.name).toBe('Active');
    });

    it('devrait retourner null si aucune année active', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      await createTestSchoolYear(user.id, { isActive: false });

      const response = await request(app)
        .get('/api/school-years/active')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeNull();
    });

    it('devrait échouer sans authentification', async () => {
      await request(app).get('/api/school-years/active').expect(401);
    });
  });

  describe('GET /api/school-years/:id', () => {
    it('devrait retourner une année scolaire par ID', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id, {
        name: '2024-2025',
      });

      const response = await request(app)
        .get(`/api/school-years/${schoolYear.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(schoolYear.id);
      expect(response.body.data.name).toBe('2024-2025');
    });

    it('devrait échouer si l\'année n\'existe pas', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      await request(app)
        .get('/api/school-years/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app).get('/api/school-years/some-id').expect(401);
    });
  });

  describe('POST /api/school-years', () => {
    it('devrait créer une nouvelle année scolaire', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const data = {
        name: '2024-2025',
        school: 'École Test',
        classLevel: 'GS',
        startDate: '2024-09-01',
        endDate: '2025-07-05',
      };

      const response = await request(app)
        .post('/api/school-years')
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe('2024-2025');
      expect(response.body.data.school).toBe('École Test');
      expect(response.body.data.isActive).toBe(true);
    });

    it('devrait échouer sans nom', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const data = {
        startDate: '2024-09-01',
        endDate: '2025-07-05',
      };

      const response = await request(app)
        .post('/api/school-years')
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('requis');
    });

    it('devrait échouer sans date de début', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const data = {
        name: '2024-2025',
        endDate: '2025-07-05',
      };

      const response = await request(app)
        .post('/api/school-years')
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('devrait échouer sans date de fin', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const data = {
        name: '2024-2025',
        startDate: '2024-09-01',
      };

      const response = await request(app)
        .post('/api/school-years')
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('devrait échouer sans authentification', async () => {
      const data = {
        name: '2024-2025',
        startDate: '2024-09-01',
        endDate: '2025-07-05',
      };

      await request(app).post('/api/school-years').send(data).expect(401);
    });
  });

  describe('PATCH /api/school-years/:id', () => {
    it('devrait mettre à jour une année scolaire', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id, {
        name: 'Original',
        school: 'École A',
      });

      const response = await request(app)
        .patch(`/api/school-years/${schoolYear.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated',
          school: 'École B',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe('Updated');
      expect(response.body.data.school).toBe('École B');
    });

    it('devrait échouer si l\'année n\'existe pas', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      await request(app)
        .patch('/api/school-years/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' })
        .expect(500);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app)
        .patch('/api/school-years/some-id')
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('POST /api/school-years/:id/archive', () => {
    it('devrait archiver une année scolaire', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id, {
        isActive: true,
      });

      const response = await request(app)
        .post(`/api/school-years/${schoolYear.id}/archive`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.isArchived).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app)
        .post('/api/school-years/some-id/archive')
        .expect(401);
    });
  });

  describe('DELETE /api/school-years/:id', () => {
    it('devrait supprimer une année scolaire', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const schoolYear = await createTestSchoolYear(user.id);

      const response = await request(app)
        .delete(`/api/school-years/${schoolYear.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBe(true);
    });

    it('devrait retourner false si l\'année n\'existe pas', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const response = await request(app)
        .delete('/api/school-years/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBe(false);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app).delete('/api/school-years/some-id').expect(401);
    });
  });
});
