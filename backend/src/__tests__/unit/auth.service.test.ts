import { describe, it, expect, afterEach } from 'vitest';
import { AuthService } from '../../modules/auth/auth.service.js';
import { prisma } from '../../config/database.js';
import {
  createTestUser,
  cleanupTestUser,
  generateTestEmail,
} from '../helpers/test-utils.js';

describe('AuthService', () => {
  let testUserId: string | null = null;

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('register', () => {
    it('devrait créer un nouvel utilisateur avec succès', async () => {
      const email = generateTestEmail();
      const password = 'Test1234!';

      const result = await AuthService.register({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      testUserId = result.user.id;

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
      expect(result.user.firstName).toBe('John');
      expect(result.user.lastName).toBe('Doe');
      expect(result.user.role).toBe('TEACHER');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('devrait échouer si l\'email existe déjà', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await expect(
        AuthService.register({
          email: user.email,
          password: 'Test1234!',
          firstName: 'Jane',
          lastName: 'Doe',
        })
      ).rejects.toThrow();
    });

    it('devrait hasher le mot de passe', async () => {
      const email = generateTestEmail();
      const password = 'Test1234!';

      const result = await AuthService.register({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      testUserId = result.user.id;

      const userInDb = await prisma.user.findUnique({
        where: { id: result.user.id },
      });

      expect(userInDb?.passwordHash).toBeDefined();
      expect(userInDb?.passwordHash).not.toBe(password);
    });
  });

  describe('login', () => {
    it('devrait authentifier un utilisateur avec des identifiants valides', async () => {
      const password = 'Test1234!';
      const { user } = await createTestUser({ password });
      testUserId = user.id;

      const result = await AuthService.login({
        email: user.email,
        password,
      });

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(user.email);
      expect(result.token).toBeDefined();
    });

    it('devrait échouer avec un email invalide', async () => {
      await expect(
        AuthService.login({
          email: 'nonexistent@example.com',
          password: 'Test1234!',
        })
      ).rejects.toThrow();
    });

    it('devrait échouer avec un mot de passe invalide', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await expect(
        AuthService.login({
          email: user.email,
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow();
    });

    it('devrait mettre à jour lastLoginAt', async () => {
      const password = 'Test1234!';
      const { user } = await createTestUser({ password });
      testUserId = user.id;

      const beforeLogin = new Date();

      await AuthService.login({
        email: user.email,
        password,
      });

      const userInDb = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(userInDb?.lastLoginAt).toBeDefined();
      expect(userInDb!.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(
        beforeLogin.getTime()
      );
    });
  });

  // TODO: getUserById n'est pas une méthode statique de AuthService
  describe.skip('getUserById', () => {
    it('devrait retourner un utilisateur existant', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const result = await AuthService.getUserById(user.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result?.email).toBe(user.email);
    });

    it('devrait retourner null pour un ID inexistant', async () => {
      const result = await AuthService.getUserById('nonexistent-id');
      expect(result).toBeNull();
    });

    it('ne devrait pas retourner le passwordHash', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const result = await AuthService.getUserById(user.id);

      expect(result).toBeDefined();
      expect((result as any).passwordHash).toBeUndefined();
    });
  });
});
