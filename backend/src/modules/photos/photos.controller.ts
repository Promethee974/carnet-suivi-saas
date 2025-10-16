import { Request, Response } from 'express';
import { z } from 'zod';
import { photosService } from './photos.service.js';

// Schémas de validation
const updateCaptionSchema = z.object({
  caption: z.string()
});

const updateSkillIdSchema = z.object({
  skillId: z.string().nullable()
});

const convertTempPhotoSchema = z.object({
  skillId: z.string(),
  caption: z.string().optional()
});

export class PhotosController {
  /**
   * POST /api/photos/upload
   * Upload une photo
   */
  async uploadPhoto(req: Request, res: Response) {
    const userId = req.user!.id;

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Aucun fichier fourni'
      });
    }

    const { studentId, skillId, caption, isTemp } = req.body;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'studentId est requis'
      });
    }

    const result = await photosService.uploadPhoto(userId, req.file, {
      studentId,
      skillId,
      caption,
      isTemp: isTemp === 'true' || isTemp === true
    });

    res.status(201).json({
      status: 'success',
      message: 'Photo uploadée avec succès',
      data: result
    });
  }

  /**
   * GET /api/students/:studentId/photos
   * Récupérer toutes les photos d'un élève
   */
  async getPhotosByStudent(req: Request, res: Response) {
    const userId = req.user!.id;
    const { studentId } = req.params;

    const photos = await photosService.getPhotosByStudent(studentId, userId);

    res.json({
      status: 'success',
      data: photos
    });
  }

  /**
   * GET /api/students/:studentId/temp-photos
   * Récupérer les photos temporaires d'un élève
   */
  async getTempPhotosByStudent(req: Request, res: Response) {
    const userId = req.user!.id;
    const { studentId } = req.params;

    const tempPhotos = await photosService.getTempPhotosByStudent(studentId, userId);

    res.json({
      status: 'success',
      data: tempPhotos
    });
  }

  /**
   * GET /api/photos/temp
   * Récupérer toutes les photos temporaires de l'utilisateur
   */
  async getAllTempPhotos(req: Request, res: Response) {
    const userId = req.user!.id;

    const tempPhotos = await photosService.getAllTempPhotos(userId);

    res.json({
      status: 'success',
      data: tempPhotos
    });
  }

  /**
   * DELETE /api/photos/:id
   * Supprimer une photo
   */
  async deletePhoto(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await photosService.deletePhoto(id, userId);

    res.json({
      status: 'success',
      message: result.message
    });
  }

  /**
   * DELETE /api/photos/temp/:id
   * Supprimer une photo temporaire
   */
  async deleteTempPhoto(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await photosService.deleteTempPhoto(id, userId);

    res.json({
      status: 'success',
      message: result.message
    });
  }

  /**
   * POST /api/photos/temp/:id/convert
   * Convertir une photo temporaire en photo de compétence
   */
  async convertTempPhoto(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    // Validation
    const validatedData = convertTempPhotoSchema.parse(req.body);

    const photo = await photosService.convertTempPhotoToPhoto(
      id,
      userId,
      validatedData.skillId,
      validatedData.caption
    );

    res.json({
      status: 'success',
      message: 'Photo convertie avec succès',
      data: photo
    });
  }

  /**
   * PUT /api/photos/:id/caption
   * Mettre à jour la légende d'une photo
   */
  async updateCaption(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    // Validation
    const validatedData = updateCaptionSchema.parse(req.body);

    const photo = await photosService.updatePhotoCaption(
      id,
      userId,
      validatedData.caption
    );

    res.json({
      status: 'success',
      message: 'Légende mise à jour avec succès',
      data: photo
    });
  }

  /**
   * PUT /api/photos/:id/skill
   * Mettre à jour le skillId d'une photo (lier/délier une compétence)
   */
  async updateSkillId(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    // Validation
    const validatedData = updateSkillIdSchema.parse(req.body);

    const photo = await photosService.updatePhotoSkillId(
      id,
      userId,
      validatedData.skillId
    );

    res.json({
      status: 'success',
      message: 'Compétence liée avec succès',
      data: photo
    });
  }

  /**
   * POST /api/photos/temp/cleanup
   * Nettoyer les photos temporaires anciennes
   */
  async cleanupOldTempPhotos(req: Request, res: Response) {
    const userId = req.user!.id;

    const result = await photosService.cleanupOldTempPhotos(userId);

    res.json({
      status: 'success',
      message: result.message,
      data: { count: result.count }
    });
  }
}

export const photosController = new PhotosController();
