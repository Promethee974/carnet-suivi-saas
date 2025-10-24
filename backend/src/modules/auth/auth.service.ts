import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { User } from '@prisma/client';

const SALT_ROUNDS = 10;

export interface RegisterDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
  expiresIn: string;
}

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(data: RegisterDTO): Promise<AuthResponse> {
    // Vérifier si l'email existe déjà
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'TEACHER',
        subscriptionTier: 'FREE',
      },
    });

    // Créer le token JWT
    const token = this.generateToken(user);

    // Retourner l'utilisateur sans le hash du mot de passe
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  /**
   * Connexion d'un utilisateur
   */
  static async login(data: LoginDTO): Promise<AuthResponse> {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Générer le token
    const token = this.generateToken(user);

    // Retourner l'utilisateur sans le hash du mot de passe
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  /**
   * Obtenir le profil utilisateur
   */
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        classLevel: true,
        subscriptionTier: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  /**
   * Générer un token JWT
   */
  private static generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: (env.JWT_EXPIRES_IN || '7d') as `${number}${'d' | 'h' | 'm' | 's'}` }
    );
  }

  /**
   * Vérifier un token JWT
   */
  static verifyToken(token: string) {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      throw new AppError(401, 'Invalid or expired token');
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  static async updateProfile(userId: string, data: { firstName?: string; lastName?: string; email?: string; classLevel?: string }) {
    // Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new AppError(409, 'Email already in use');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        classLevel: data.classLevel as any
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        classLevel: true,
        subscriptionTier: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });

    return user;
  }

  /**
   * Changer le mot de passe
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Récupérer l'utilisateur avec le hash
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Current password is incorrect');
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Mettre à jour
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });
  }
}
