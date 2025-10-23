import { Request, Response } from 'express';
import { z } from 'zod';
import { studentsService } from './students.service.js';

// Schémas de validation
const createStudentSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  sexe: z.enum(['F', 'M', 'AUTRE', 'ND']).optional(),
  naissance: z.string().optional(), // Format: YYYY-MM-DD
  photoUrl: z.string().url().optional(),
  organizationId: z.string().optional()
});

const updateStudentSchema = z.object({
  nom: z.string().min(1).optional(),
  prenom: z.string().min(1).optional(),
  sexe: z.enum(['F', 'M', 'AUTRE', 'ND']).optional(),
  naissance: z.string().nullable().optional(), // Format: YYYY-MM-DD
  photoUrl: z.string().url().nullable().optional(),
  organizationId: z.string().nullable().optional()
});

export class StudentsController {
  /**
   * GET /api/students
   * Récupérer tous les élèves de l'utilisateur connecté
   */
  async getStudents(req: Request, res: Response) {
    const userId = req.user!.id;

    const students = await studentsService.getStudentsByUser(userId);

    res.json({
      status: 'success',
      data: students
    });
  }

  /**
   * GET /api/students/:id
   * Récupérer un élève spécifique
   */
  async getStudent(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const student = await studentsService.getStudentById(id, userId);

    res.json({
      status: 'success',
      data: student
    });
  }

  /**
   * POST /api/students
   * Créer un nouvel élève
   */
  async createStudent(req: Request, res: Response) {
    const userId = req.user!.id;

    // Validation
    const validatedData = createStudentSchema.parse(req.body);

    const student = await studentsService.createStudent(userId, validatedData);

    res.status(201).json({
      status: 'success',
      message: 'Élève créé avec succès',
      data: student
    });
  }

  /**
   * PUT /api/students/:id
   * Mettre à jour un élève
   */
  async updateStudent(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    // Validation
    const validatedData = updateStudentSchema.parse(req.body);

    const student = await studentsService.updateStudent(id, userId, validatedData);

    res.json({
      status: 'success',
      message: 'Élève mis à jour avec succès',
      data: student
    });
  }

  /**
   * DELETE /api/students/:id
   * Supprimer un élève
   */
  async deleteStudent(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await studentsService.deleteStudent(id, userId);

    res.json({
      status: 'success',
      message: result.message
    });
  }

  /**
   * GET /api/students/search?q=query
   * Rechercher des élèves
   */
  async searchStudents(req: Request, res: Response) {
    const userId = req.user!.id;
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Le paramètre de recherche "q" est requis'
      });
    }

    const students = await studentsService.searchStudents(userId, query);

    res.json({
      status: 'success',
      data: students
    });
  }

  /**
   * GET /api/students/:id/stats
   * Obtenir les statistiques d'un élève
   */
  async getStudentStats(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const stats = await studentsService.getStudentStats(id, userId);

    res.json({
      status: 'success',
      data: stats
    });
  }

  /**
   * GET /api/students/dashboard/stats
   * Obtenir les statistiques globales pour le dashboard
   */
  async getDashboardStats(req: Request, res: Response) {
    const userId = req.user!.id;

    const stats = await studentsService.getDashboardStats(userId);

    res.json({
      status: 'success',
      data: stats
    });
  }

  /**
   * PUT /api/students/:id/profile-picture
   * Définir une photo comme photo de profil
   */
  async setProfilePicture(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id: studentId } = req.params;
    const { photoId } = req.body;

    if (!photoId) {
      return res.status(400).json({
        status: 'error',
        message: 'photoId est requis'
      });
    }

    const student = await studentsService.setProfilePicture(studentId, photoId, userId);

    res.json({
      status: 'success',
      data: student
    });
  }

  /**
   * DELETE /api/students/:id/profile-picture
   * Retirer la photo de profil
   */
  async removeProfilePicture(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id: studentId } = req.params;

    const student = await studentsService.removeProfilePicture(studentId, userId);

    res.json({
      status: 'success',
      data: student
    });
  }
}

export const studentsController = new StudentsController();
