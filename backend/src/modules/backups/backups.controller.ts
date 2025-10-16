import { Request, Response } from 'express';
import { backupsService } from './backups.service.js';

export class BackupsController {
  /**
   * POST /api/backups
   * Créer une nouvelle sauvegarde
   */
  async createBackup(req: Request, res: Response) {
    const userId = req.user!.id;

    const backup = await backupsService.createBackup(userId);

    res.status(201).json({
      status: 'success',
      message: 'Sauvegarde créée avec succès',
      data: backup
    });
  }

  /**
   * GET /api/backups
   * Récupérer toutes les sauvegardes de l'utilisateur
   */
  async getBackups(req: Request, res: Response) {
    const userId = req.user!.id;

    const backups = await backupsService.getBackupsByUser(userId);

    res.json({
      status: 'success',
      data: backups
    });
  }

  /**
   * GET /api/backups/stats
   * Statistiques des sauvegardes
   */
  async getBackupStats(req: Request, res: Response) {
    const userId = req.user!.id;

    const stats = await backupsService.getBackupStats(userId);

    res.json({
      status: 'success',
      data: stats
    });
  }

  /**
   * GET /api/backups/:id/download
   * Télécharger une sauvegarde
   */
  async downloadBackup(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await backupsService.downloadBackup(id, userId);

    // Définir les headers pour télécharger un fichier
    const timestamp = new Date(result.backup.createdAt).toISOString().split('T')[0];
    const filename = `backup-${timestamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', result.data.length);

    res.send(result.data);
  }

  /**
   * POST /api/backups/:id/restore
   * Restaurer une sauvegarde
   */
  async restoreBackup(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await backupsService.restoreBackup(id, userId);

    res.json({
      status: 'success',
      message: result.message,
      data: result.stats
    });
  }

  /**
   * DELETE /api/backups/:id
   * Supprimer une sauvegarde
   */
  async deleteBackup(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await backupsService.deleteBackup(id, userId);

    res.json({
      status: 'success',
      message: result.message
    });
  }
}

export const backupsController = new BackupsController();
