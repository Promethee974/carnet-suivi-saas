import { Router } from 'express';
import { carnetsController } from './carnets.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../middleware/error.middleware.js';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// GET /api/carnets - Liste de tous les carnets de l'utilisateur
router.get('/', asyncHandler((req, res) => carnetsController.getCarnets(req, res)));

// GET /api/students/:studentId/carnet - Carnet d'un élève
router.get('/students/:studentId/carnet', asyncHandler((req, res) => carnetsController.getCarnet(req, res)));

// PUT /api/students/:studentId/carnet - Mettre à jour un carnet
router.put('/students/:studentId/carnet', asyncHandler((req, res) => carnetsController.updateCarnet(req, res)));

// GET /api/carnets/:studentId/export - Exporter un carnet
router.get('/:studentId/export', asyncHandler((req, res) => carnetsController.exportCarnet(req, res)));

// POST /api/carnets/:studentId/import - Importer un carnet
router.post('/:studentId/import', asyncHandler((req, res) => carnetsController.importCarnet(req, res)));

// DELETE /api/students/:studentId/carnet - Supprimer un carnet
router.delete('/students/:studentId/carnet', asyncHandler((req, res) => carnetsController.deleteCarnet(req, res)));

export default router;
