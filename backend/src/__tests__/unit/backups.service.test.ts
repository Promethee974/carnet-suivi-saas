import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { BackupsService } from '../../modules/backups/backups.service.js';
import { prisma } from '../../config/database.js';
import {
  createTestUser,
  createTestStudent,
  cleanupTestUser,
} from '../helpers/test-utils.js';

// Mock storageService
const mockUploadFile = vi.fn();
const mockDownloadFile = vi.fn();
const mockDeleteFile = vi.fn();

vi.mock('../../config/storage.js', () => ({
  storageService: {
    uploadFile: (...args: any[]) => mockUploadFile(...args),
    downloadFile: (...args: any[]) => mockDownloadFile(...args),
    deleteFile: (...args: any[]) => mockDeleteFile(...args),
  },
}));

describe('BackupsService', () => {
  let backupsService: BackupsService;
  let testUserId: string | null = null;

  beforeEach(() => {
    backupsService = new BackupsService();
    // Reset mocks before each test
    mockUploadFile.mockClear();
    mockDownloadFile.mockClear();
    mockDeleteFile.mockClear();
  });

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('createBackup', () => {
    it('devrait créer une sauvegarde complète', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id, {
        nom: 'Test',
        prenom: 'Student',
      });

      // Mock upload response
      mockUploadFile.mockResolvedValue({
        key: `backups/${user.id}/backup-2024-01-01-test.json`,
        url: 'http://test.com/backup.json',
      });

      const backup = await backupsService.createBackup(user.id);

      expect(backup).toBeDefined();
      expect(backup.userId).toBe(user.id);
      expect(backup.version).toBe('2.0.0');
      expect(backup.s3Key).toContain(`backups/${user.id}`);
      expect(backup.s3Url).toBe('http://test.com/backup.json');
      expect(backup.size).toBeGreaterThan(0);
    });

    it('devrait inclure toutes les données de l\'utilisateur', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      // Créer un carnet
      await prisma.carnet.create({
        data: {
          userId: user.id,
          studentId: student.id,
          meta: {},
          skills: {},
          synthese: {},
        },
      });

      // Créer une photo
      await prisma.photo.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'test-key',
          s3Url: 'test-url',
        },
      });

      mockUploadFile.mockResolvedValue({
        key: 'backup-key',
        url: 'backup-url',
      });

      await backupsService.createBackup(user.id);

      // Vérifier que uploadFile a été appelé avec les bonnes données
      expect(mockUploadFile).toHaveBeenCalled();
      const [buffer, key, contentType] = mockUploadFile.mock.calls[0];

      expect(contentType).toBe('application/json');
      expect(key).toContain(`backups/${user.id}`);

      // Vérifier le contenu de la sauvegarde
      const backupData = JSON.parse(buffer.toString('utf-8'));
      expect(backupData.version).toBe('2.0.0');
      expect(backupData.user.id).toBe(user.id);
      expect(backupData.students).toHaveLength(1);
      expect(backupData.carnets).toHaveLength(1);
      expect(backupData.photos).toHaveLength(1);
    });

    it('devrait échouer si l\'utilisateur n\'existe pas', async () => {
      mockUploadFile.mockResolvedValue({
        key: 'backup-key',
        url: 'backup-url',
      });

      await expect(
        backupsService.createBackup('nonexistent-id')
      ).rejects.toThrow('Utilisateur non trouvé');
    });

    it('devrait générer un nom de fichier unique', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      mockUploadFile.mockResolvedValue({
        key: 'backup-key-1',
        url: 'backup-url-1',
      });

      await backupsService.createBackup(user.id);

      mockUploadFile.mockResolvedValue({
        key: 'backup-key-2',
        url: 'backup-url-2',
      });

      await backupsService.createBackup(user.id);

      // Vérifier que les deux sauvegardes ont des clés différentes
      const call1Key = mockUploadFile.mock.calls[0][1];
      const call2Key = mockUploadFile.mock.calls[1][1];

      expect(call1Key).not.toBe(call2Key);
    });
  });

  describe('getBackupsByUser', () => {
    it('devrait retourner toutes les sauvegardes d\'un utilisateur', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      // Créer quelques sauvegardes
      await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-1',
          s3Url: 'url-1',
          size: 1024,
          version: '2.0.0',
        },
      });

      await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-2',
          s3Url: 'url-2',
          size: 2048,
          version: '2.0.0',
        },
      });

      const backups = await backupsService.getBackupsByUser(user.id);

      expect(backups).toHaveLength(2);
    });

    it('devrait trier par date de création décroissante', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      // Créer des sauvegardes avec des dates différentes
      const old = await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-old',
          s3Url: 'url-old',
          size: 1024,
          version: '2.0.0',
          createdAt: new Date('2023-01-01'),
        },
      });

      // Attendre un peu pour garantir une différence de timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const recent = await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-recent',
          s3Url: 'url-recent',
          size: 2048,
          version: '2.0.0',
        },
      });

      const backups = await backupsService.getBackupsByUser(user.id);

      expect(backups[0].id).toBe(recent.id);
      expect(backups[1].id).toBe(old.id);
    });

    it('devrait retourner un tableau vide si aucune sauvegarde', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const backups = await backupsService.getBackupsByUser(user.id);

      expect(backups).toHaveLength(0);
    });
  });

  describe('downloadBackup', () => {
    it('devrait télécharger une sauvegarde', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const backup = await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-key',
          s3Url: 'backup-url',
          size: 1024,
          version: '2.0.0',
        },
      });

      const mockData = Buffer.from(JSON.stringify({ test: 'data' }));
      mockDownloadFile.mockResolvedValue(mockData);

      const result = await backupsService.downloadBackup(backup.id, user.id);

      expect(result.backup.id).toBe(backup.id);
      expect(result.data).toBe(mockData);
      expect(mockDownloadFile).toHaveBeenCalledWith('backup-key');
    });

    it('devrait échouer si la sauvegarde n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await expect(
        backupsService.downloadBackup('nonexistent-id', user.id)
      ).rejects.toThrow('Sauvegarde non trouvée');
    });

    it('ne devrait pas télécharger une sauvegarde d\'un autre utilisateur', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser();
      testUserId = user1.id;

      const backup = await prisma.backup.create({
        data: {
          userId: user1.id,
          s3Key: 'backup-key',
          s3Url: 'backup-url',
          size: 1024,
          version: '2.0.0',
        },
      });

      await expect(
        backupsService.downloadBackup(backup.id, user2.id)
      ).rejects.toThrow('Sauvegarde non trouvée');

      // Cleanup user2
      await cleanupTestUser(user2.id);
    });
  });

  describe('restoreBackup', () => {
    it('devrait restaurer une sauvegarde', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id, {
        nom: 'Original',
        prenom: 'Student',
      });

      // Créer des données qui seront remplacées
      await prisma.carnet.create({
        data: {
          userId: user.id,
          studentId: student.id,
          meta: { test: 'old' },
          skills: {},
          synthese: {},
        },
      });

      // Créer une sauvegarde avec de nouvelles données
      const backupData = {
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
        },
        students: [
          {
            id: 'new-student-id',
            nom: 'Restored',
            prenom: 'Student',
            sexe: 'M',
            naissance: null,
            photoUrl: null,
            organizationId: null,
          },
        ],
        carnets: [
          {
            id: 'new-carnet-id',
            studentId: 'new-student-id',
            meta: { test: 'new' },
            skills: {},
            synthese: {},
            progress: 0,
          },
        ],
        photos: [],
        tempPhotos: [],
      };

      const backup = await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-key',
          s3Url: 'backup-url',
          size: 1024,
          version: '2.0.0',
        },
      });

      mockDownloadFile.mockResolvedValue(
        Buffer.from(JSON.stringify(backupData))
      );

      const result = await backupsService.restoreBackup(backup.id, user.id);

      expect(result.success).toBe(true);
      expect(result.stats.students).toBe(1);
      expect(result.stats.carnets).toBe(1);

      // Vérifier que les données ont été restaurées
      const students = await prisma.student.findMany({
        where: { userId: user.id },
      });
      expect(students).toHaveLength(1);
      expect(students[0].nom).toBe('Restored');

      const carnets = await prisma.carnet.findMany({
        where: { userId: user.id },
      });
      expect(carnets).toHaveLength(1);
      expect(carnets[0].meta).toEqual({ test: 'new' });
    });

    it('devrait échouer si la sauvegarde n\'appartient pas à l\'utilisateur', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser();
      testUserId = user1.id;

      const backupData = {
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        user: {
          id: user2.id, // Différent utilisateur!
          email: user2.email,
        },
        students: [],
        carnets: [],
        photos: [],
        tempPhotos: [],
      };

      const backup = await prisma.backup.create({
        data: {
          userId: user1.id,
          s3Key: 'backup-key',
          s3Url: 'backup-url',
          size: 1024,
          version: '2.0.0',
        },
      });

      mockDownloadFile.mockResolvedValue(
        Buffer.from(JSON.stringify(backupData))
      );

      await expect(
        backupsService.restoreBackup(backup.id, user1.id)
      ).rejects.toThrow('Cette sauvegarde n\'appartient pas à cet utilisateur');

      // Cleanup user2
      await cleanupTestUser(user2.id);
    });

    it('devrait supprimer les anciennes données avant de restaurer', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      // Créer plusieurs élèves et carnets
      const student1 = await createTestStudent(user.id, { nom: 'Student1' });
      const student2 = await createTestStudent(user.id, { nom: 'Student2' });

      await prisma.carnet.create({
        data: {
          userId: user.id,
          studentId: student1.id,
          meta: {},
          skills: {},
          synthese: {},
        },
      });

      await prisma.carnet.create({
        data: {
          userId: user.id,
          studentId: student2.id,
          meta: {},
          skills: {},
          synthese: {},
        },
      });

      // Créer une sauvegarde avec un seul élève
      const backupData = {
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
        },
        students: [
          {
            id: 'restored-student',
            nom: 'Restored',
            prenom: 'Only',
            sexe: 'F',
            naissance: null,
            photoUrl: null,
            organizationId: null,
          },
        ],
        carnets: [],
        photos: [],
        tempPhotos: [],
      };

      const backup = await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-key',
          s3Url: 'backup-url',
          size: 1024,
          version: '2.0.0',
        },
      });

      mockDownloadFile.mockResolvedValue(
        Buffer.from(JSON.stringify(backupData))
      );

      await backupsService.restoreBackup(backup.id, user.id);

      // Vérifier qu'il n'y a qu'un seul élève
      const students = await prisma.student.findMany({
        where: { userId: user.id },
      });
      expect(students).toHaveLength(1);
      expect(students[0].nom).toBe('Restored');

      // Vérifier qu'il n'y a plus de carnets
      const carnets = await prisma.carnet.findMany({
        where: { userId: user.id },
      });
      expect(carnets).toHaveLength(0);
    });
  });

  describe('deleteBackup', () => {
    it('devrait supprimer une sauvegarde', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const backup = await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-key',
          s3Url: 'backup-url',
          size: 1024,
          version: '2.0.0',
        },
      });

      mockDeleteFile.mockResolvedValue(true);

      const result = await backupsService.deleteBackup(backup.id, user.id);

      expect(result.success).toBe(true);
      expect(mockDeleteFile).toHaveBeenCalledWith('backup-key');

      // Vérifier que la sauvegarde a été supprimée de la DB
      const found = await prisma.backup.findUnique({
        where: { id: backup.id },
      });
      expect(found).toBeNull();
    });

    it('devrait échouer si la sauvegarde n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await expect(
        backupsService.deleteBackup('nonexistent-id', user.id)
      ).rejects.toThrow('Sauvegarde non trouvée');
    });

    it('ne devrait pas supprimer une sauvegarde d\'un autre utilisateur', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser();
      testUserId = user1.id;

      const backup = await prisma.backup.create({
        data: {
          userId: user1.id,
          s3Key: 'backup-key',
          s3Url: 'backup-url',
          size: 1024,
          version: '2.0.0',
        },
      });

      await expect(
        backupsService.deleteBackup(backup.id, user2.id)
      ).rejects.toThrow('Sauvegarde non trouvée');

      // Cleanup user2
      await cleanupTestUser(user2.id);
    });
  });

  describe('getBackupStats', () => {
    it('devrait retourner les statistiques des sauvegardes', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-1',
          s3Url: 'url-1',
          size: 1024,
          version: '2.0.0',
        },
      });

      await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-2',
          s3Url: 'url-2',
          size: 2048,
          version: '2.0.0',
        },
      });

      const stats = await backupsService.getBackupStats(user.id);

      expect(stats.count).toBe(2);
      expect(stats.totalSize).toBe(3072); // 1024 + 2048
      expect(stats.totalSizeMB).toBe('0.00'); // < 1 MB
      expect(stats.lastBackup).toBeDefined();
    });

    it('devrait retourner des statistiques vides si aucune sauvegarde', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const stats = await backupsService.getBackupStats(user.id);

      expect(stats.count).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.totalSizeMB).toBe('0.00');
      expect(stats.lastBackup).toBeNull();
    });

    it('devrait calculer correctement la taille en MB', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      // Créer une sauvegarde de 5 MB
      await prisma.backup.create({
        data: {
          userId: user.id,
          s3Key: 'backup-large',
          s3Url: 'url-large',
          size: 5 * 1024 * 1024, // 5 MB
          version: '2.0.0',
        },
      });

      const stats = await backupsService.getBackupStats(user.id);

      expect(stats.totalSizeMB).toBe('5.00');
    });
  });
});
