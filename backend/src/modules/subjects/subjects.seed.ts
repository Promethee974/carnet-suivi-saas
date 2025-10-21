import { prisma } from '../../config/database.js';

/**
 * Initialiser le programme avec les données par défaut pour un utilisateur et une année scolaire
 */
export async function seedDefaultProgram(userId: string, schoolYearId: string) {
  // Vérifier si l'utilisateur a déjà des matières pour cette année scolaire
  const existingSubjects = await prisma.subject.count({ where: { userId, schoolYearId } });
  if (existingSubjects > 0) {
    throw new Error('Le programme est déjà initialisé pour cette classe');
  }

  // Créer les matières avec leurs domaines et compétences
  const subjects = [
    {
      name: 'Développement et structuration du langage',
      color: 'bg-blue-500',
      order: 1,
      domains: [
        {
          name: 'Langage oral et écrit',
          order: 1,
          skills: [
            { text: 'S\'exprimer clairement à l\'oral', order: 1 },
            { text: 'Comprendre et répondre à des consignes', order: 2 },
            { text: 'Participer à des échanges collectifs', order: 3 },
            { text: 'Enrichir son vocabulaire', order: 4 },
            { text: 'Repérer et manipuler syllabes, rimes, sons d\'attaque', order: 5 },
            { text: 'Reconnaître son prénom et quelques mots familiers', order: 6 },
            { text: 'Copier / écrire son prénom en cursive', order: 7 },
            { text: 'Découvrir les fonctions de l\'écrit (listes, étiquettes, affiches)', order: 8 },
          ],
        },
      ],
    },
    {
      name: 'Premiers outils mathématiques',
      color: 'bg-red-500',
      order: 2,
      domains: [
        {
          name: 'Nombres et quantités',
          order: 1,
          skills: [
            { text: 'Dénombrer jusqu\'à 10 puis 20 objets', order: 1 },
            { text: 'Connaître la suite numérique (au moins jusqu\'à 30)', order: 2 },
            { text: 'Comparer des collections (plus, moins, autant)', order: 3 },
            { text: 'Résoudre de petits problèmes avec les nombres', order: 4 },
          ],
        },
        {
          name: 'Formes et grandeurs',
          order: 2,
          skills: [
            { text: 'Se familiariser avec les motifs et régularités', order: 1 },
            { text: 'Identifier des formes planes simples (carré, cercle, triangle)', order: 2 },
            { text: 'Reconnaître et nommer des solides (cube, boule, cylindre)', order: 3 },
            { text: 'Explorer les grandeurs : longueurs, masses, contenances', order: 4 },
            { text: 'Classer, ranger des objets selon une propriété', order: 5 },
          ],
        },
      ],
    },
    {
      name: 'Activité physique',
      color: 'bg-orange-500',
      order: 3,
      domains: [
        {
          name: 'Motricité',
          order: 1,
          skills: [
            { text: 'Courir, sauter, lancer avec aisance', order: 1 },
            { text: 'Coopérer dans des jeux collectifs et respecter les règles', order: 2 },
            { text: 'Réaliser un parcours moteur en enchaînant des actions', order: 3 },
            { text: 'Développer équilibre et coordination', order: 4 },
          ],
        },
      ],
    },
    {
      name: 'Activités artistiques',
      color: 'bg-purple-500',
      order: 4,
      domains: [
        {
          name: 'Arts visuels et musique',
          order: 1,
          skills: [
            { text: 'Expérimenter différentes techniques plastiques', order: 1 },
            { text: 'Produire des compositions individuelles ou collectives', order: 2 },
            { text: 'Chanter et mémoriser comptines et chansons', order: 3 },
            { text: 'Explorer la musique, les sons, les rythmes', order: 4 },
            { text: 'Participer à une activité de danse ou de théâtre', order: 5 },
          ],
        },
      ],
    },
    {
      name: 'Explorer le monde',
      color: 'bg-green-500',
      order: 5,
      domains: [
        {
          name: 'Temps et espace',
          order: 1,
          skills: [
            { text: 'Se repérer dans le temps (jour, semaine, saisons)', order: 1 },
            { text: 'Se repérer dans l\'espace (classe, école, quartier, plan simple)', order: 2 },
          ],
        },
        {
          name: 'Vivant et matière',
          order: 2,
          skills: [
            { text: 'Observer et décrire des phénomènes naturels', order: 1 },
            { text: 'Découvrir le vivant, la matière, les objets techniques simples', order: 2 },
            { text: 'Utiliser un support numérique de manière encadrée', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Vie de classe et autonomie',
      color: 'bg-gray-500',
      order: 6,
      isTransversal: true,
      domains: [
        {
          name: 'Compétences transversales',
          order: 1,
          skills: [
            { text: 'Respecter les règles de vie collective', order: 1 },
            { text: 'Prendre soin du matériel', order: 2 },
            { text: 'S\'habiller / se déshabiller seul', order: 3 },
            { text: 'Travailler seul sur une tâche courte', order: 4 },
            { text: 'Coopérer avec ses pairs', order: 5 },
            { text: 'Exprimer et reconnaître ses émotions', order: 6 },
          ],
        },
      ],
    },
  ];

  // Créer toutes les matières avec leurs domaines et compétences
  for (const subjectData of subjects) {
    const subject = await prisma.subject.create({
      data: {
        userId,
        schoolYearId,
        name: subjectData.name,
        color: subjectData.color,
        order: subjectData.order,
        isTransversal: subjectData.isTransversal || false,
      },
    });

    // Créer les domaines et compétences pour cette matière
    for (const domainData of subjectData.domains) {
      const domain = await prisma.domain.create({
        data: {
          subjectId: subject.id,
          name: domainData.name,
          order: domainData.order,
        },
      });

      // Créer les compétences pour ce domaine
      for (const skillData of domainData.skills) {
        await prisma.skill.create({
          data: {
            domainId: domain.id,
            text: skillData.text,
            order: skillData.order,
          },
        });
      }
    }
  }

  console.log(`✅ Programme initialisé avec succès pour l'utilisateur ${userId}`);
}
