import { Router } from 'express';
import { SubjectsService } from './subjects.service.js';
import { seedDefaultProgram } from './subjects.seed.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../middleware/error.middleware.js';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// ============================================
// UTILITAIRES
// ============================================

/**
 * POST /api/subjects/seed
 * Initialiser le programme avec les données par défaut
 * Body: { schoolYearId: string }
 */
router.post('/seed', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { schoolYearId } = req.body;

  if (!schoolYearId) {
    return res.status(400).json({
      status: 'error',
      message: 'L\'ID de la classe est requis',
    });
  }

  await seedDefaultProgram(userId, schoolYearId);

  res.json({
    status: 'success',
    message: 'Programme initialisé avec succès',
  });
}));

// ============================================
// MATIÈRES (SUBJECTS)
// ============================================

/**
 * GET /api/subjects?schoolYearId=xxx&format=carnet
 * Récupérer toutes les matières avec arborescence complète pour une année scolaire
 * Si format=carnet, retourne le format spécifique pour le carnet de suivi
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { schoolYearId, format } = req.query;

  if (!schoolYearId || typeof schoolYearId !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'L\'ID de la classe est requis',
    });
  }

  const subjects = await SubjectsService.getAll(userId, schoolYearId);

  // Si format=carnet, formater le programme pour le carnet de suivi avec structure hiérarchique
  if (format === 'carnet') {
    const formattedSubjects = subjects.map(subject => {
      const formattedDomains = subject.domains.map(domain => {
        const formattedSubDomains = domain.subDomains.map(subDomain => {
          const formattedObjectives = (subDomain.objectives || []).map(objective => ({
            id: objective.id,
            name: objective.name,
            order: objective.order,
            skills: objective.skills.map(skill => ({
              id: skill.id,
              text: skill.text,
              order: skill.order,
            })),
          }));

          return {
            id: subDomain.id,
            name: subDomain.name,
            order: subDomain.order,
            objectives: formattedObjectives,
            skills: subDomain.skills.map(skill => ({
              id: skill.id,
              text: skill.text,
              order: skill.order,
            })),
          };
        });

        return {
          id: domain.id,
          name: domain.name,
          order: domain.order,
          subDomains: formattedSubDomains,
          skills: domain.skills.map(skill => ({
            id: skill.id,
            text: skill.text,
            order: skill.order,
          })),
        };
      });

      return {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        order: subject.order,
        isTransversal: subject.isTransversal,
        domains: formattedDomains,
      };
    });

    return res.json({
      status: 'success',
      data: formattedSubjects,
    });
  }

  // Format normal
  res.json({
    status: 'success',
    data: subjects,
  });
}));

/**
 * GET /api/subjects/:id
 * Récupérer une matière par son ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const subject = await SubjectsService.getById(id, userId);

  res.json({
    status: 'success',
    data: subject,
  });
}));

/**
 * POST /api/subjects
 * Créer une nouvelle matière
 * Body: { name, schoolYearId, color?, isTransversal? }
 */
router.post('/', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { name, schoolYearId, color, isTransversal } = req.body;

  if (!name) {
    return res.status(400).json({
      status: 'error',
      message: 'Le nom de la matière est requis',
    });
  }

  if (!schoolYearId) {
    return res.status(400).json({
      status: 'error',
      message: 'L\'ID de la classe est requis',
    });
  }

  const subject = await SubjectsService.createSubject(userId, schoolYearId, {
    name,
    color,
    isTransversal,
  });

  res.status(201).json({
    status: 'success',
    data: subject,
  });
}));

/**
 * PATCH /api/subjects/:id
 * Mettre à jour une matière
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { name, color, isTransversal, order } = req.body;

  const subject = await SubjectsService.updateSubject(id, userId, {
    name,
    color,
    isTransversal,
    order,
  });

  res.json({
    status: 'success',
    data: subject,
  });
}));

/**
 * DELETE /api/subjects/:id
 * Supprimer une matière
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  await SubjectsService.deleteSubject(id, userId);

  res.json({
    status: 'success',
    message: 'Matière supprimée avec succès',
  });
}));

// ============================================
// DOMAINES
// ============================================

/**
 * POST /api/subjects/:subjectId/domains
 * Créer un nouveau domaine dans une matière
 */
