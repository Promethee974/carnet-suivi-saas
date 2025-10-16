import { Router } from 'express';
import { preferencesController } from './preferences.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// GET /api/preferences - Récupérer les préférences
router.get('/', (req, res) => preferencesController.getPreferences(req, res));

// PUT /api/preferences - Mettre à jour les préférences
router.put('/', (req, res) => preferencesController.updatePreferences(req, res));

// POST /api/preferences/reset - Réinitialiser les préférences
router.post('/reset', (req, res) => preferencesController.resetPreferences(req, res));

export default router;
