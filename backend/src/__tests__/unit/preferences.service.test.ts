import { describe, it, expect, afterEach } from 'vitest';
import { PreferencesService } from '../../modules/preferences/preferences.service.js';
import { prisma } from '../../config/database.js';
import { createTestUser, cleanupTestUser } from '../helpers/test-utils.js';

describe('PreferencesService', () => {
  let preferencesService: PreferencesService;
  let testUserId: string | null = null;

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('getOrCreatePreferences', () => {
    it('devrait créer des préférences si elles n\'existent pas', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const preferences = await preferencesService.getOrCreatePreferences(
        user.id
      );

      expect(preferences).toBeDefined();
      expect(preferences.userId).toBe(user.id);
      expect(preferences.language).toBe('FR'); // Valeur par défaut du schéma
      expect(preferences.dateFormat).toBe('DD_MM_YYYY');
      expect(preferences.studentsPerPage).toBe(20);
      expect(preferences.defaultStudentSort).toBe('NOM');
    });

    it('devrait retourner les préférences existantes', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      // Créer des préférences personnalisées
      const created = await prisma.userPreferences.create({
        data: {
          userId: user.id,
          language: 'EN',
          studentsPerPage: 50,
          compactMode: true,
        },
      });

      // Récupérer les préférences
      const preferences = await preferencesService.getOrCreatePreferences(
        user.id
      );

      expect(preferences.id).toBe(created.id);
      expect(preferences.language).toBe('EN');
      expect(preferences.studentsPerPage).toBe(50);
      expect(preferences.compactMode).toBe(true);
    });

    it('devrait inclure toutes les propriétés par défaut', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const preferences = await preferencesService.getOrCreatePreferences(
        user.id
      );

      expect(preferences).toHaveProperty('language');
      expect(preferences).toHaveProperty('dateFormat');
      expect(preferences).toHaveProperty('studentsPerPage');
      expect(preferences).toHaveProperty('defaultStudentSort');
      expect(preferences).toHaveProperty('emailNotifications');
      expect(preferences).toHaveProperty('emailReminders');
      expect(preferences).toHaveProperty('showWelcomeMessage');
      expect(preferences).toHaveProperty('compactMode');
    });
  });

  describe('updatePreferences', () => {
    it('devrait mettre à jour la langue', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const updated = await preferencesService.updatePreferences(user.id, {
        language: 'EN',
      });

      expect(updated.language).toBe('EN');
    });

    it('devrait mettre à jour le format de date', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const updated = await preferencesService.updatePreferences(user.id, {
        dateFormat: 'MM_DD_YYYY',
      });

      expect(updated.dateFormat).toBe('MM_DD_YYYY');
    });

    it('devrait mettre à jour le nombre d\'élèves par page', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const updated = await preferencesService.updatePreferences(user.id, {
        studentsPerPage: 50,
      });

      expect(updated.studentsPerPage).toBe(50);
    });

    it('devrait mettre à jour le tri par défaut', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const updated = await preferencesService.updatePreferences(user.id, {
        defaultStudentSort: 'PRENOM',
      });

      expect(updated.defaultStudentSort).toBe('PRENOM');
    });

    it('devrait mettre à jour les notifications email', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const updated = await preferencesService.updatePreferences(user.id, {
        emailNotifications: false,
      });

      expect(updated.emailNotifications).toBe(false);
    });

    it('devrait mettre à jour les rappels email', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const updated = await preferencesService.updatePreferences(user.id, {
        emailReminders: true,
      });

      expect(updated.emailReminders).toBe(true);
    });

    it('devrait mettre à jour le message de bienvenue', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const updated = await preferencesService.updatePreferences(user.id, {
        showWelcomeMessage: false,
      });

      expect(updated.showWelcomeMessage).toBe(false);
    });

    it('devrait mettre à jour le mode compact', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const updated = await preferencesService.updatePreferences(user.id, {
        compactMode: true,
      });

      expect(updated.compactMode).toBe(true);
    });

    it('devrait mettre à jour plusieurs champs à la fois', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      const updated = await preferencesService.updatePreferences(user.id, {
        language: 'EN',
        dateFormat: 'YYYY_MM_DD',
        studentsPerPage: 30,
        compactMode: true,
        emailNotifications: false,
      });

      expect(updated.language).toBe('EN');
      expect(updated.dateFormat).toBe('YYYY_MM_DD');
      expect(updated.studentsPerPage).toBe(30);
      expect(updated.compactMode).toBe(true);
      expect(updated.emailNotifications).toBe(false);
    });

    it('devrait créer les préférences si elles n\'existent pas avant la mise à jour', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      // Vérifier qu'aucune préférence n'existe
      const before = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(before).toBeNull();

      // Mettre à jour (doit créer d'abord)
      const updated = await preferencesService.updatePreferences(user.id, {
        language: 'EN',
      });

      expect(updated).toBeDefined();
      expect(updated.language).toBe('EN');
    });

    it('ne devrait pas affecter les autres champs lors d\'une mise à jour partielle', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      // Créer avec des valeurs spécifiques
      await preferencesService.updatePreferences(user.id, {
        language: 'EN',
        studentsPerPage: 50,
        compactMode: true,
      });

      // Mettre à jour uniquement la langue
      const updated = await preferencesService.updatePreferences(user.id, {
        language: 'FR',
      });

      // Les autres champs doivent rester inchangés
      expect(updated.language).toBe('FR');
      expect(updated.studentsPerPage).toBe(50);
      expect(updated.compactMode).toBe(true);
    });
  });

  describe('resetPreferences', () => {
    it('devrait réinitialiser toutes les préférences aux valeurs par défaut', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      // Créer des préférences personnalisées
      await preferencesService.updatePreferences(user.id, {
        language: 'EN',
        dateFormat: 'MM_DD_YYYY',
        studentsPerPage: 100,
        defaultStudentSort: 'PRENOM',
        emailNotifications: false,
        emailReminders: true,
        showWelcomeMessage: false,
        compactMode: true,
      });

      // Réinitialiser
      const reset = await preferencesService.resetPreferences(user.id);

      expect(reset.language).toBe('FR');
      expect(reset.dateFormat).toBe('DD_MM_YYYY');
      expect(reset.studentsPerPage).toBe(20);
      expect(reset.defaultStudentSort).toBe('NOM');
      expect(reset.emailNotifications).toBe(true);
      expect(reset.emailReminders).toBe(false);
      expect(reset.showWelcomeMessage).toBe(true);
      expect(reset.compactMode).toBe(false);
    });

    it('devrait créer les préférences si elles n\'existent pas avant la réinitialisation', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      // Vérifier qu'aucune préférence n'existe
      const before = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(before).toBeNull();

      // Réinitialiser (doit créer d'abord)
      const reset = await preferencesService.resetPreferences(user.id);

      expect(reset).toBeDefined();
      expect(reset.language).toBe('FR');
      expect(reset.dateFormat).toBe('DD_MM_YYYY');
    });

    it('devrait conserver le même ID après réinitialisation', async () => {
      const { user } = await createTestUser();
      testUserId = user.id;
      preferencesService = new PreferencesService();

      // Créer des préférences
      const created = await preferencesService.getOrCreatePreferences(user.id);
      const originalId = created.id;

      // Réinitialiser
      const reset = await preferencesService.resetPreferences(user.id);

      expect(reset.id).toBe(originalId);
    });
  });

  describe('Isolation des utilisateurs', () => {
    it('ne devrait pas affecter les préférences d\'autres utilisateurs', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser();
      testUserId = user1.id;
      preferencesService = new PreferencesService();

      // Créer des préférences pour user1
      await preferencesService.updatePreferences(user1.id, {
        language: 'EN',
        studentsPerPage: 50,
      });

      // Créer des préférences pour user2
      await preferencesService.updatePreferences(user2.id, {
        language: 'FR',
        studentsPerPage: 30,
      });

      // Vérifier que les préférences sont isolées
      const prefs1 = await preferencesService.getOrCreatePreferences(user1.id);
      const prefs2 = await preferencesService.getOrCreatePreferences(user2.id);

      expect(prefs1.language).toBe('EN');
      expect(prefs1.studentsPerPage).toBe(50);
      expect(prefs2.language).toBe('FR');
      expect(prefs2.studentsPerPage).toBe(30);

      // Cleanup user2
      await cleanupTestUser(user2.id);
    });
  });
});
