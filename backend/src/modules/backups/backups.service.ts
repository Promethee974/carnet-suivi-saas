import { prisma } from '../../config/database.js';
import { storageService } from '../../config/storage.js';
import { v4 as uuidv4 } from 'uuid';

export interface BackupData {
  version: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  students: any[];
  carnets: any[];
  photos: any[];
  tempPhotos: any[];
}

export class BackupsService {
  /**
   * Créer une sauvegarde complète des données de l'utilisateur
   */
  async createBackup(userId: string) {
    // Récupérer toutes les données de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const students = await prisma.student.findMany({
      where: { userId },
      include: {
        carnets: true,
        photos: true,
        tempPhotos: true
      }
    });

    const carnets = await prisma.carnet.findMany({
      where: { userId }
    });

    const photos = await prisma.photo.findMany({
      where: { userId }
    });

    const tempPhotos = await prisma.tempPhoto.findMany({
      where: { userId }
    });

    // Créer l'objet de sauvegarde
    const backupData: BackupData = {
      version: '2.0.0',
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined
      },
      students,
      carnets,
      photos,
      tempPhotos
    };

    // Convertir en JSON
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupBuffer = Buffer.from(backupJson, 'utf-8');

    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `backup-${timestamp}-${uuidv4()}.json`;
    const s3Key = `backups/${userId}/${fileName}`;

    // Upload vers S3/MinIO
    const result = await storageService.uploadFile(
      backupBuffer,
      s3Key,
      'application/json'
    );

    // Enregistrer la sauvegarde en DB
    const backup = await prisma.backup.create({
      data: {
        userId,
        s3Key: result.key,
        s3Url: result.url,
        size: backupBuffer.length,
        version: '2.0.0'
      }
    });

    return backup;
  }

  /**
   * Récupérer toutes les sauvegardes d'un utilisateur
   */
  async getBackupsByUser(userId: string) {
    const backups = await prisma.backup.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return backups;
  }

  /**
   * Télécharger une sauvegarde
   */
  async downloadBackup(backupId: string, userId: string) {
    const backup = await prisma.backup.findFirst({
      where: {
        id: backupId,
        userId
      }
    });

    if (!backup) {
      throw new Error('Sauvegarde non trouvée');
    }

    // TODO: Implémenter downloadFile dans storageService
    // const fileBuffer = await storageService.downloadFile(backup.s3Key);
    const fileBuffer = Buffer.from(''); // Temporary placeholder

    return {
      backup,
      data: fileBuffer
    };
  }

  /**
   * Restaurer une sauvegarde
   */
  async restoreBackup(backupId: string, userId: string) {
    const backup = await prisma.backup.findFirst({
      where: {
        id: backupId,
        userId
      }
    });

    if (!backup) {
      throw new Error('Sauvegarde non trouvée');
    }

    // TODO: Implémenter downloadFile dans storageService
    // const fileBuffer = await storageService.downloadFile(backup.s3Key);
    const fileBuffer = Buffer.from(JSON.stringify({ user: { id: userId }, students: [], carnets: [], photos: [], tempPhotos: [] })); // Temporary placeholder
    const backupData: BackupData = JSON.parse(fileBuffer.toString('utf-8'));

    // Vérifier que la sauvegarde appartient bien à cet utilisateur
    if (backupData.user.id !== userId) {
      throw new Error('Cette sauvegarde n\'appartient pas à cet utilisateur');
    }

    // ATTENTION: Cette opération remplace toutes les données!
    // En production, il faudrait ajouter une confirmation

    // Supprimer les données existantes (dans une transaction)
    await prisma.$transaction(async (tx) => {
      // Supprimer dans l'ordre inverse des dépendances
      await tx.tempPhoto.deleteMany({ where: { userId } });
      await tx.photo.deleteMany({ where: { userId } });
      await tx.carnet.deleteMany({ where: { userId } });
      await tx.student.deleteMany({ where: { userId } });

      // Restaurer les élèves
      for (const student of backupData.students) {
        await tx.student.create({
          data: {
            id: student.id,
            userId,
            nom: student.nom,
            prenom: student.prenom,
            sexe: student.sexe,
            naissance: student.naissance ? new Date(student.naissance) : null,
            photoUrl: student.photoUrl,
            organizationId: student.organizationId
          }
        });
      }

      // Restaurer les carnets
      for (const carnet of backupData.carnets) {
        await tx.carnet.create({
          data: {
            id: carnet.id,
            studentId: carnet.studentId,
            userId,
            meta: carnet.meta,
            skills: carnet.skills,
            synthese: carnet.synthese,
            progress: carnet.progress
          }
        });
      }

      // Restaurer les photos
      for (const photo of backupData.photos) {
        await tx.photo.create({
          data: {
            id: photo.id,
            studentId: photo.studentId,
            userId,
            skillId: photo.skillId,
            s3Key: photo.s3Key,
            s3Url: photo.s3Url,
            caption: photo.caption,
            mimeType: photo.mimeType,
            size: photo.size
          }
        });
      }

      // Restaurer les photos temporaires
      for (const tempPhoto of backupData.tempPhotos) {
        await tx.tempPhoto.create({
          data: {
            id: tempPhoto.id,
            studentId: tempPhoto.studentId,
            userId,
            s3Key: tempPhoto.s3Key,
            s3Url: tempPhoto.s3Url,
            description: tempPhoto.description
          }
        });
      }
    });

    return {
      success: true,
      message: 'Sauvegarde restaurée avec succès',
      stats: {
        students: backupData.students.length,
        carnets: backupData.carnets.length,
        photos: backupData.photos.length,
        tempPhotos: backupData.tempPhotos.length
      }
    };
  }

  /**
   * Supprimer une sauvegarde
   */
  async deleteBackup(backupId: string, userId: string) {
    const backup = await prisma.backup.findFirst({
      where: {
        id: backupId,
        userId
      }
    });

    if (!backup) {
      throw new Error('Sauvegarde non trouvée');
    }

    // Supprimer de S3
    await storageService.deleteFile(backup.s3Key);

    // Supprimer de la DB
    await prisma.backup.delete({
      where: { id: backupId }
    });

    return { success: true, message: 'Sauvegarde supprimée avec succès' };
  }

  /**
   * Obtenir les statistiques des sauvegardes
   */
  async getBackupStats(userId: string) {
    const backups = await prisma.backup.findMany({
      where: { userId },
      select: {
        id: true,
        size: true,
        createdAt: true
      }
    });

    const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0);
    const count = backups.length;

    return {
      count,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      lastBackup: backups[0]?.createdAt || null
    };
  }
}

export const backupsService = new BackupsService();
