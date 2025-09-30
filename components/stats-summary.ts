import { getCarnet, getSetting } from '../store/repo.js';
import { getAllDomains } from '../data/skills.js';
import { calculateOverallProgress, calculatePeriodProgress } from '../utils/progress.js';
import { ID } from '../data/schema.js';
import { eventManager } from '../utils/events.js';

export class StatsSummary extends HTMLElement {
  private studentId: ID = '';
  private eventListener: ((event: CustomEvent) => void) | null = null;

  static get observedAttributes() {
    return ['student-id'];
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === 'student-id' && value) {
      this.studentId = value;
      this.setupEventListeners();
      this.render();
    }
  }

  connectedCallback() {
    if (this.studentId) {
      this.setupEventListeners();
      this.render();
    }
  }

  disconnectedCallback() {
    // Nettoyer les écouteurs d'événements
    if (this.eventListener) {
      eventManager.off('skill-updated', this.eventListener);
      eventManager.off('carnet-updated', this.eventListener);
    }
  }

  private setupEventListeners() {
    // Supprimer l'ancien écouteur s'il existe
    if (this.eventListener) {
      eventManager.off('skill-updated', this.eventListener);
      eventManager.off('carnet-updated', this.eventListener);
    }

    // Créer un nouvel écouteur
    this.eventListener = (event: CustomEvent) => {
      const detail = event.detail;
      // Ne se mettre à jour que si c'est pour notre élève
      if (detail.studentId === this.studentId) {
        this.render();
      }
    };

    // Écouter les événements de mise à jour
    eventManager.on('skill-updated', this.eventListener);
    eventManager.on('carnet-updated', this.eventListener);
  }

  private getPeriodName(periode: string): string {
    const periods: Record<string, string> = {
      '1': 'Sept-Oct',
      '2': 'Nov-Déc',
      '3': 'Jan-Fév',
      '4': 'Mar-Avr',
      '5': 'Mai-Juin'
    };
    return periods[periode] || 'Inconnue';
  }

  async render() {
    if (!this.studentId) return;
    
    const carnet = await getCarnet(this.studentId);
    if (!carnet) return;

    const includeTransversal = await getSetting('includeTransversal') ?? false;
    const domains = getAllDomains(includeTransversal);
    const overallProgress = calculateOverallProgress(carnet.skills);
    const periodProgress = calculatePeriodProgress(carnet.skills, carnet.meta.periode);

    // Calculer les statistiques par domaine
    const domainStats = domains.map(domain => {
      const domainSkills = domain.skills.map(skill => carnet.skills[skill.id]).filter(Boolean);
      const acquired = domainSkills.filter(skill => skill.status === 'A').length;
      const inProgress = domainSkills.filter(skill => skill.status === 'EC').length;
      const notAcquired = domainSkills.filter(skill => skill.status === 'NA').length;
      const total = domainSkills.length;
      
      return {
        name: domain.name,
        color: domain.color,
        acquired,
        inProgress,
        notAcquired,
        total,
        percentage: total > 0 ? Math.round((acquired / total) * 100) : 0
      };
    });

    this.innerHTML = `
      <div class="card p-4 mb-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          Progression générale - Programmes 2025
        </h2>
        
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Statistiques globales -->
          <div>
            <h3 class="font-medium mb-3">Vue d'ensemble</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm">Compétences acquises</span>
                <span class="font-semibold text-green-600">${overallProgress.acquired}/${overallProgress.total}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">En cours d'acquisition</span>
                <span class="font-semibold text-blue-600">${overallProgress.inProgress}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Non acquises</span>
                <span class="font-semibold text-red-600">${overallProgress.notAcquired}</span>
              </div>
              <div class="mt-3 pt-3 border-t space-y-3">
                <div>
                  <div class="flex justify-between items-center">
                    <span class="font-medium">Progression globale</span>
                    <span class="font-bold text-lg ${overallProgress.percentage >= 80 ? 'text-green-600' : overallProgress.percentage >= 60 ? 'text-blue-600' : overallProgress.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}">${overallProgress.percentage}%</span>
                  </div>
                  <div class="progress-bar mt-2">
                    <div class="progress-fill ${overallProgress.percentage >= 80 ? 'bg-green-500' : overallProgress.percentage >= 60 ? 'bg-blue-500' : overallProgress.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}" style="width: ${overallProgress.percentage}%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between items-center">
                    <span class="font-medium">Période ${carnet.meta.periode} (${this.getPeriodName(carnet.meta.periode)})</span>
                    <span class="font-bold text-lg ${periodProgress.percentage >= 80 ? 'text-primary-600' : periodProgress.percentage >= 60 ? 'text-blue-600' : periodProgress.percentage >= 40 ? 'text-yellow-600' : 'text-orange-600'}">${periodProgress.percentage}%</span>
                  </div>
                  <div class="progress-bar mt-2">
                    <div class="progress-fill ${periodProgress.percentage >= 80 ? 'bg-primary-500' : periodProgress.percentage >= 60 ? 'bg-blue-500' : periodProgress.percentage >= 40 ? 'bg-yellow-500' : 'bg-orange-500'}" style="width: ${periodProgress.percentage}%"></div>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    ${periodProgress.acquired}/${periodProgress.total} compétences acquises cette période
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Répartition par domaine -->
          <div>
            <h3 class="font-medium mb-3">Répartition par domaine</h3>
            <div class="space-y-2">
              ${domainStats.map(stat => `
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded ${stat.color}"></div>
                    <span class="truncate">${stat.name.split(' ').slice(0, 3).join(' ')}...</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">${stat.acquired}/${stat.total}</span>
                    <span class="text-xs px-1.5 py-0.5 rounded ${stat.percentage >= 80 ? 'bg-green-100 text-green-700' : stat.percentage >= 60 ? 'bg-blue-100 text-blue-700' : stat.percentage >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">${stat.percentage}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('stats-summary', StatsSummary);
