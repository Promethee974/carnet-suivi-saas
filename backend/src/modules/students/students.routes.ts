import { Router } from 'express';
import { studentsController } from './students.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../middleware/error.middleware.js';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// GET /api/students/search?q=query - Rechercher (doit être avant /:id)
router.get('/search', asyncHandler((req, res) => studentsController.searchStudents(req, res)));

// GET /api/students/dashboard/stats - Statistiques dashboard (doit être avant /:id)
router.get('/dashboard/stats', asyncHandler((req, res) => studentsController.getDashboardStats(req, res)));

// GET /api/students - Liste des élèves
router.get('/', asyncHandler((req, res) => studentsController.getStudents(req, res)));

// GET /api/students/:id - Détail d'un élève
router.get('/:id', asyncHandler((req, res) => studentsController.getStudent(req, res)));

// GET /api/students/:id/stats - Statistiques d'un élève
router.get('/:id/stats', asyncHandler((req, res) => studentsController.getStudentStats(req, res)));

// POST /api/students - Créer un élève
router.post('/', asyncHandler((req, res) => studentsController.createStudent(req, res)));

// PUT /api/students/:id - Modifier un élève
router.put('/:id', asyncHandler((req, res) => studentsController.updateStudent(req, res)));

// DELETE /api/students/:id - Supprimer un élève
router.delete('/:id', asyncHandler((req, res) => studentsController.deleteStudent(req, res)));

// PUT /api/students/:id/profile-picture - Définir une photo comme photo de profil
router.put('/:id/profile-picture', asyncHandler((req, res) => studentsController.setProfilePicture(req, res)));

// DELETE /api/students/:id/profile-picture - Retirer la photo de profil
router.delete('/:id/profile-picture', asyncHandler((req, res) => studentsController.removeProfilePicture(req, res)));

export default router;
