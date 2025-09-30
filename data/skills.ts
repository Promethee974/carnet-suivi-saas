import { Domain } from './schema.js';

export const DOMAINS: Domain[] = [
  {
    id: 'langage',
    name: 'Développement et structuration du langage oral et écrit',
    color: 'bg-blue-500',
    skills: [
      { id: 'lang1', text: 'S\'exprimer clairement à l\'oral', domainId: 'langage' },
      { id: 'lang2', text: 'Comprendre et répondre à des consignes', domainId: 'langage' },
      { id: 'lang3', text: 'Participer à des échanges collectifs', domainId: 'langage' },
      { id: 'lang4', text: 'Enrichir son vocabulaire', domainId: 'langage' },
      { id: 'lang5', text: 'Repérer et manipuler syllabes, rimes, sons d\'attaque', domainId: 'langage' },
      { id: 'lang6', text: 'Reconnaître son prénom et quelques mots familiers', domainId: 'langage' },
      { id: 'lang7', text: 'Copier / écrire son prénom en cursive', domainId: 'langage' },
      { id: 'lang8', text: 'Découvrir les fonctions de l\'écrit (listes, étiquettes, affiches)', domainId: 'langage' }
    ]
  },
  {
    id: 'mathematiques',
    name: 'Acquisition des premiers outils mathématiques',
    color: 'bg-red-500',
    skills: [
      { id: 'math1', text: 'Dénombrer jusqu\'à 10 puis 20 objets', domainId: 'mathematiques' },
      { id: 'math2', text: 'Connaître la suite numérique (au moins jusqu\'à 30)', domainId: 'mathematiques' },
      { id: 'math3', text: 'Comparer des collections (plus, moins, autant)', domainId: 'mathematiques' },
      { id: 'math4', text: 'Résoudre de petits problèmes avec les nombres', domainId: 'mathematiques' },
      { id: 'math5', text: 'Se familiariser avec les motifs et régularités', domainId: 'mathematiques' },
      { id: 'math6', text: 'Identifier des formes planes simples (carré, cercle, triangle)', domainId: 'mathematiques' },
      { id: 'math7', text: 'Reconnaître et nommer des solides (cube, boule, cylindre)', domainId: 'mathematiques' },
      { id: 'math8', text: 'Explorer les grandeurs : longueurs, masses, contenances', domainId: 'mathematiques' },
      { id: 'math9', text: 'Classer, ranger des objets selon une propriété', domainId: 'mathematiques' }
    ]
  },
  {
    id: 'activite-physique',
    name: 'Agir, s\'exprimer, comprendre à travers l\'activité physique',
    color: 'bg-orange-500',
    skills: [
      { id: 'phys1', text: 'Courir, sauter, lancer avec aisance', domainId: 'activite-physique' },
      { id: 'phys2', text: 'Coopérer dans des jeux collectifs et respecter les règles', domainId: 'activite-physique' },
      { id: 'phys3', text: 'Réaliser un parcours moteur en enchaînant des actions', domainId: 'activite-physique' },
      { id: 'phys4', text: 'Développer équilibre et coordination', domainId: 'activite-physique' }
    ]
  },
  {
    id: 'activites-artistiques',
    name: 'Agir, s\'exprimer, comprendre à travers les activités artistiques',
    color: 'bg-purple-500',
    skills: [
      { id: 'art1', text: 'Expérimenter différentes techniques plastiques', domainId: 'activites-artistiques' },
      { id: 'art2', text: 'Produire des compositions individuelles ou collectives', domainId: 'activites-artistiques' },
      { id: 'art3', text: 'Chanter et mémoriser comptines et chansons', domainId: 'activites-artistiques' },
      { id: 'art4', text: 'Explorer la musique, les sons, les rythmes', domainId: 'activites-artistiques' },
      { id: 'art5', text: 'Participer à une activité de danse ou de théâtre', domainId: 'activites-artistiques' }
    ]
  },
  {
    id: 'explorer-monde',
    name: 'Explorer le monde',
    color: 'bg-green-500',
    skills: [
      { id: 'monde1', text: 'Se repérer dans le temps (jour, semaine, saisons)', domainId: 'explorer-monde' },
      { id: 'monde2', text: 'Se repérer dans l\'espace (classe, école, quartier, plan simple)', domainId: 'explorer-monde' },
      { id: 'monde3', text: 'Observer et décrire des phénomènes naturels', domainId: 'explorer-monde' },
      { id: 'monde4', text: 'Découvrir le vivant, la matière, les objets techniques simples', domainId: 'explorer-monde' },
      { id: 'monde5', text: 'Utiliser un support numérique de manière encadrée', domainId: 'explorer-monde' }
    ]
  }
];

// Domaine transversal optionnel
export const TRANSVERSAL_DOMAIN: Domain = {
  id: 'transversal',
  name: 'Vie de classe et autonomie',
  color: 'bg-gray-500',
  skills: [
    { id: 'trans1', text: 'Respecter les règles de vie collective', domainId: 'transversal' },
    { id: 'trans2', text: 'Prendre soin du matériel', domainId: 'transversal' },
    { id: 'trans3', text: 'S\'habiller / se déshabiller seul', domainId: 'transversal' },
    { id: 'trans4', text: 'Travailler seul sur une tâche courte', domainId: 'transversal' },
    { id: 'trans5', text: 'Coopérer avec ses pairs', domainId: 'transversal' },
    { id: 'trans6', text: 'Exprimer et reconnaître ses émotions', domainId: 'transversal' }
  ]
};

export function getDomainById(id: string): Domain | undefined {
  const allDomains = [...DOMAINS, TRANSVERSAL_DOMAIN];
  return allDomains.find(domain => domain.id === id);
}

export function getSkillById(id: string): { skill: any; domain: Domain } | undefined {
  const allDomains = [...DOMAINS, TRANSVERSAL_DOMAIN];
  for (const domain of allDomains) {
    const skill = domain.skills.find(s => s.id === id);
    if (skill) {
      return { skill, domain };
    }
  }
  return undefined;
}

export function getAllSkills(includeTransversal: boolean = false) {
  const domains = includeTransversal ? [...DOMAINS, TRANSVERSAL_DOMAIN] : DOMAINS;
  return domains.flatMap(domain => domain.skills);
}

export function getAllDomains(includeTransversal: boolean = false): Domain[] {
  return includeTransversal ? [...DOMAINS, TRANSVERSAL_DOMAIN] : DOMAINS;
}
