import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './error.middleware.js';
import { prisma } from '../config/database.js';

export interface JWTPayload {
  id: string;
  userId: string;
  email: string;
  role: string;
}

// Étendre le type Request d'Express
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
    }
  }
}

/**
 * Middleware d'authentification - vérifie le JWT
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      throw new AppError(401, 'User not found');
    }

    // Ajouter les infos utilisateur à la requête
    req.user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    req.userId = user.id;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError(401, 'Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'Token expired'));
    }
    next(error);
  }
}

/**
 * Middleware optionnel - n'échoue pas si pas de token
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

      req.user = decoded;
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    // Ignorer les erreurs et continuer
    next();
  }
}

/**
 * Middleware de vérification des rôles
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
}

// Export alias for compatibility
export { authMiddleware as authenticate };
