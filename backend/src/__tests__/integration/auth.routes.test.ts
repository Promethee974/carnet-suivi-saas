import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateTestEmail, createTestUser, cleanupTestUser } from '../helpers/test-utils.js';

describe('Auth Routes (Integration)', () => {
  let testUserId: string | null = null;

  afterAll(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  describe('POST /api/auth/register', () => {
    it('devrait enregistrer un nouvel utilisateur', async () => {
      const email = generateTestEmail();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      testUserId = response.body.data.user.id;

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.user.firstName).toBe('John');
      expect(response.body.data.user.lastName).toBe('Doe');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('devrait échouer avec un email existant', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: user.email,
          password: 'Test1234!',
          firstName: 'Jane',
          lastName: 'Doe',
        })
        .expect(409); // 409 Conflict pour email existant

      expect(response.body).toHaveProperty('message');
    });

    it('devrait échouer avec des données invalides', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Trop court
        })
        .expect(400);
    });

    it('devrait échouer sans email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          password: 'Test1234!',
          firstName: 'John',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const password = 'Test1234!';
      const { user } = await createTestUser({ password });
      testUserId = user.id;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('devrait échouer avec un email invalide', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('devrait échouer avec un mot de passe invalide', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('devrait échouer sans données', async () => {
      await request(app).post('/api/auth/login').send({}).expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('devrait retourner le profil de l\'utilisateur authentifié', async () => {
      const { user, token } = await createTestUser();
      testUserId = user.id;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id', user.id);
      expect(response.body.data).toHaveProperty('email', user.email);
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('devrait échouer sans token', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });

    it('devrait échouer avec un token invalide', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
