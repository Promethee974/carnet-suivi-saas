import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { SchoolYearsService } from '../school-years/school-years.service.js';

export interface CreateStudentDto {
  nom: string;
  prenom: string;
  sexe?: 'F' | 'M' | 'AUTRE' | 'ND';
  naissance?: string; // ISO date string
  photoUrl?: string;
  organizationId?: string;
}

export interface UpdateStudentDto {
  nom?: string;
  prenom?: string;
  sexe?: 'F' | 'M' | 'AUTRE' | 'ND';
  naissance?: string; // ISO date string
  photoUrl?: string;
  organizationId?: string;
}

export class StudentsService {
  /**
   * Récupérer tous les élèves d'un utilisateur
   * Filtrés par année scolaire active si elle existe
   */
  async getStudentsByUser(userId: string) {
    // Récupérer l'année scolaire active
    const activeYear = await SchoolYearsService.getActive(userId);

    const students = await prisma.student.findMany({
      where: {
        userId,
        // Filtrer par année scolaire active si elle existe
        ...(activeYear ? { schoolYearId: activeYear.id } : {})
      },
      orderBy: [
        { nom: 'asc' },
        { prenom: 'asc' }
      ],
      include: {
        carnets: {
          select: {
            id: true,
            updatedAt: true
          }
        },
        photos: {
          select: {
            id: true
          }
        },
        _count: {
          select: {
            photos: true,
            tempPhotos: true
          }
        }
      }
    });

    return students;
  }

