import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import {
  errorMiddleware,
  AppError,
  asyncHandler,
} from '../../middleware/error.middleware.js';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = {};
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = vi.fn();
  });

  describe('AppError', () => {
    it('devrait gérer les erreurs AppError personnalisées', () => {
      const error = new AppError(404, 'Resource not found');

      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Resource not found',
      });
    });

    it('devrait gérer différents codes de statut', () => {
      const error = new AppError(403, 'Forbidden');

      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Forbidden',
      });
    });
  });

  describe('ZodError', () => {
    it('devrait gérer les erreurs de validation Zod', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
        {
          code: 'too_small',
          minimum: 8,
          type: 'string',
          inclusive: true,
          exact: false,
          path: ['password'],
          message: 'String must contain at least 8 character(s)',
        },
      ]);

      errorMiddleware(
        zodError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation error',
        errors: [
          {
            field: 'email',
            message: 'Expected string, received number',
          },
          {
            field: 'password',
            message: 'String must contain at least 8 character(s)',
          },
        ],
      });
    });

    it('devrait gérer les erreurs Zod avec chemins imbriqués', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['user', 'profile', 'firstName'],
          message: 'Required',
        },
      ]);

      errorMiddleware(
        zodError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation error',
        errors: [
          {
            field: 'user.profile.firstName',
            message: 'Required',
          },
        ],
      });
    });
  });

  describe('Prisma Errors', () => {
    it('devrait gérer les erreurs de contrainte unique (P2002)', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {
            target: ['email'],
          },
        }
      );

      errorMiddleware(
        prismaError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Resource already exists',
        field: 'email',
      });
    });

    it('devrait gérer les erreurs de record non trouvé (P2025)', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );

      errorMiddleware(
        prismaError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Resource not found',
      });
    });

    it('devrait gérer les contraintes uniques multiples', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {
            target: ['email', 'username'],
          },
        }
      );

      errorMiddleware(
        prismaError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Resource already exists',
        field: 'email, username',
      });
    });
  });

  describe('JWT Errors', () => {
    it('devrait gérer les erreurs de token invalide', () => {
      const jwtError = new Error('invalid signature');
      jwtError.name = 'JsonWebTokenError';

      errorMiddleware(
        jwtError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid token',
      });
    });

    it('devrait gérer les erreurs de token expiré', () => {
      const jwtError = new Error('jwt expired');
      jwtError.name = 'TokenExpiredError';

      errorMiddleware(
        jwtError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token expired',
      });
    });
  });

  describe('Generic Errors', () => {
    it('devrait gérer les erreurs génériques avec status 500', () => {
      const error = new Error('Something went wrong');

      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];
      expect(response.status).toBe('error');
    });

    it('devrait inclure le message en développement', () => {
      // Mock isDevelopment
      vi.stubEnv('NODE_ENV', 'development');

      const error = new Error('Detailed error message');

      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      const response = jsonMock.mock.calls[0][0];
      expect(response.message).toBe('Detailed error message');
    });
  });

  describe('asyncHandler', () => {
    it('devrait wrapper les fonctions async et capturer les erreurs', async () => {
      const asyncFn = vi.fn().mockRejectedValue(new Error('Async error'));

      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Async error');
    });

    it('devrait passer les paramètres à la fonction wrappée', async () => {
      const asyncFn = vi.fn().mockResolvedValue(undefined);

      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(asyncFn).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        mockNext
      );
    });

    it('ne devrait pas appeler next si la fonction réussit', async () => {
      const asyncFn = vi.fn().mockResolvedValue({ success: true });

      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devrait gérer les AppError dans les fonctions async', async () => {
      const asyncFn = vi
        .fn()
        .mockRejectedValue(new AppError(404, 'Not found'));

      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
    });
  });
});
