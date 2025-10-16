import { Router } from 'express';
import { backupsController } from './backups.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// GET /api/backups/stats - Statistiques (doit être avant /:id)
router.get('/stats', (req, res) => backupsController.getBackupStats(req, res));

// GET /api/backups - Liste des sauvegardes
router.get('/', (req, res) => backupsController.getBackups(req, res));

// POST /api/backups - Créer une sauvegarde
router.post('/', (req, res) => backupsController.createBackup(req, res));

// GET /api/backups/:id/download - Télécharger une sauvegarde
router.get('/:id/download', (req, res) => backupsController.downloadBackup(req, res));

// POST /api/backups/:id/restore - Restaurer une sauvegarde
router.post('/:id/restore', (req, res) => backupsController.restoreBackup(req, res));

// DELETE /api/backups/:id - Supprimer une sauvegarde
router.delete('/:id', (req, res) => backupsController.deleteBackup(req, res));

export default router;
