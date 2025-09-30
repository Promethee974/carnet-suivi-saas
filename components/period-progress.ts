import { getCarnet } from '../store/repo.js';
import { ID } from '../data/schema.js';

export class PeriodProgress extends HTMLElement {
  private studentId: ID = '';

  static get observedAttributes() {
    return ['student-id'];
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === 'student-id' && value) {
      this.studentId = value;
      this.loadData();
    }
  }

  connectedCallback() {
    if (this.studentId) {
      this.loadData();
    }
  }

  private async loadData() {
    if (!this.studentId) return;

    try {
      const carnet = await getCarnet(this.studentId);
      if (!carnet) return;

      // Simuler les données par période (en attendant l'implémentation complète)
      const periods = [
        { id: '1', name: 'Période 1 (Sept-Oct)', current: carnet.meta.periode === '1' },
        { id: '2', name: 'Période 2 (Nov-Déc)', current: carnet.meta.periode === '2' },
        { id: '3', name: 'Période 3 (Jan-Fév)', current: carnet.meta.periode === '3' },
        { id: '4', name: 'Période 4 (Mar-Avr)', current: carnet.meta.periode === '4' },
        { id: '5', name: 'Période 5 (Mai-Juin)', current: carnet.meta.periode === '5' }
      ];

      this.render(periods, carnet.meta.periode);
    } catch (error) {
      console.error('Erreur chargement progression par période:', error);
    }
  }

  private render(periods: any[], currentPeriod: string) {
    this.innerHTML = `
      <div class="card p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            📊 Progression par période
          </h3>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Période actuelle : ${currentPeriod}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          ${periods.map(period => `
            <div class="period-card ${period.current ? 'current-period' : 'future-period'}" data-period="${period.id}">
              <div class="text-center p-4 rounded-lg border-2 ${period.current ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}">
                <div class="text-sm font-medium ${period.current ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'} mb-2">
                  ${period.name}
                </div>
                
                ${period.current ? `
                  <div class="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                    En cours
                  </div>
                  <div class="text-xs text-primary-600 dark:text-primary-400">
                    Évaluation active
                  </div>
                ` : parseInt(period.id) < parseInt(currentPeriod) ? `
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    ✓
                  </div>
                  <div class="text-xs text-green-600 dark:text-green-400">
                    Terminée
                  </div>
                ` : `
                  <div class="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-1">
                    —
                  </div>
                  <div class="text-xs text-gray-400 dark:text-gray-500">
                    À venir
                  </div>
                `}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <p class="font-medium mb-1">Suivi par période :</p>
              <ul class="text-xs space-y-1">
                <li>• La période actuelle est définie dans les réglages du carnet</li>
                <li>• Les évaluations sont associées à la période en cours</li>
                <li>• Vous pouvez changer de période via "Éditer le carnet"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('period-progress', PeriodProgress);
