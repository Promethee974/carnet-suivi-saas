import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { SchoolYearsService } from '../school-years/school-years.service.js';

export interface CarnetMetaDto {
  eleve?: {
    nom?: string;
    prenom?: string;
    sexe?: string;
    naissance?: string;
  };
  annee?: string;
  enseignant?: {
    nom?: string;
    prenom?: string;
    email?: string;
  };
  periode?: string;
  avatar?: string;
}

export interface CarnetSkillsDto {
  [skillId: string]: {
    status?: 'acquired' | 'in_progress' | 'not_acquired' | null;
    comment?: string;
    evaluatedAt?: string;
    period?: number;
  };
}

export interface CarnetSyntheseDto {
  forces?: string;
  axes?: string;
  projets?: string;
}

export interface UpdateCarnetDto {
  meta?: CarnetMetaDto;
  skills?: CarnetSkillsDto;
  synthese?: CarnetSyntheseDto;
}

export class CarnetsService {
  /**
   * Récupérer le carnet d'un élève
   */
  async getCarnetByStudent(studentId: string, userId: string) {
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

    // Récupérer le carnet (ou le créer s'il n'existe pas)
    let carnet = await prisma.carnet.findFirst({
      where: {
        studentId,
        userId
      },
      include: {
        student: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            sexe: true,
            naissance: true,
            photoUrl: true
          }
        }
      }
    });

    // Si pas de carnet, créer un carnet vide
    if (!carnet) {
      // Récupérer l'année scolaire active pour lier le carnet
      const activeYear = await SchoolYearsService.getActive(userId);

      carnet = await prisma.carnet.create({
        data: {
          studentId,
          userId,
          schoolYearId: activeYear?.id,
          meta: {},
          skills: {},
          synthese: {}
        },
        include: {
          student: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              sexe: true,
              naissance: true,
              photoUrl: true
            }
          }
        }
      });
    }

    return carnet;
  }

  /**
   * Mettre à jour le carnet d'un élève
   */
  async updateCarnet(studentId: string, userId: string, data: UpdateCarnetDto) {
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

    // Récupérer le carnet existant
    const existingCarnet = await prisma.carnet.findFirst({
      where: {
        studentId,
        userId
      }
    });

    const updateData: Prisma.CarnetUpdateInput = {};

    // Mise à jour des métadonnées
    if (data.meta !== undefined) {
      const currentMeta = (existingCarnet?.meta as any) || {};
      updateData.meta = { ...currentMeta, ...data.meta };
    }

    // Mise à jour des compétences
    if (data.skills !== undefined) {
      const currentSkills = (existingCarnet?.skills as any) || {};
      updateData.skills = { ...currentSkills, ...data.skills };
    }

    // Mise à jour de la synthèse
    if (data.synthese !== undefined) {
      const currentSynthese = (existingCarnet?.synthese as any) || {};
      updateData.synthese = { ...currentSynthese, ...data.synthese };
    }

    // Calculer la progression si des compétences ont été modifiées
    if (data.skills !== undefined) {
      const skills = { ...(existingCarnet?.skills as any), ...data.skills };
      updateData.progress = this.calculateProgress(skills);
    }

    // Si le carnet n'existe pas, le créer
    if (!existingCarnet) {
      // Récupérer l'année scolaire active pour lier le carnet
      const activeYear = await SchoolYearsService.getActive(userId);

      const carnet = await prisma.carnet.create({
        data: {
          studentId,
          userId,
          schoolYearId: activeYear?.id,
          meta: (data.meta || {}) as any,
          skills: (data.skills || {}) as any,
          synthese: (data.synthese || {}) as any,
          progress: data.skills ? this.calculateProgress(data.skills) : {}
        },
        include: {
          student: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              sexe: true,
              naissance: true,
              photoUrl: true
            }
          }
        }
      });

      return carnet;
    }

    // Sinon, mettre à jour
    const carnet = await prisma.carnet.update({
      where: {
        id: existingCarnet.id
      },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            sexe: true,
            naissance: true,
            photoUrl: true
          }
        }
      }
    });

    return carnet;
  }

  /**
   * Exporter le carnet d'un élève (format JSON)
   */
  async exportCarnet(studentId: string, userId: string) {
    const carnet = await this.getCarnetByStudent(studentId, userId);

    const exportData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      student: carnet.student,
      carnet: {
        meta: carnet.meta,
        skills: carnet.skills,
        synthese: carnet.synthese,
        progress: carnet.progress
      }
    };

    return exportData;
  }

  /**
   * Importer un carnet pour un élève
   */
  async importCarnet(studentId: string, userId: string, importData: any) {
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

    // Valider le format
    if (!importData.carnet) {
      throw new Error('Format d\'importation invalide');
    }

    const data: UpdateCarnetDto = {
      meta: importData.carnet.meta,
      skills: importData.carnet.skills,
      synthese: importData.carnet.synthese
    };

    const carnet = await this.updateCarnet(studentId, userId, data);

    return carnet;
  }

  /**
   * Calculer la progression par domaine
   * @private
   */
  private calculateProgress(skills: any): any {
    const progress: any = {};

    // Grouper les compétences par domaine
    // Format attendu: "domaine.sous-domaine.competence"
    Object.entries(skills).forEach(([skillId, skillData]: [string, any]) => {
      if (skillData.status === 'acquired') {
        const domain = skillId.split('.')[0];
        if (!progress[domain]) {
          progress[domain] = { acquired: 0, total: 0 };
        }
        progress[domain].acquired += 1;
        progress[domain].total += 1;
      } else if (skillData.status !== null) {
        const domain = skillId.split('.')[0];
        if (!progress[domain]) {
          progress[domain] = { acquired: 0, total: 0 };
        }
        progress[domain].total += 1;
      }
    });

    return progress;
  }

  /**
   * Récupérer tous les carnets d'un utilisateur
   * Filtrés par année scolaire active si elle existe
   */
  async getCarnetsByUser(userId: string) {
    // Récupérer l'année scolaire active
    const activeYear = await SchoolYearsService.getActive(userId);

    const carnets = await prisma.carnet.findMany({
      where: {
        userId,
        // Filtrer par année scolaire active si elle existe
        ...(activeYear ? { schoolYearId: activeYear.id } : {})
      },
      include: {
        student: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            sexe: true,
            photoUrl: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return carnets;
  }

  /**
   * Supprimer le carnet d'un élève
   */
  async deleteCarnet(studentId: string, userId: string) {
    const carnet = await prisma.carnet.findFirst({
      where: {
        studentId,
        userId
      }
    });

    if (!carnet) {
      throw new Error('Carnet non trouvé');
    }

    await prisma.carnet.delete({
      where: { id: carnet.id }
    });

    return { success: true, message: 'Carnet supprimé avec succès' };
  }
}

export const carnetsService = new CarnetsService();
