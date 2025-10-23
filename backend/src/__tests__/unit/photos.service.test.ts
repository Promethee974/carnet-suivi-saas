import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { PhotosService } from '../../modules/photos/photos.service.js';
import { prisma } from '../../config/database.js';
import {
  createTestUser,
  createTestStudent,
  cleanupTestUser,
} from '../helpers/test-utils.js';

// Mock storageService
vi.mock('../../config/storage.js', () => ({
  storageService: {
    uploadFile: vi.fn().mockResolvedValue({
      key: 'test-key',
      url: 'http://test.com/photo.jpg',
    }),
    deleteFile: vi.fn().mockResolvedValue(true),
  },
}));

describe('PhotosService', () => {
  let photosService: PhotosService;
  let testUserId: string | null = null;

  beforeEach(() => {
    photosService = new PhotosService();
  });

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('getByStudent', () => {
    it('devrait retourner toutes les photos d\'un élève', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      // Créer quelques photos
      await prisma.photo.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'key1',
          s3Url: 'url1',
        },
      });

      await prisma.photo.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'key2',
          s3Url: 'url2',
        },
      });

      const photos = await photosService.getByStudent(student.id, user.id);

      expect(photos).toHaveLength(2);
    });

    it('devrait retourner un tableau vide si aucune photo', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      const photos = await photosService.getByStudent(student.id, user.id);

      expect(photos).toHaveLength(0);
    });

    it('devrait filtrer par compétence', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      await prisma.photo.create({
        data: {
          userId: user.id,
          studentId: student.id,
          skillId: 'skill-1',
          s3Key: 'key1',
          s3Url: 'url1',
        },
      });

      await prisma.photo.create({
        data: {
          userId: user.id,
          studentId: student.id,
          skillId: 'skill-2',
          s3Key: 'key2',
          s3Url: 'url2',
        },
      });

      const photos = await photosService.getByStudent(
        student.id,
        user.id,
        'skill-1'
      );

      expect(photos).toHaveLength(1);
      expect(photos[0].skillId).toBe('skill-1');
    });
  });

  describe('getById', () => {
    it('devrait retourner une photo par son ID', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      const created = await prisma.photo.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'test-key',
          s3Url: 'test-url',
          caption: 'Test caption',
        },
      });

      const photo = await photosService.getById(created.id, user.id);

      expect(photo).toBeDefined();
      expect(photo?.id).toBe(created.id);
      expect(photo?.caption).toBe('Test caption');
    });

    it('devrait retourner null si la photo n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const photo = await photosService.getById('nonexistent-id', user.id);

      expect(photo).toBeNull();
    });

    it('ne devrait pas retourner une photo d\'un autre utilisateur', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser();
      testUserId = user1.id;

      const student = await createTestStudent(user1.id);

      const created = await prisma.photo.create({
        data: {
          userId: user1.id,
          studentId: student.id,
          s3Key: 'test-key',
          s3Url: 'test-url',
        },
      });

      const photo = await photosService.getById(created.id, user2.id);

      expect(photo).toBeNull();

      // Cleanup user2
      await cleanupTestUser(user2.id);
    });
  });

  describe('updatePhoto', () => {
    it('devrait mettre à jour une photo', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      const created = await prisma.photo.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'test-key',
          s3Url: 'test-url',
          caption: 'Original caption',
        },
      });

      const updated = await photosService.updatePhoto(created.id, user.id, {
        caption: 'Updated caption',
        skillId: 'skill-1',
      });

      expect(updated).toBeDefined();
      expect(updated?.caption).toBe('Updated caption');
      expect(updated?.skillId).toBe('skill-1');
    });

    it('devrait retourner null si la photo n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const updated = await photosService.updatePhoto(
        'nonexistent-id',
        user.id,
        { caption: 'Test' }
      );

      expect(updated).toBeNull();
    });
  });

  describe('deletePhoto', () => {
    it('devrait supprimer une photo', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      const created = await prisma.photo.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'test-key',
          s3Url: 'test-url',
        },
      });

      const deleted = await photosService.deletePhoto(created.id, user.id);

      expect(deleted).toBe(true);

      const found = await photosService.getById(created.id, user.id);
      expect(found).toBeNull();
    });

    it('devrait retourner false si la photo n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const deleted = await photosService.deletePhoto(
        'nonexistent-id',
        user.id
      );

      expect(deleted).toBe(false);
    });
  });

  describe('getTempByStudent', () => {
    it('devrait retourner toutes les photos temporaires d\'un élève', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      // Créer quelques photos temporaires
      await prisma.tempPhoto.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'key1',
          s3Url: 'url1',
        },
      });

      await prisma.tempPhoto.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'key2',
          s3Url: 'url2',
        },
      });

      const photos = await photosService.getTempByStudent(student.id, user.id);

      expect(photos).toHaveLength(2);
    });

    it('devrait retourner un tableau vide si aucune photo temp', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      const photos = await photosService.getTempByStudent(student.id, user.id);

      expect(photos).toHaveLength(0);
    });
  });

  describe('deleteTempPhoto', () => {
    it('devrait supprimer une photo temporaire', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const student = await createTestStudent(user.id);

      const created = await prisma.tempPhoto.create({
        data: {
          userId: user.id,
          studentId: student.id,
          s3Key: 'test-key',
          s3Url: 'test-url',
        },
      });

      const deleted = await photosService.deleteTempPhoto(created.id, user.id);

      expect(deleted).toBe(true);

      const found = await prisma.tempPhoto.findFirst({
        where: { id: created.id, userId: user.id },
      });
      expect(found).toBeNull();
    });

    it('devrait retourner false si la photo n\'existe pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;

      const deleted = await photosService.deleteTempPhoto(
        'nonexistent-id',
        user.id
      );

      expect(deleted).toBe(false);
    });
  });
});
