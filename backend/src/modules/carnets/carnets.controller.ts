import { Request, Response } from 'express';
import { z } from 'zod';
import { carnetsService } from './carnets.service.js';

// Schémas de validation
const updateCarnetSchema = z.object({
  meta: z.record(z.any()).optional(),
  skills: z.record(z.any()).optional(),
  synthese: z.record(z.any()).optional()
});

const importCarnetSchema = z.object({
  version: z.string().optional(),
  carnet: z.object({
    meta: z.record(z.any()).optional(),
    skills: z.record(z.any()).optional(),
    synthese: z.record(z.any()).optional()
  })
});

export class CarnetsController {
  /**
   * GET /api/carnets
   * Récupérer tous les carnets de l'utilisateur
   */
  async getCarnets(req: Request, res: Response) {
    const userId = req.user!.id;

    const carnets = await carnetsService.getCarnetsByUser(userId);

    res.json({
      status: 'success',
      data: carnets
    });
  }

  /**
   * GET /api/students/:studentId/carnet
   * Récupérer le carnet d'un élève spécifique
   */
  async getCarnet(req: Request, res: Response) {
    const userId = req.user!.id;
    const { studentId } = req.params;

    const carnet = await carnetsService.getCarnetByStudent(studentId, userId);

    res.json({
      status: 'success',
      data: carnet
    });
  }

  /**
   * PUT /api/students/:studentId/carnet
   * Mettre à jour le carnet d'un élève
   */
  async updateCarnet(req: Request, res: Response) {
    const userId = req.user!.id;
    const { studentId } = req.params;

    // Validation
    const validatedData = updateCarnetSchema.parse(req.body);

    const carnet = await carnetsService.updateCarnet(studentId, userId, validatedData);

    res.json({
      status: 'success',
      message: 'Carnet mis à jour avec succès',
      data: carnet
    });
  }

  /**
   * GET /api/carnets/:studentId/export
   * Exporter le carnet d'un élève
   */
  async exportCarnet(req: Request, res: Response) {
    const userId = req.user!.id;
    const { studentId } = req.params;

    const exportData = await carnetsService.exportCarnet(studentId, userId);

    // Définir les headers pour télécharger un fichier JSON
    const student = exportData.student;
    const filename = `carnet-${student.nom}-${student.prenom}-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.json(exportData);
  }

  /**
   * POST /api/carnets/:studentId/import
   * Importer un carnet pour un élève
   */
  async importCarnet(req: Request, res: Response) {
    const userId = req.user!.id;
    const { studentId } = req.params;

    // Validation
    const validatedData = importCarnetSchema.parse(req.body);

    const carnet = await carnetsService.importCarnet(studentId, userId, validatedData);

    res.json({
      status: 'success',
      message: 'Carnet importé avec succès',
      data: carnet
    });
  }

  /**
   * DELETE /api/students/:studentId/carnet
   * Supprimer le carnet d'un élève
   */
  async deleteCarnet(req: Request, res: Response) {
    const userId = req.user!.id;
    const { studentId } = req.params;

    const result = await carnetsService.deleteCarnet(studentId, userId);

    res.json({
      status: 'success',
      message: result.message
    });
  }
}

export const carnetsController = new CarnetsController();
