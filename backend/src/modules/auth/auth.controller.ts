import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { asyncHandler } from '../../middleware/error.middleware.js';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export class AuthController {
  /**
   * POST /api/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);

    const result = await AuthService.register(data);

    res.status(201).json({
      status: 'success',
      data: result,
    });
  });

  /**
   * POST /api/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);

    const result = await AuthService.login(data);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  /**
   * GET /api/auth/me
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!; // Set by authMiddleware

    const user = await AuthService.getProfile(userId);

    res.status(200).json({
      status: 'success',
      data: user,
    });
  });

  /**
   * POST /api/auth/logout
   */
  static logout = asyncHandler(async (_req: Request, res: Response) => {
    // Dans un système basé sur JWT, le logout est géré côté client
    // (suppression du token du localStorage)
    // On peut ajouter ici une logique de blacklist de tokens si nécessaire

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  });

  /**
   * PUT /api/auth/profile
   * Mettre à jour le profil utilisateur
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const data = updateProfileSchema.parse(req.body);

    const user = await AuthService.updateProfile(userId, data);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user,
    });
  });

  /**
   * POST /api/auth/change-password
   * Changer le mot de passe
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const data = changePasswordSchema.parse(req.body);

    await AuthService.changePassword(userId, data.currentPassword, data.newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  });
}