router.post('/:subjectId/domains', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { subjectId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      status: 'error',
      message: 'Le nom du domaine est requis',
    });
  }

  const domain = await SubjectsService.createDomain(subjectId, userId, { name });

  res.status(201).json({
    status: 'success',
    data: domain,
  });
}));

/**
 * PATCH /api/domains/:id
 * Mettre à jour un domaine
 */
router.patch('/domains/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { name, order } = req.body;

  const domain = await SubjectsService.updateDomain(id, userId, { name, order });

  res.json({
    status: 'success',
    data: domain,
  });
}));

/**
 * DELETE /api/domains/:id
 * Supprimer un domaine
 */
router.delete('/domains/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  await SubjectsService.deleteDomain(id, userId);

  res.json({
    status: 'success',
    message: 'Domaine supprimé avec succès',
  });
}));

// ============================================
// SOUS-DOMAINES
// ============================================

/**
 * POST /api/domains/:domainId/subdomains
 * Créer un nouveau sous-domaine dans un domaine
 */
router.post('/domains/:domainId/subdomains', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { domainId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      status: 'error',
      message: 'Le nom du sous-domaine est requis',
    });
  }

  const subDomain = await SubjectsService.createSubDomain(domainId, userId, { name });

  res.status(201).json({
    status: 'success',
    data: subDomain,
  });
}));

/**
 * PATCH /api/subdomains/:id
 * Mettre à jour un sous-domaine
 */
router.patch('/subdomains/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { name, order } = req.body;

  const subDomain = await SubjectsService.updateSubDomain(id, userId, { name, order });

  res.json({
    status: 'success',
    data: subDomain,
  });
}));

/**
 * DELETE /api/subdomains/:id
 * Supprimer un sous-domaine
 */
router.delete('/subdomains/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  await SubjectsService.deleteSubDomain(id, userId);

  res.json({
    status: 'success',
    message: 'Sous-domaine supprimé avec succès',
  });
}));

// ============================================
// OBJECTIFS
// ============================================

/**
 * POST /api/subdomains/:subDomainId/objectives
 * Créer un nouvel objectif dans un sous-domaine
 */
router.post('/subdomains/:subDomainId/objectives', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { subDomainId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      status: 'error',
      message: 'Le nom de l\'objectif est requis',
    });
  }

  const objective = await SubjectsService.createObjective(subDomainId, userId, { name });

  res.status(201).json({
    status: 'success',
    data: objective,
  });
}));

/**
 * PATCH /api/objectives/:id
 * Mettre à jour un objectif
 */
router.patch('/objectives/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { name, order } = req.body;

  const objective = await SubjectsService.updateObjective(id, userId, { name, order });

  res.json({
    status: 'success',
    data: objective,
  });
}));

/**
 * DELETE /api/objectives/:id
 * Supprimer un objectif
 */
router.delete('/objectives/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  await SubjectsService.deleteObjective(id, userId);

  res.json({
    status: 'success',
    message: 'Objectif supprimé avec succès',
  });
}));

// ============================================
// COMPÉTENCES
// ============================================

/**
 * POST /api/skills
 * Créer une nouvelle compétence
 * Body: { text, domainId?, subDomainId?, objectiveId? }
 */
router.post('/skills', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { text, domainId, subDomainId, objectiveId } = req.body;

  if (!text) {
    return res.status(400).json({
      status: 'error',
      message: 'Le texte de la compétence est requis',
    });
  }

  const skill = await SubjectsService.createSkill(userId, {
    text,
    domainId,
    subDomainId,
    objectiveId,
  });

  res.status(201).json({
    status: 'success',
    data: skill,
  });
}));

/**
 * PATCH /api/skills/:id
 * Mettre à jour une compétence
 */
router.patch('/skills/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { text, order } = req.body;

  const skill = await SubjectsService.updateSkill(id, userId, { text, order });

  res.json({
    status: 'success',
    data: skill,
  });
}));

/**
 * DELETE /api/skills/:id
 * Supprimer une compétence
 */
router.delete('/skills/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  await SubjectsService.deleteSkill(id, userId);

  res.json({
    status: 'success',
    message: 'Compétence supprimée avec succès',
  });
}));

export default router;
