import { Router } from 'express';
import { studentsController } from './students.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// GET /api/students/search?q=query - Rechercher (doit être avant /:id)
router.get('/search', (req, res) => studentsController.searchStudents(req, res));

// GET /api/students/dashboard/stats - Statistiques dashboard (doit être avant /:id)
router.get('/dashboard/stats', (req, res) => studentsController.getDashboardStats(req, res));

// GET /api/students - Liste des élèves
router.get('/', (req, res) => studentsController.getStudents(req, res));

// GET /api/students/:id - Détail d'un élève
router.get('/:id', (req, res) => studentsController.getStudent(req, res));

// GET /api/students/:id/stats - Statistiques d'un élève
router.get('/:id/stats', (req, res) => studentsController.getStudentStats(req, res));

// POST /api/students - Créer un élève
router.post('/', (req, res) => studentsController.createStudent(req, res));

// PUT /api/students/:id - Modifier un élève
router.put('/:id', (req, res) => studentsController.updateStudent(req, res));

// DELETE /api/students/:id - Supprimer un élève
router.delete('/:id', (req, res) => studentsController.deleteStudent(req, res));

export default router;
