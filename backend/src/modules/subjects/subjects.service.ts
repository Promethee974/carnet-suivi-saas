import { prisma } from '../../config/database.js';

export class SubjectsService {
  /**
   * Récupérer toutes les matières d'un utilisateur pour une année scolaire avec l'arborescence complète
   */
  static async getAll(userId: string, schoolYearId: string) {
    const subjects = await prisma.subject.findMany({
      where: { userId, schoolYearId },
      include: {
        domains: {
          include: {
            subDomains: {
              include: {
                skills: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
            skills: {
              where: { subDomainId: null },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return subjects;
  }

  /**
   * Récupérer une matière par son ID
   */
  static async getById(id: string, userId: string) {
    const subject = await prisma.subject.findFirst({
      where: { id, userId },
      include: {
        domains: {
          include: {
            subDomains: {
              include: {
                skills: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
            skills: {
              where: { subDomainId: null },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!subject) {
      throw new Error('Matière introuvable');
    }

    return subject;
  }

  /**
   * Créer une nouvelle matière
   */
  static async createSubject(userId: string, schoolYearId: string, data: {
    name: string;
    color?: string;
    isTransversal?: boolean;
  }) {
    // Récupérer l'ordre max actuel pour cette année scolaire
    const maxOrder = await prisma.subject.aggregate({
      where: { userId, schoolYearId },
      _max: { order: true },
    });

    const subject = await prisma.subject.create({
      data: {
        userId,
        schoolYearId,
        name: data.name,
        color: data.color || 'bg-gray-500',
        isTransversal: data.isTransversal || false,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return subject;
  }

  /**
   * Mettre à jour une matière
   */
  static async updateSubject(id: string, userId: string, data: {
    name?: string;
    color?: string;
    isTransversal?: boolean;
    order?: number;
  }) {
    // Vérifier que la matière appartient à l'utilisateur
    const existing = await prisma.subject.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Matière introuvable');
    }

    const subject = await prisma.subject.update({
      where: { id },
      data,
    });

    return subject;
  }

  /**
   * Supprimer une matière
   */
  static async deleteSubject(id: string, userId: string) {
    // Vérifier que la matière appartient à l'utilisateur
    const existing = await prisma.subject.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Matière introuvable');
    }

    await prisma.subject.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Créer un nouveau domaine dans une matière
   */
  static async createDomain(subjectId: string, userId: string, data: {
    name: string;
  }) {
    // Vérifier que la matière appartient à l'utilisateur
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!subject) {
      throw new Error('Matière introuvable');
    }

    // Récupérer l'ordre max actuel
    const maxOrder = await prisma.domain.aggregate({
      where: { subjectId },
      _max: { order: true },
    });

    const domain = await prisma.domain.create({
      data: {
        subjectId,
        name: data.name,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return domain;
  }

  /**
   * Mettre à jour un domaine
   */
  static async updateDomain(id: string, userId: string, data: {
    name?: string;
    order?: number;
  }) {
    // Vérifier que le domaine appartient à l'utilisateur
    const domain = await prisma.domain.findFirst({
      where: {
        id,
        subject: { userId },
      },
    });

    if (!domain) {
      throw new Error('Domaine introuvable');
    }

    const updated = await prisma.domain.update({
      where: { id },
      data,
    });

    return updated;
  }

  /**
   * Supprimer un domaine
   */
  static async deleteDomain(id: string, userId: string) {
    // Vérifier que le domaine appartient à l'utilisateur
    const domain = await prisma.domain.findFirst({
      where: {
        id,
        subject: { userId },
      },
    });

    if (!domain) {
      throw new Error('Domaine introuvable');
    }

    await prisma.domain.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Créer un nouveau sous-domaine dans un domaine
   */
  static async createSubDomain(domainId: string, userId: string, data: {
    name: string;
  }) {
    // Vérifier que le domaine appartient à l'utilisateur
    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        subject: { userId },
      },
    });

    if (!domain) {
      throw new Error('Domaine introuvable');
    }

    // Récupérer l'ordre max actuel
    const maxOrder = await prisma.subDomain.aggregate({
      where: { domainId },
      _max: { order: true },
    });

    const subDomain = await prisma.subDomain.create({
      data: {
        domainId,
        name: data.name,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return subDomain;
  }

  /**
   * Mettre à jour un sous-domaine
   */
  static async updateSubDomain(id: string, userId: string, data: {
    name?: string;
    order?: number;
  }) {
    // Vérifier que le sous-domaine appartient à l'utilisateur
    const subDomain = await prisma.subDomain.findFirst({
      where: {
        id,
        domain: {
          subject: { userId },
        },
      },
    });

    if (!subDomain) {
      throw new Error('Sous-domaine introuvable');
    }

    const updated = await prisma.subDomain.update({
      where: { id },
      data,
    });

    return updated;
  }

  /**
   * Supprimer un sous-domaine
   */
  static async deleteSubDomain(id: string, userId: string) {
    // Vérifier que le sous-domaine appartient à l'utilisateur
    const subDomain = await prisma.subDomain.findFirst({
      where: {
        id,
        domain: {
          subject: { userId },
        },
      },
    });

    if (!subDomain) {
      throw new Error('Sous-domaine introuvable');
    }

    await prisma.subDomain.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Créer une nouvelle compétence (dans un domaine ou sous-domaine)
   */
  static async createSkill(userId: string, data: {
    text: string;
    domainId?: string;
    subDomainId?: string;
  }) {
    // Vérifier que soit domainId soit subDomainId est fourni
    if (!data.domainId && !data.subDomainId) {
      throw new Error('domainId ou subDomainId requis');
    }

    if (data.domainId && data.subDomainId) {
      throw new Error('Fournir soit domainId soit subDomainId, pas les deux');
    }

    // Vérifier les permissions
    if (data.domainId) {
      const domain = await prisma.domain.findFirst({
        where: {
          id: data.domainId,
          subject: { userId },
        },
      });
      if (!domain) {
        throw new Error('Domaine introuvable');
      }
    }

    if (data.subDomainId) {
      const subDomain = await prisma.subDomain.findFirst({
        where: {
          id: data.subDomainId,
          domain: {
            subject: { userId },
          },
        },
      });
      if (!subDomain) {
        throw new Error('Sous-domaine introuvable');
      }
    }

    // Récupérer l'ordre max actuel
    const where = data.domainId
      ? { domainId: data.domainId, subDomainId: null }
      : { subDomainId: data.subDomainId };

    const maxOrder = await prisma.skill.aggregate({
      where,
      _max: { order: true },
    });

    const skill = await prisma.skill.create({
      data: {
        text: data.text,
        domainId: data.domainId || null,
        subDomainId: data.subDomainId || null,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return skill;
  }

  /**
   * Mettre à jour une compétence
   */
  static async updateSkill(id: string, userId: string, data: {
    text?: string;
    order?: number;
  }) {
    // Vérifier que la compétence appartient à l'utilisateur
    const skill = await prisma.skill.findFirst({
      where: {
        id,
        OR: [
          {
            domain: {
              subject: { userId },
            },
          },
          {
            subDomain: {
              domain: {
                subject: { userId },
              },
            },
          },
        ],
      },
    });

    if (!skill) {
      throw new Error('Compétence introuvable');
    }

    const updated = await prisma.skill.update({
      where: { id },
      data,
    });

    return updated;
  }

  /**
   * Supprimer une compétence
   */
  static async deleteSkill(id: string, userId: string) {
    // Vérifier que la compétence appartient à l'utilisateur
    const skill = await prisma.skill.findFirst({
      where: {
        id,
        OR: [
          {
            domain: {
              subject: { userId },
            },
          },
          {
            subDomain: {
              domain: {
                subject: { userId },
              },
            },
          },
        ],
      },
    });

    if (!skill) {
      throw new Error('Compétence introuvable');
    }

    await prisma.skill.delete({
      where: { id },
    });

    return { success: true };
  }
}
