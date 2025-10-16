import { prisma } from '../../config/database.js';
import { storageService } from '../../config/storage.js';
import { v4 as uuidv4 } from 'uuid';

export interface UploadPhotoDto {
  studentId: string;
  skillId?: string;
  caption?: string;
  isTemp?: boolean;
}

export class PhotosService {
  /**
   * Upload une photo pour un élève
   */
  async uploadPhoto(
    userId: string,
    file: Express.Multer.File,
    data: UploadPhotoDto
  ) {
    // Vérifier que l'élève appartient à l'utilisateur
    const student = await prisma.student.findFirst({
      where: {
        id: data.studentId,
        userId
      }
    });

    if (!student) {
      throw new Error('Élève non trouvé');
    }

    // Générer un nom de fichier unique
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `photos/${userId}/${data.studentId}/${fileName}`;

    // Upload vers S3/MinIO
    const result = await storageService.uploadFile(
      file.buffer,
      s3Key,
      file.mimetype
    );

    // Sauvegarder en DB
    if (data.isTemp) {
      // Photo temporaire
      const tempPhoto = await prisma.tempPhoto.create({
        data: {
          studentId: data.studentId,
          userId,
          s3Key: result.key,
          s3Url: result.url,
          description: data.caption || null
        },
        include: {
          student: {
            select: {
              id: true,
              nom: true,
              prenom: true
            }
          }
        }
      });

      return { type: 'temp', photo: tempPhoto };
    } else {
      // Photo de compétence
      const photo = await prisma.photo.create({
        data: {
          studentId: data.studentId,
          userId,
          skillId: data.skillId || null,
          s3Key: result.key,
          s3Url: result.url,
          caption: data.caption || null,
          mimeType: file.mimetype,
          size: file.size
        },
        include: {
          student: {
            select: {
              id: true,
              nom: true,
              prenom: true
            }
          }
        }
      });

      return { type: 'photo', photo };
    }
  }

  /**
   * Récupérer toutes les photos d'un élève
   */
  async getPhotosByStudent(studentId: string, userId: string) {
    // Vérifier que l'élève appartient à l'utilisateur
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        userId
      }
    });

    if (!student) {
      throw new Error('Élève non trouvé');
    }

    const photos = await prisma.photo.findMany({
      where: {
        studentId,
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return photos;
  }

  /**
   * Récupérer les photos temporaires d'un élève
   */
  async getTempPhotosByStudent(studentId: string, userId: string) {
    // Vérifier que l'élève appartient à l'utilisateur
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        userId
      }
    });

    if (!student) {
      throw new Error('Élève non trouvé');
    }

    const tempPhotos = await prisma.tempPhoto.findMany({
      where: {
        studentId,
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return tempPhotos;
  }

  /**
   * Supprimer une photo
   */
  async deletePhoto(photoId: string, userId: string) {
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        userId
      }
    });

    if (!photo) {
      throw new Error('Photo non trouvée');
    }

    // Supprimer de S3
    await storageService.deleteFile(photo.s3Key);

    // Supprimer de la DB
    await prisma.photo.delete({
      where: { id: photoId }
    });

    return { success: true, message: 'Photo supprimée avec succès' };
  }

  /**
   * Supprimer une photo temporaire
   */
  async deleteTempPhoto(tempPhotoId: string, userId: string) {
    const tempPhoto = await prisma.tempPhoto.findFirst({
      where: {
        id: tempPhotoId,
        userId
      }
    });

    if (!tempPhoto) {
      throw new Error('Photo temporaire non trouvée');
    }

    // Supprimer de S3
    await storageService.deleteFile(tempPhoto.s3Key);

    // Supprimer de la DB
    await prisma.tempPhoto.delete({
      where: { id: tempPhotoId }
    });

    return { success: true, message: 'Photo temporaire supprimée avec succès' };
  }

  /**
   * Convertir une photo temporaire en photo de compétence
   */
  async convertTempPhotoToPhoto(
    tempPhotoId: string,
    userId: string,
    skillId: string,
    caption?: string
  ) {
    const tempPhoto = await prisma.tempPhoto.findFirst({
      where: {
        id: tempPhotoId,
        userId
      }
    });

    if (!tempPhoto) {
      throw new Error('Photo temporaire non trouvée');
    }

    // Créer la photo de compétence
    const photo = await prisma.photo.create({
      data: {
        studentId: tempPhoto.studentId,
        userId,
        skillId,
        s3Key: tempPhoto.s3Key,
        s3Url: tempPhoto.s3Url,
        caption: caption || tempPhoto.description || null,
        mimeType: 'image/jpeg', // Valeur par défaut
        size: null
      },
      include: {
        student: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    // Supprimer la photo temporaire de la DB (mais pas de S3)
    await prisma.tempPhoto.delete({
      where: { id: tempPhotoId }
    });

    return photo;
  }

  /**
   * Récupérer toutes les photos temporaires de l'utilisateur
   */
  async getAllTempPhotos(userId: string) {
    const tempPhotos = await prisma.tempPhoto.findMany({
      where: { userId },
      include: {
        student: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return tempPhotos;
  }

  /**
   * Nettoyer les photos temporaires anciennes (> 30 jours)
   */
  async cleanupOldTempPhotos(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldTempPhotos = await prisma.tempPhoto.findMany({
      where: {
        userId,
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    // Supprimer de S3
    for (const tempPhoto of oldTempPhotos) {
      try {
        await storageService.deleteFile(tempPhoto.s3Key);
      } catch (error) {
        console.error(`Erreur lors de la suppression de ${tempPhoto.s3Key}:`, error);
      }
    }

    // Supprimer de la DB
    const result = await prisma.tempPhoto.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    return {
      success: true,
      message: `${result.count} photos temporaires supprimées`,
      count: result.count
    };
  }

  /**
   * Mettre à jour la légende d'une photo
   */
  async updatePhotoCaption(photoId: string, userId: string, caption: string) {
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        userId
      }
    });

    if (!photo) {
      throw new Error('Photo non trouvée');
    }

    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: { caption }
    });

    return updatedPhoto;
  }

  /**
   * Mettre à jour le skillId d'une photo (lier/délier une compétence)
   */
  async updatePhotoSkillId(photoId: string, userId: string, skillId: string | null) {
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        userId
      }
    });

    if (!photo) {
      throw new Error('Photo non trouvée');
    }

    // Si skillId devient null, convertir en photo temporaire
    if (skillId === null) {
      // Créer une TempPhoto avec les mêmes données
      const tempPhoto = await prisma.tempPhoto.create({
        data: {
          studentId: photo.studentId,
          userId: photo.userId,
          s3Key: photo.s3Key,
          s3Url: photo.s3Url,
          description: photo.caption || undefined,
        },
        include: {
          student: {
            select: {
              id: true,
              nom: true,
              prenom: true
            }
          }
        }
      });

      // Supprimer l'ancienne Photo
      await prisma.photo.delete({
        where: { id: photoId }
      });

      return tempPhoto;
    }

    // Sinon, mettre à jour normalement le skillId
    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: { skillId },
      include: {
        student: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    return updatedPhoto;
  }
}

export const photosService = new PhotosService();
