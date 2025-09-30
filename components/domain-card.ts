import { getDomainById } from '../data/skills.js';
import { getCarnet } from '../store/repo.js';
import { ID } from '../data/schema.js';
import { eventManager } from '../utils/events.js';
import './skill-item.js';

export class DomainCard extends HTMLElement {
  private studentId: ID = '';
  private domainId = '';
  private name = '';
  private color = 'bg-gray-400';
  private expanded = false;
  private eventListener: ((event: CustomEvent) => void) | null = null;

  static get observedAttributes() {
    return ['student-id', 'data-domain-id', 'data-name', 'data-color', 'data-percentage', 'data-acquired', 'data-total'];
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (!value) return;
    switch (name) {
      case 'student-id': this.studentId = value; break;
      case 'data-domain-id': this.domainId = value; break;
      case 'data-name': this.name = value; break;
      case 'data-color': this.color = value; break;
    }
    this.render();
  }

  connectedCallback() {
    this.setupEventListeners();
    this.render();
  }

  disconnectedCallback() {
    // Nettoyer les écouteurs d'événements
    if (this.eventListener) {
      eventManager.off('skill-updated', this.eventListener);
    }
  }

  private setupEventListeners() {
    // Supprimer l'ancien écouteur s'il existe
    if (this.eventListener) {
      eventManager.off('skill-updated', this.eventListener);
    }

    // Créer un nouvel écouteur
    this.eventListener = (event: CustomEvent) => {
      const detail = event.detail;
      // Ne se mettre à jour que si c'est pour notre élève et notre domaine
      if (detail.studentId === this.studentId && detail.domainId === this.domainId) {
        this.updateProgressDisplay();
      }
    };

    // Écouter les événements de mise à jour des compétences
    eventManager.on('skill-updated', this.eventListener);
  }

  private async updateProgressDisplay() {
    // Recalculer et mettre à jour uniquement les statistiques de progression
    if (!this.studentId || !this.domainId) return;
    
    const carnet = await getCarnet(this.studentId);
    if (!carnet) return;

    const domain = getDomainById(this.domainId);
    if (!domain) return;

    // Recalculer les statistiques
    const domainSkills = domain.skills.map(skill => carnet.skills[skill.id]).filter(Boolean);
    const acquired = domainSkills.filter(skill => skill.status === 'A').length;
    const addressed = domainSkills.filter(skill => skill.status === 'A' || skill.status === 'EC' || skill.status === 'NA').length; // Compétences abordées
    const total = domainSkills.length;
    const percentage = total > 0 ? Math.round((acquired / total) * 100) : 0;

    // Mettre à jour les éléments de progression dans le DOM
    const progressText = this.querySelector('.progress-text');
    const progressBar = this.querySelector('.progress-fill');
    const percentageSpan = this.querySelector('.percentage');

    if (progressText) {
      progressText.textContent = `${addressed}/${total} compétences abordées`;
    }
    if (progressBar) {
      (progressBar as HTMLElement).style.width = `${percentage}%`;
      progressBar.className = `progress-fill ${percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-blue-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`;
    }
    if (percentageSpan) {
      percentageSpan.textContent = `${percentage}%`;
      percentageSpan.className = `font-semibold ${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-blue-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`;
    }
  }

  private async render() {
    if (!this.studentId) return;
    
    const carnet = await getCarnet(this.studentId);
    if (!carnet) return;

    const domain = getDomainById(this.domainId);
    if (!domain) return;

    const total = Number(this.getAttribute('data-total') || '0');
    const percentage = Number(this.getAttribute('data-percentage') || '0');
    
    // Calculer les compétences abordées
    const domainSkills = domain.skills.map(skill => carnet.skills[skill.id]).filter(Boolean);
    const addressed = domainSkills.filter(skill => skill.status === 'A' || skill.status === 'EC' || skill.status === 'NA').length;

    this.innerHTML = `
      <article class="card card-hover p-4" role="region" aria-labelledby="title-${this.domainId}">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-3 h-10 rounded ${this.color}" aria-hidden="true"></div>
            <div>
              <h3 id="title-${this.domainId}" class="font-semibold text-lg">${this.name}</h3>
              <p class="progress-text text-sm text-gray-500" aria-live="polite">${addressed}/${total} compétences abordées</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="percentage font-semibold ${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-blue-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}">${percentage}%</span>
            <button type="button" class="btn-secondary" id="toggle" aria-expanded="${this.expanded}">
              ${this.expanded ? 'Réduire' : 'Détails'}
            </button>
          </div>
        </header>
        <div class="mt-3">
          <div class="progress-bar" aria-label="Progression">
            <div class="progress-fill ${percentage>=80?'bg-green-500':percentage>=60?'bg-blue-500':percentage>=40?'bg-yellow-500':percentage>=20?'bg-orange-500':'bg-red-500'}" style="width:${percentage}%"></div>
          </div>
        </div>
        ${this.expanded ? `
        <ul class="mt-4 space-y-3" aria-label="Compétences du domaine ${this.name}">
          ${domain.skills.map(skill => {
            return `
              <li>
                <skill-item student-id="${this.studentId}" data-skill-id="${skill.id}" data-text="${skill.text.replace(/"/g, '&quot;')}"></skill-item>
              </li>
            `;
          }).join('')}
        </ul>
        ` : ''}
      </article>
    `;

    this.querySelector('#toggle')?.addEventListener('click', () => {
      this.expanded = !this.expanded;
      this.render();
    });
  }
}

customElements.define('domain-card', DomainCard);
