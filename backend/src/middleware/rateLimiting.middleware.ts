import rateLimit from 'express-rate-limit';
import { isDevelopment } from '../config/env.js';

/**
 * Rate limiter global pour toutes les requêtes API
 * Limite par IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Limite de requêtes par IP
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Rate limiter strict pour les endpoints d'authentification
 * Protection contre le brute force
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 5, // 5 tentatives en 15 minutes
  message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
  skipSuccessfulRequests: true, // Ne compte que les requêtes échouées
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour les uploads de fichiers
 * Limite le nombre d'uploads par utilisateur
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: isDevelopment ? 1000 : 50, // 50 uploads par heure
  message: 'Trop d\'uploads, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  // Utilise l'ID de l'utilisateur authentifié si disponible
  keyGenerator: (req) => {
    return req.user?.id || req.ip || 'unknown';
  },
});

/**
 * Rate limiter pour les exports/imports
 * Opérations coûteuses limitées
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: isDevelopment ? 100 : 10, // 10 exports par heure
  message: 'Trop d\'exports/imports, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip || 'unknown';
  },
});

/**
 * Rate limiter pour les créations/modifications
 * Limite les opérations d'écriture
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 1000 : 30, // 30 créations par minute
  message: 'Trop de créations, veuillez ralentir.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip || 'unknown';
  },
});
