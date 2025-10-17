/**
 * Routes pour la gestion des années scolaires
 */

import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { SchoolYearsService } from './school-years.service.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * GET /api/school-years
 * Récupérer toutes les années scolaires de l'utilisateur
 */
router.get('/', async (req, res) => {
  const userId = req.user!.id;
  const schoolYears = await SchoolYearsService.getAll(userId);
  res.json({
    status: 'success',
    data: schoolYears,
  });
});

/**
 * GET /api/school-years/active
 * Récupérer l'année scolaire active
 */
router.get('/active', async (req, res) => {
  const userId = req.user!.id;
  const activeYear = await SchoolYearsService.getActive(userId);
  res.json({
    status: 'success',
    data: activeYear,
  });
});

/**
 * GET /api/school-years/:id
 * Récupérer une année scolaire par ID
 */
router.get('/:id', async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const schoolYear = await SchoolYearsService.getById(id, userId);
  res.json({
    status: 'success',
    data: schoolYear,
  });
});

/**
 * POST /api/school-years
 * Créer une nouvelle année scolaire
 */
router.post('/', async (req, res) => {
  const userId = req.user!.id;
  const { name, startDate, endDate } = req.body;

  if (!name || !startDate || !endDate) {
    return res.status(400).json({
      status: 'error',
      message: 'Nom, date de début et date de fin requis',
    });
  }

  const schoolYear = await SchoolYearsService.create(userId, {
    name,
    startDate,
    endDate,
  });

  res.status(201).json({
    status: 'success',
    data: schoolYear,
  });
});

/**
 * PATCH /api/school-years/:id
 * Mettre à jour une année scolaire
 */
router.patch('/:id', async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { name, startDate, endDate, isActive, isArchived } = req.body;

  const schoolYear = await SchoolYearsService.update(id, userId, {
    name,
    startDate,
    endDate,
    isActive,
    isArchived,
  });

  res.json({
    status: 'success',
    data: schoolYear,
  });
});

/**
 * POST /api/school-years/:id/archive
 * Archiver une année scolaire
 */
router.post('/:id/archive', async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const schoolYear = await SchoolYearsService.archive(id, userId);
  res.json({
    status: 'success',
    data: schoolYear,
  });
});

/**
 * DELETE /api/school-years/:id
 * Supprimer une année scolaire
 */
router.delete('/:id', async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = await SchoolYearsService.delete(id, userId);
  res.json({
    status: 'success',
    data: result,
  });
});

export default router;
