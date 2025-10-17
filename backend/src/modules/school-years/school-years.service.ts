/**
 * Service pour la gestion des années scolaires
 */

import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';

export interface CreateSchoolYearData {
  name: string;
  school?: string;      // Nom de l'établissement
  classLevel?: string;  // Niveau de classe (PS, MS, GS)
  startDate: string;    // Format: YYYY-MM-DD
  endDate: string;      // Format: YYYY-MM-DD
}

export interface UpdateSchoolYearData {
  name?: string;
  school?: string;
  classLevel?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isArchived?: boolean;
}

export class SchoolYearsService {
  /**
   * Récupérer toutes les années scolaires d'un utilisateur
   */
  static async getAll(userId: string) {
    const schoolYears = await prisma.schoolYear.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: {
            students: true,
            carnets: true,
          },
        },
      },
    });

    return schoolYears;
  }

  /**
   * Récupérer l'année scolaire active
   */
  static async getActive(userId: string) {
    const activeYear = await prisma.schoolYear.findFirst({
      where: {
        userId,
        isActive: true,
        isArchived: false,
      },
      include: {
        _count: {
          select: {
            students: true,
            carnets: true,
          },
        },
      },
    });

    return activeYear;
  }

  /**
   * Récupérer une année scolaire par ID
   */
  static async getById(schoolYearId: string, userId: string) {
    const schoolYear = await prisma.schoolYear.findFirst({
      where: {
        id: schoolYearId,
        userId,
      },
      include: {
        _count: {
          select: {
            students: true,
            carnets: true,
          },
        },
      },
    });

    if (!schoolYear) {
      throw new AppError(404, 'Année scolaire non trouvée');
    }

    return schoolYear;
  }

  /**
   * Créer une nouvelle année scolaire
   */
  static async create(userId: string, data: CreateSchoolYearData) {
    // Vérifier les dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      throw new AppError(400, 'La date de fin doit être après la date de début');
    }

    // Note: Le chevauchement de périodes est autorisé pour permettre aux enseignants
    // remplaçants de gérer plusieurs classes simultanément. Seule la contrainte
    // d'une année active à la fois est appliquée (gérée lors de l'activation).

    // Créer l'année scolaire
    const schoolYear = await prisma.schoolYear.create({
      data: {
        userId,
        name: data.name,
        school: data.school,
        classLevel: data.classLevel as any, // Cast to ClassLevel enum
        startDate,
        endDate,
      },
      include: {
        _count: {
          select: {
            students: true,
            carnets: true,
          },
        },
      },
    });

    return schoolYear;
  }

  /**
   * Mettre à jour une année scolaire
   */
  static async update(
    schoolYearId: string,
    userId: string,
    data: UpdateSchoolYearData
  ) {
    // Vérifier que l'année existe
    await this.getById(schoolYearId, userId);

    // Si on active cette année, désactiver toutes les autres
    if (data.isActive === true) {
      await prisma.schoolYear.updateMany({
        where: {
          userId,
          id: { not: schoolYearId },
        },
        data: {
          isActive: false,
        },
      });
    }

    // Mettre à jour l'année scolaire
    const updatedData: any = {};

    if (data.name !== undefined) updatedData.name = data.name;
    if (data.school !== undefined) updatedData.school = data.school;
    if (data.classLevel !== undefined) updatedData.classLevel = data.classLevel;
    if (data.isActive !== undefined) updatedData.isActive = data.isActive;
    if (data.isArchived !== undefined) updatedData.isArchived = data.isArchived;

    if (data.startDate !== undefined) {
      updatedData.startDate = new Date(data.startDate);
    }
    if (data.endDate !== undefined) {
      updatedData.endDate = new Date(data.endDate);
    }

    // Vérifier les dates si elles ont été modifiées
    if (updatedData.startDate || updatedData.endDate) {
      const currentYear = await prisma.schoolYear.findUnique({
        where: { id: schoolYearId },
      });

      const startDate = updatedData.startDate || currentYear!.startDate;
      const endDate = updatedData.endDate || currentYear!.endDate;

      if (startDate >= endDate) {
        throw new AppError(400, 'La date de fin doit être après la date de début');
      }
    }

    const schoolYear = await prisma.schoolYear.update({
      where: { id: schoolYearId },
      data: updatedData,
      include: {
        _count: {
          select: {
            students: true,
            carnets: true,
          },
        },
      },
    });

    return schoolYear;
  }

  /**
   * Archiver une année scolaire
   */
  static async archive(schoolYearId: string, userId: string) {
    await this.getById(schoolYearId, userId);

    const schoolYear = await prisma.schoolYear.update({
      where: { id: schoolYearId },
      data: {
        isArchived: true,
        isActive: false,
      },
      include: {
        _count: {
          select: {
            students: true,
            carnets: true,
          },
        },
      },
    });

    return schoolYear;
  }

  /**
   * Supprimer une année scolaire
   */
  static async delete(schoolYearId: string, userId: string) {
    const schoolYear = await this.getById(schoolYearId, userId);

    // Vérifier qu'il n'y a pas d'élèves ou de carnets associés
    if (schoolYear._count.students > 0 || schoolYear._count.carnets > 0) {
      throw new AppError(
        400,
        'Impossible de supprimer une année scolaire contenant des élèves ou des carnets'
      );
    }

    await prisma.schoolYear.delete({
      where: { id: schoolYearId },
    });

    return { message: 'Année scolaire supprimée avec succès' };
  }
}
