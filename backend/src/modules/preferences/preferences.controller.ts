import { Request, Response } from 'express';
import { z } from 'zod';
import { preferencesService } from './preferences.service.js';

// Schémas de validation
const updatePreferencesSchema = z.object({
  language: z.enum(['FR', 'EN']).optional(),
  dateFormat: z.enum(['DD_MM_YYYY', 'MM_DD_YYYY', 'YYYY_MM_DD']).optional(),
  studentsPerPage: z.number().int().min(5).max(100).optional(),
  defaultStudentSort: z.enum(['NOM', 'PRENOM', 'CREATED_AT', 'UPDATED_AT']).optional(),
  emailNotifications: z.boolean().optional(),
  emailReminders: z.boolean().optional(),
  showWelcomeMessage: z.boolean().optional(),
  compactMode: z.boolean().optional()
});

export class PreferencesController {
  /**
   * GET /api/preferences
   * Récupérer les préférences de l'utilisateur connecté
   */
  async getPreferences(req: Request, res: Response) {
    const userId = req.user!.id;

    const preferences = await preferencesService.getOrCreatePreferences(userId);

    res.json({
      status: 'success',
      data: preferences
    });
  }

  /**
   * PUT /api/preferences
   * Mettre à jour les préférences de l'utilisateur connecté
   */
  async updatePreferences(req: Request, res: Response) {
    const userId = req.user!.id;

    // Validation
    const validatedData = updatePreferencesSchema.parse(req.body);

    const preferences = await preferencesService.updatePreferences(userId, validatedData);

    res.json({
      status: 'success',
      message: 'Préférences mises à jour avec succès',
      data: preferences
    });
  }

  /**
   * POST /api/preferences/reset
   * Réinitialiser les préférences aux valeurs par défaut
   */
  async resetPreferences(req: Request, res: Response) {
    const userId = req.user!.id;

    const preferences = await preferencesService.resetPreferences(userId);

    res.json({
      status: 'success',
      message: 'Préférences réinitialisées avec succès',
      data: preferences
    });
  }
}

export const preferencesController = new PreferencesController();
