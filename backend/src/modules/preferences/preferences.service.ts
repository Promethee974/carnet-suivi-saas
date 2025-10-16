import { prisma } from '../../config/database.js';
import type { Language, DateFormat, StudentSortBy } from '@prisma/client';

export interface UpdatePreferencesDto {
  language?: Language;
  dateFormat?: DateFormat;
  studentsPerPage?: number;
  defaultStudentSort?: StudentSortBy;
  emailNotifications?: boolean;
  emailReminders?: boolean;
  showWelcomeMessage?: boolean;
  compactMode?: boolean;
}

export class PreferencesService {
  /**
   * Récupérer ou créer les préférences d'un utilisateur
   */
  async getOrCreatePreferences(userId: string) {
    // Chercher les préférences existantes
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    // Si elles n'existent pas, les créer avec les valeurs par défaut
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId
        }
      });
    }

    return preferences;
  }

  /**
   * Mettre à jour les préférences d'un utilisateur
   */
  async updatePreferences(userId: string, data: UpdatePreferencesDto) {
    // S'assurer que les préférences existent
    await this.getOrCreatePreferences(userId);

    // Mettre à jour
    const preferences = await prisma.userPreferences.update({
      where: { userId },
      data
    });

    return preferences;
  }

  /**
   * Réinitialiser les préférences aux valeurs par défaut
   */
  async resetPreferences(userId: string) {
    // S'assurer que les préférences existent
    await this.getOrCreatePreferences(userId);

    // Réinitialiser
    const preferences = await prisma.userPreferences.update({
      where: { userId },
      data: {
        language: 'FR',
        dateFormat: 'DD_MM_YYYY',
        studentsPerPage: 20,
        defaultStudentSort: 'NOM',
        emailNotifications: true,
        emailReminders: false,
        showWelcomeMessage: true,
        compactMode: false
      }
    });

    return preferences;
  }
}

export const preferencesService = new PreferencesService();
