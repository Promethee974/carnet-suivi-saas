import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rateLimiting.middleware.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', authLimiter, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', authLimiter, AuthController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', authMiddleware, AuthController.getProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion (côté serveur optionnel pour JWT)
 * @access  Private
 */
router.post('/logout', authMiddleware, AuthController.logout);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mettre à jour le profil utilisateur
 * @access  Private
 */
router.put('/profile', authMiddleware, AuthController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Changer le mot de passe
 * @access  Private
 */
router.post('/change-password', authMiddleware, AuthController.changePassword);

export default router;
