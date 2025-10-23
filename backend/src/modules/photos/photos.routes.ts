import { Router } from 'express';
import multer from 'multer';
import { photosController } from './photos.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { uploadLimiter } from '../../middleware/rateLimiting.middleware.js';

const router = Router();

// Configuration Multer pour l'upload en mémoire avec validation stricte
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Un seul fichier à la fois
  },
  fileFilter: (_req, file, cb) => {
    // Vérification du type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Type de fichier non autorisé. Types acceptés: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }

    // Vérification de l'extension du fichier
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!ext || !allowedExtensions.includes(ext)) {
      return cb(new Error(`Extension de fichier non autorisée. Extensions acceptées: ${allowedExtensions.join(', ')}`));
    }

    // Vérification du nom de fichier (pas de caractères dangereux)
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/g;
    if (dangerousChars.test(file.originalname)) {
      return cb(new Error('Le nom du fichier contient des caractères non autorisés'));
    }

    cb(null, true);
  }
});

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// POST /api/photos/upload - Upload une photo (avec rate limiting)
router.post(
  '/upload',
  uploadLimiter,
  upload.single('photo'),
  asyncHandler((req, res) => photosController.uploadPhoto(req, res))
);

// GET /api/photos/temp - Toutes les photos temporaires de l'utilisateur
router.get('/temp', asyncHandler((req, res) => photosController.getAllTempPhotos(req, res)));

// POST /api/photos/temp/cleanup - Nettoyer les anciennes photos temporaires
router.post('/temp/cleanup', asyncHandler((req, res) => photosController.cleanupOldTempPhotos(req, res)));

// POST /api/photos/temp/:id/convert - Convertir une photo temporaire
router.post('/temp/:id/convert', asyncHandler((req, res) => photosController.convertTempPhoto(req, res)));

// DELETE /api/photos/temp/:id - Supprimer une photo temporaire
router.delete('/temp/:id', asyncHandler((req, res) => photosController.deleteTempPhoto(req, res)));

// GET /api/students/:studentId/photos - Photos d'un élève
router.get('/students/:studentId/photos', asyncHandler((req, res) => photosController.getPhotosByStudent(req, res)));

// GET /api/students/:studentId/temp-photos - Photos temporaires d'un élève
router.get('/students/:studentId/temp-photos', asyncHandler((req, res) => photosController.getTempPhotosByStudent(req, res)));

// PUT /api/photos/:id/caption - Mettre à jour la légende
router.put('/:id/caption', asyncHandler((req, res) => photosController.updateCaption(req, res)));

// PUT /api/photos/:id/skill - Lier/délier une compétence
router.put('/:id/skill', asyncHandler((req, res) => photosController.updateSkillId(req, res)));

// DELETE /api/photos/:id - Supprimer une photo
router.delete('/:id', asyncHandler((req, res) => photosController.deletePhoto(req, res)));

export default router;
