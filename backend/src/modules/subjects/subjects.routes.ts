import { Router } from 'express';
import { SubjectsService } from './subjects.service.js';
import { seedDefaultProgram } from './subjects.seed.js';
import { authenticate } from '../../middleware/auth.middleware.js';

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
router.post('/seed', async (req, res) => {
  try {
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
  } catch (error: any) {
    console.error('Erreur seed programme:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Erreur lors de l\'initialisation du programme',
    });
  }
});

// ============================================
// MATIÈRES (SUBJECTS)
// ============================================

/**
 * GET /api/subjects?schoolYearId=xxx&format=carnet
 * Récupérer toutes les matières avec arborescence complète pour une année scolaire
 * Si format=carnet, retourne le format spécifique pour le carnet de suivi
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { schoolYearId, format } = req.query;

    if (!schoolYearId || typeof schoolYearId !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'L\'ID de la classe est requis',
      });
    }

    const subjects = await SubjectsService.getAll(userId, schoolYearId);

    // Si format=carnet, formater le programme pour le carnet de suivi
    if (format === 'carnet') {
      const domains = subjects.map(subject => {
        // Collecter toutes les compétences (skills) du sujet
        const allSkills: any[] = [];

        subject.domains.forEach(domain => {
          // Compétences directes du domaine
          domain.skills.forEach(skill => {
            allSkills.push({
              id: skill.id,
              text: skill.text,
              domainId: subject.id,
              subDomainId: domain.id,
            });
          });

          // Compétences des sous-domaines
          domain.subDomains.forEach(subDomain => {
            subDomain.skills.forEach(skill => {
              allSkills.push({
                id: skill.id,
                text: skill.text,
                domainId: subject.id,
                subDomainId: subDomain.id,
              });
            });
          });
        });

        return {
          id: subject.id,
          name: subject.name,
          color: subject.color,
          skills: allSkills,
        };
      });

      return res.json({
        status: 'success',
        data: domains,
      });
    }

    // Format normal
    res.json({
      status: 'success',
      data: subjects,
    });
  } catch (error: any) {
    console.error('Erreur récupération matières:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la récupération des matières',
    });
  }
});

/**
 * GET /api/subjects/:id
 * Récupérer une matière par son ID
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const subject = await SubjectsService.getById(id, userId);

    res.json({
      status: 'success',
      data: subject,
    });
  } catch (error: any) {
    console.error('Erreur récupération matière:', error);
    res.status(error.message === 'Matière introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la récupération de la matière',
    });
  }
});

/**
 * POST /api/subjects
 * Créer une nouvelle matière
 * Body: { name, schoolYearId, color?, isTransversal? }
 */
router.post('/', async (req, res) => {
  try {
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
  } catch (error: any) {
    console.error('Erreur création matière:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la création de la matière',
    });
  }
});

/**
 * PATCH /api/subjects/:id
 * Mettre à jour une matière
 */
router.patch('/:id', async (req, res) => {
  try {
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
  } catch (error: any) {
    console.error('Erreur mise à jour matière:', error);
    res.status(error.message === 'Matière introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la mise à jour de la matière',
    });
  }
});

/**
 * DELETE /api/subjects/:id
 * Supprimer une matière
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await SubjectsService.deleteSubject(id, userId);

    res.json({
      status: 'success',
      message: 'Matière supprimée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur suppression matière:', error);
    res.status(error.message === 'Matière introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la suppression de la matière',
    });
  }
});

// ============================================
// DOMAINES
// ============================================

/**
 * POST /api/subjects/:subjectId/domains
 * Créer un nouveau domaine dans une matière
 */
router.post('/:subjectId/domains', async (req, res) => {
  try {
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
  } catch (error: any) {
    console.error('Erreur création domaine:', error);
    res.status(error.message === 'Matière introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la création du domaine',
    });
  }
});

/**
 * PATCH /api/domains/:id
 * Mettre à jour un domaine
 */
router.patch('/domains/:id', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, order } = req.body;

    const domain = await SubjectsService.updateDomain(id, userId, { name, order });

    res.json({
      status: 'success',
      data: domain,
    });
  } catch (error: any) {
    console.error('Erreur mise à jour domaine:', error);
    res.status(error.message === 'Domaine introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la mise à jour du domaine',
    });
  }
});

/**
 * DELETE /api/domains/:id
 * Supprimer un domaine
 */
router.delete('/domains/:id', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await SubjectsService.deleteDomain(id, userId);

    res.json({
      status: 'success',
      message: 'Domaine supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Erreur suppression domaine:', error);
    res.status(error.message === 'Domaine introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la suppression du domaine',
    });
  }
});

// ============================================
// SOUS-DOMAINES
// ============================================

/**
 * POST /api/domains/:domainId/subdomains
 * Créer un nouveau sous-domaine dans un domaine
 */
router.post('/domains/:domainId/subdomains', async (req, res) => {
  try {
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
  } catch (error: any) {
    console.error('Erreur création sous-domaine:', error);
    res.status(error.message === 'Domaine introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la création du sous-domaine',
    });
  }
});

/**
 * PATCH /api/subdomains/:id
 * Mettre à jour un sous-domaine
 */
router.patch('/subdomains/:id', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, order } = req.body;

    const subDomain = await SubjectsService.updateSubDomain(id, userId, { name, order });

    res.json({
      status: 'success',
      data: subDomain,
    });
  } catch (error: any) {
    console.error('Erreur mise à jour sous-domaine:', error);
    res.status(error.message === 'Sous-domaine introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la mise à jour du sous-domaine',
    });
  }
});

/**
 * DELETE /api/subdomains/:id
 * Supprimer un sous-domaine
 */
router.delete('/subdomains/:id', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await SubjectsService.deleteSubDomain(id, userId);

    res.json({
      status: 'success',
      message: 'Sous-domaine supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Erreur suppression sous-domaine:', error);
    res.status(error.message === 'Sous-domaine introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la suppression du sous-domaine',
    });
  }
});

// ============================================
// COMPÉTENCES
// ============================================

/**
 * POST /api/skills
 * Créer une nouvelle compétence
 * Body: { text, domainId?, subDomainId? }
 */
router.post('/skills', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { text, domainId, subDomainId } = req.body;

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
    });

    res.status(201).json({
      status: 'success',
      data: skill,
    });
  } catch (error: any) {
    console.error('Erreur création compétence:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Erreur lors de la création de la compétence',
    });
  }
});

/**
 * PATCH /api/skills/:id
 * Mettre à jour une compétence
 */
router.patch('/skills/:id', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { text, order } = req.body;

    const skill = await SubjectsService.updateSkill(id, userId, { text, order });

    res.json({
      status: 'success',
      data: skill,
    });
  } catch (error: any) {
    console.error('Erreur mise à jour compétence:', error);
    res.status(error.message === 'Compétence introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la mise à jour de la compétence',
    });
  }
});

/**
 * DELETE /api/skills/:id
 * Supprimer une compétence
 */
router.delete('/skills/:id', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await SubjectsService.deleteSkill(id, userId);

    res.json({
      status: 'success',
      message: 'Compétence supprimée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur suppression compétence:', error);
    res.status(error.message === 'Compétence introuvable' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la suppression de la compétence',
    });
  }
});

export default router;
