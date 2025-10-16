import { Router } from 'express';
import multer from 'multer';
import { photosController } from './photos.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Configuration Multer pour l'upload en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accepter seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'));
    }
  }
});

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// POST /api/photos/upload - Upload une photo
router.post(
  '/upload',
  upload.single('photo'),
  (req, res) => photosController.uploadPhoto(req, res)
);

// GET /api/photos/temp - Toutes les photos temporaires de l'utilisateur
router.get('/temp', (req, res) => photosController.getAllTempPhotos(req, res));

// POST /api/photos/temp/cleanup - Nettoyer les anciennes photos temporaires
router.post('/temp/cleanup', (req, res) => photosController.cleanupOldTempPhotos(req, res));

// POST /api/photos/temp/:id/convert - Convertir une photo temporaire
router.post('/temp/:id/convert', (req, res) => photosController.convertTempPhoto(req, res));

// DELETE /api/photos/temp/:id - Supprimer une photo temporaire
router.delete('/temp/:id', (req, res) => photosController.deleteTempPhoto(req, res));

// GET /api/students/:studentId/photos - Photos d'un élève
router.get('/students/:studentId/photos', (req, res) => photosController.getPhotosByStudent(req, res));

// GET /api/students/:studentId/temp-photos - Photos temporaires d'un élève
router.get('/students/:studentId/temp-photos', (req, res) => photosController.getTempPhotosByStudent(req, res));

// PUT /api/photos/:id/caption - Mettre à jour la légende
router.put('/:id/caption', (req, res) => photosController.updateCaption(req, res));

// PUT /api/photos/:id/skill - Lier/délier une compétence
router.put('/:id/skill', (req, res) => photosController.updateSkillId(req, res));

// DELETE /api/photos/:id - Supprimer une photo
router.delete('/:id', (req, res) => photosController.deletePhoto(req, res));

export default router;
