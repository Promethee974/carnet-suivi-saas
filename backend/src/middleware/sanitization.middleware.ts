import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * Middleware de sanitization MongoDB
 * Supprime les caractères $ et . des données d'entrée pour prévenir les injections MongoDB
 */
export const mongoSanitization = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key }) => {
    console.warn(`⚠️ Tentative d'injection MongoDB détectée dans ${key}`);
  },
});

/**
 * Sanitize une chaîne de caractères pour prévenir les attaques XSS
 * Remplace les caractères dangereux par leurs équivalents HTML entities
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize récursivement un objet
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Ne pas sanitizer les mots de passe (ils sont hashés)
      if (key.toLowerCase().includes('password') || key.toLowerCase().includes('pwd')) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  return obj;
}

/**
 * Middleware XSS de base
 * Sanitize tous les inputs utilisateur dans req.body, req.query, et req.params
 */
export const xssSanitization = (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Erreur de sanitization:', error);
    next(error);
  }
};

/**
 * Validation stricte des UUIDs pour prévenir les injections
 */
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Middleware de validation des paramètres d'ID
 */
export const validateIdParams = (req: Request, res: Response, next: NextFunction): void => {
  const idParams = ['id', 'studentId', 'photoId', 'skillId', 'userId', 'carnetId'];

  for (const param of idParams) {
    const value = req.params[param] || req.body[param] || req.query[param];

    if (value && typeof value === 'string' && !validateUUID(value)) {
      res.status(400).json({
        status: 'error',
        message: `Format d'ID invalide pour ${param}`,
      });
      return;
    }
  }

  next();
};
