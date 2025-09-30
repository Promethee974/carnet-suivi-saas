import { SkillEntry, ProgressStats } from '../data/schema.js';
import { DOMAINS } from '../data/skills.js';

export function calculateDomainProgress(domainId: string, skills: Record<string, SkillEntry>): ProgressStats {
  const domain = DOMAINS.find(d => d.id === domainId);
  if (!domain) {
    return { total: 0, acquired: 0, inProgress: 0, notAcquired: 0, percentage: 0 };
  }

  const domainSkills = domain.skills.map(skill => skills[skill.id]).filter(Boolean);
  
  const total = domainSkills.length;
  const acquired = domainSkills.filter(skill => skill.status === 'A').length;
  const inProgress = domainSkills.filter(skill => skill.status === 'EC').length;
  const notAcquired = domainSkills.filter(skill => skill.status === 'NA').length;
  
  const percentage = total > 0 ? Math.round((acquired / total) * 100) : 0;

  return {
    total,
    acquired,
    inProgress,
    notAcquired,
    percentage
  };
}

export function calculateOverallProgress(skills: Record<string, SkillEntry>): ProgressStats {
  const allSkills = Object.values(skills);
  
  const total = allSkills.length;
  const acquired = allSkills.filter(skill => skill.status === 'A').length;
  const inProgress = allSkills.filter(skill => skill.status === 'EC').length;
  const notAcquired = allSkills.filter(skill => skill.status === 'NA').length;
  
  const percentage = total > 0 ? Math.round((acquired / total) * 100) : 0;

  return {
    total,
    acquired,
    inProgress,
    notAcquired,
    percentage
  };
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'A': return 'Acquis';
    case 'EC': return 'En cours';
    case 'NA': return 'Non acquis';
    default: return 'Non évalué';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'A': return 'text-green-600 bg-green-100';
    case 'EC': return 'text-blue-600 bg-blue-100';
    case 'NA': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function calculatePeriodProgress(skills: Record<string, SkillEntry>, currentPeriod: string): ProgressStats {
  // Filtrer les compétences évaluées dans la période actuelle
  const periodSkills = Object.values(skills).filter(skill => 
    skill.period === currentPeriod && skill.status !== ''
  );
  
  const total = periodSkills.length;
  const acquired = periodSkills.filter(skill => skill.status === 'A').length;
  const inProgress = periodSkills.filter(skill => skill.status === 'EC').length;
  const notAcquired = periodSkills.filter(skill => skill.status === 'NA').length;
  
  const percentage = total > 0 ? Math.round((acquired / total) * 100) : 0;

  return {
    total,
    acquired,
    inProgress,
    notAcquired,
    percentage
  };
}
