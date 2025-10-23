import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { generateTestToken, createTestUser, cleanupTestUser } from '../helpers/test-utils.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    mockNext = vi.fn();
  });

  describe('authMiddleware', () => {
    it('devrait accepter un token valide', async () => {
      const { user, token } = await createTestUser();

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe(user.id);
      expect(mockRequest.user?.email).toBe(user.email);
      expect(mockNext).toHaveBeenCalledWith();

      await cleanupTestUser(user.id);
    });

    it('devrait rejeter une requête sans token', async () => {
      mockRequest.headers = {};

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'No token provided',
        })
      );
    });

    it('devrait rejeter un token invalide', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid token',
        })
      );
    });

    it('devrait rejeter un token expiré', async () => {
      const { user } = await createTestUser();

      // Créer un token expiré (utilisé il y a 1 seconde avec expiration immédiate)
      const expiredToken = jwt.sign(
        {
          id: user.id,
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '0s' } // Expire immédiatement
      );

      // Attendre 1 seconde pour que le token expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      // Le token expiré devrait être traité comme invalide
      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);

      await cleanupTestUser(user.id);
    });

    it('devrait rejeter si l\'utilisateur n\'existe plus', async () => {
      const { user, token } = await createTestUser();

      // Supprimer l'utilisateur
      await cleanupTestUser(user.id);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'User not found',
        })
      );
    });

    it('devrait rejeter un header Authorization mal formé', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });
  });

  describe('requireRole', () => {
    it('devrait autoriser un utilisateur avec le bon rôle', () => {
      const middleware = requireRole('TEACHER', 'ADMIN');

      mockRequest.user = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('devrait rejeter un utilisateur sans le bon rôle', () => {
      const middleware = requireRole('ADMIN', 'SUPER_ADMIN');

      mockRequest.user = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Insufficient permissions',
        })
      );
    });

    it('devrait rejeter si pas d\'utilisateur authentifié', () => {
      const middleware = requireRole('TEACHER');

      mockRequest.user = undefined;

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Authentication required',
        })
      );
    });

    it('devrait accepter plusieurs rôles', () => {
      const middleware = requireRole('TEACHER', 'ADMIN', 'SUPER_ADMIN');

      // Test avec TEACHER
      mockRequest.user = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();

      // Reset mock
      mockNext = vi.fn();

      // Test avec ADMIN
      mockRequest.user!.role = 'ADMIN';

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