  /**
   * Récupérer un élève par ID
   */
  async getStudentById(studentId: string, userId: string) {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        userId
      },
      include: {
        carnets: true,
        photos: {
          orderBy: { createdAt: 'desc' }
        },
        tempPhotos: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            photos: true,
            tempPhotos: true
          }
        }
      }
    });

    if (!student) {
      throw new Error('Élève non trouvé');
    }

    return student;
  }

  /**
   * Créer un nouvel élève
   * Lié à l'année scolaire active si elle existe
   */
  async createStudent(userId: string, data: CreateStudentDto) {
    // Récupérer l'année scolaire active pour lier l'élève
    const activeYear = await SchoolYearsService.getActive(userId);

    const studentData: Prisma.StudentCreateInput = {
      nom: data.nom.trim(),
      prenom: data.prenom.trim(),
      sexe: data.sexe,
      photoUrl: data.photoUrl,
      user: {
        connect: { id: userId }
      }
    };

    // Lier à l'année scolaire active si elle existe
    if (activeYear) {
      studentData.schoolYear = {
        connect: { id: activeYear.id }
      };
    }

    // Ajouter la date de naissance si fournie
    if (data.naissance) {
      studentData.naissance = new Date(data.naissance);
    }

    // Ajouter l'organisation si fournie
    if (data.organizationId) {
      studentData.organization = {
        connect: { id: data.organizationId }
      };
    }

    const student = await prisma.student.create({
      data: studentData,
      include: {
        carnets: true,
        _count: {
          select: {
            photos: true,
            tempPhotos: true
          }
        }
      }
    });

    return student;
  }

  /**
   * Mettre à jour un élève
   */
  async updateStudent(studentId: string, userId: string, data: UpdateStudentDto) {
    // Vérifier que l'élève appartient à l'utilisateur
    const existing = await prisma.student.findFirst({
      where: {
        id: studentId,
        userId
      }
    });

    if (!existing) {
      throw new Error('Élève non trouvé');
    }

    const updateData: Prisma.StudentUpdateInput = {};

    if (data.nom !== undefined) updateData.nom = data.nom.trim();
    if (data.prenom !== undefined) updateData.prenom = data.prenom.trim();
    if (data.sexe !== undefined) updateData.sexe = data.sexe;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

    if (data.naissance !== undefined) {
      updateData.naissance = data.naissance ? new Date(data.naissance) : null;
    }

    if (data.organizationId !== undefined) {
      if (data.organizationId) {
        updateData.organization = {
          connect: { id: data.organizationId }
        };
      } else {
        updateData.organization = {
          disconnect: true
        };
      }
    }

    const student = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
      include: {
        carnets: true,
        _count: {
          select: {
            photos: true,
            tempPhotos: true
          }
        }
      }
    });

    return student;
  }

  /**
   * Supprimer un élève (et toutes ses données associées)
   */
  async deleteStudent(studentId: string, userId: string) {
    // Vérifier que l'élève appartient à l'utilisateur
    const existing = await prisma.student.findFirst({
      where: {
        id: studentId,
        userId
      }
    });

    if (!existing) {
      throw new Error('Élève non trouvé');
    }

    // Prisma cascade delete s'occupe de supprimer :
    // - carnets
    // - photos
    // - tempPhotos
    await prisma.student.delete({
      where: { id: studentId }
    });

    return { success: true, message: 'Élève supprimé avec succès' };
  }

  /**
   * Rechercher des élèves
   */
  async searchStudents(userId: string, query: string) {
    const students = await prisma.student.findMany({
      where: {
        userId,
        OR: [
          { nom: { contains: query, mode: 'insensitive' } },
          { prenom: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: [
        { nom: 'asc' },
        { prenom: 'asc' }
      ],
      include: {
        _count: {
          select: {
            photos: true,
            tempPhotos: true
          }
        }
      }
    });

    return students;
  }

  /**
   * Obtenir les statistiques d'un élève
   */
  async getStudentStats(studentId: string, userId: string) {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        userId
      },
      include: {
        carnets: {
          select: {
            skills: true,
            progress: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            photos: true,
            tempPhotos: true
          }
        }
      }
    });

    if (!student) {
      throw new Error('Élève non trouvé');
    }

    // Calculer les stats
    const carnet = student.carnets[0]; // Un élève a un seul carnet
    const stats = {
      studentId: student.id,
      nom: student.nom,
      prenom: student.prenom,
      photosCount: student._count.photos,
      tempPhotosCount: student._count.tempPhotos,
      carnetProgress: carnet?.progress || null,
      lastUpdated: carnet?.updatedAt || student.updatedAt
    };

    return stats;
  }

  /**
   * Obtenir les statistiques globales pour le dashboard
   * Filtrées par année scolaire active si elle existe
   */
  async getDashboardStats(userId: string) {
    // Récupérer l'année scolaire active
    const activeYear = await SchoolYearsService.getActive(userId);

    // Récupérer tous les élèves avec leurs carnets
    const students = await prisma.student.findMany({
      where: {
        userId,
        // Filtrer par année scolaire active si elle existe
        ...(activeYear ? { schoolYearId: activeYear.id } : {})
      },
      include: {
        carnets: {
          select: {
            id: true,
            skills: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            photos: true,
            tempPhotos: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Calculer les statistiques globales
    const totalStudents = students.length;
    const totalPhotos = students.reduce((sum, s) => sum + s._count.photos, 0);
    const totalTempPhotos = students.reduce((sum, s) => sum + s._count.tempPhotos, 0);

    // Statistiques de compétences
    let totalSkills = 0;
    let acquiredSkills = 0;
    let inProgressSkills = 0;
    let notAcquiredSkills = 0;
    let notEvaluatedSkills = 0;

    students.forEach(student => {
      const carnet = student.carnets[0];
      if (carnet && carnet.skills) {
        const skills = carnet.skills as Record<string, any>;
        Object.values(skills).forEach((domain: any) => {
          if (domain && typeof domain === 'object') {
            Object.values(domain).forEach((skill: any) => {
              if (skill && typeof skill === 'object' && 'status' in skill) {
                totalSkills++;
                const status = skill.status;
                if (status === 'A') acquiredSkills++;
                else if (status === 'EC') inProgressSkills++;
                else if (status === 'NA') notAcquiredSkills++;
                else notEvaluatedSkills++;
              }
            });
          }
        });
      }
    });

    // Élèves récemment mis à jour (5 derniers)
    const recentStudents = students.slice(0, 5).map(s => ({
      id: s.id,
      nom: s.nom,
      prenom: s.prenom,
      photoUrl: s.photoUrl,
      updatedAt: s.updatedAt,
      photosCount: s._count.photos
    }));

    return {
      overview: {
        totalStudents,
        totalPhotos,
        totalTempPhotos,
        totalSkills,
        evaluatedSkills: totalSkills - notEvaluatedSkills
      },
      skillsBreakdown: {
        acquired: acquiredSkills,
        inProgress: inProgressSkills,
        notAcquired: notAcquiredSkills,
        notEvaluated: notEvaluatedSkills
      },
      recentStudents
    };
  }
}

export const studentsService = new StudentsService();
