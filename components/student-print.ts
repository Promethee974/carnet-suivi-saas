import { getStudent } from '../store/students-repo.js';
import { getCarnet } from '../store/repo.js';
import { getAllDomains } from '../data/skills.js';
import { calculateDomainProgress } from '../utils/progress.js';
import { router } from '../utils/router.js';
import { Student, Carnet, ID } from '../data/schema.js';

export class StudentPrint extends HTMLElement {
  private studentId: ID = '';
  private student: Student | null = null;
  private carnet: Carnet | null = null;

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
      this.student = await getStudent(this.studentId);
      this.carnet = await getCarnet(this.studentId);
      
      if (!this.student || !this.carnet) {
        this.innerHTML = '<div class="error">Élève ou carnet introuvable</div>';
        return;
      }

      this.render();
    } catch (error) {
      console.error('Erreur chargement données impression:', error);
      this.innerHTML = '<div class="error">Erreur de chargement</div>';
    }
  }

  private calculateAge(birthDateString?: string): number {
    if (!birthDateString) return 0;
    
    try {
      const birthDate = new Date(birthDateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (e) {
      console.error('Erreur calcul âge:', e);
      return 0;
    }
  }

  private renderDomains(): string {
    if (!this.carnet) return '';
    
    const domains = getAllDomains(true);
    return domains.map(domain => {
      const domainSkills = domain.skills
        .map(skill => {
          const entry = this.carnet?.skills[skill.id];
          if (!entry || entry.status === '') return null;
          
          return `
            <div class="skill-entry">
              <span class="skill-status ${entry.status}">
                ${entry.status === 'A' ? '✓' : entry.status === 'EC' ? '~' : '✗'}
              </span>
              <span class="skill-text">${skill.text}</span>
              ${entry.comment ? `<div class="skill-comment">${entry.comment}</div>` : ''}
            </div>
          `;
        })
        .filter(Boolean)
        .join('');
      
      if (!domainSkills) return '';
      
      return `
        <div class="domain-section">
          <h3 class="domain-title" style="color: ${domain.color}">
            ${domain.name}
          </h3>
          <div class="skills-list">
            ${domainSkills}
          </div>
        </div>
      `;
    }).join('');
  }

  private render() {
    if (!this.student || !this.carnet) return;
    
    // Utiliser naissance ou birthDate pour la date de naissance
    const birthDate = this.student.naissance || this.student.birthDate || '';
    const studentAge = this.calculateAge(birthDate);
    const formattedBirthDate = birthDate ? new Date(birthDate).toLocaleDateString('fr-FR') : 'Non renseignée';
    
    // Rendu du header fixe (affiché uniquement à l'écran)
    const header = `
      <header class="print-screen-header">
        <a href="#/students/${this.studentId}" class="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Retour
        </a>
        <h2>${this.student.prenom} ${this.student.nom} - Aperçu d'impression</h2>
      </header>
    `;
    
    // Utiliser photo ou avatar pour l'image de l'étudiant
    const studentPhoto = this.student.photo || this.student.avatar;
    const studentInitials = this.student.prenom.charAt(0) + this.student.nom.charAt(0);
    
    // Rendu du contenu principal
    const content = `
      <div class="print-layout">
        <div class="print-header">
          <div class="school-info">
            <h1>École Maternelle</h1>
            <h2>Carnet de suivi des apprentissages</h2>
          </div>
          <div class="student-info">
            <div class="student-avatar">
              ${studentPhoto ? `
                <img src="${studentPhoto}" alt="${this.student.prenom} ${this.student.nom}" />
              ` : `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #e5e7eb; color: #6b7280; font-weight: bold;">
                  ${studentInitials}
                </div>
              `}
            </div>
            <div class="student-details">
              <h3>${this.student.prenom} ${this.student.nom}</h3>
              <p>Né(e) le: ${formattedBirthDate}</p>
              <p>Âge: ${studentAge > 0 ? `${studentAge} ans` : 'Non spécifié'}</p>
            </div>
          </div>
        </div>
        
        ${this.renderDomains()}
        
        <div class="print-footer">
          <p>Établissement: École Maternelle - Année scolaire 2023-2024</p>
          <p>Document généré le: ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    `;
    
    // Rendu du footer fixe (affiché uniquement à l'écran)
    const footer = `
      <footer class="print-screen-footer">
        <button id="print-btn" class="print-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Imprimer
        </button>
      </footer>
    `;
    
    this.innerHTML = header + content + footer;

    // Filtrer les domaines qui ont au moins une compétence évaluée
    const includeTransversal = true; // Pour l'impression, on inclut tout par défaut
    const allDomains = getAllDomains(includeTransversal);
    
    const evaluatedDomains = allDomains.filter(domain => {
      // Vérifier si le domaine a au moins une compétence évaluée
      return domain.skills.some(skill => {
        const entry = this.carnet!.skills[skill.id];
        return entry && (entry.status === 'NA' || entry.status === 'EC' || entry.status === 'A');
      });
    });

    // Calculer les statistiques globales uniquement sur les compétences évaluées
    const evaluatedSkills = Object.values(this.carnet.skills).filter(skill => 
      skill.status === 'NA' || skill.status === 'EC' || skill.status === 'A'
    );
    
    const totalEvaluated = evaluatedSkills.length;
    const acquired = evaluatedSkills.filter(skill => skill.status === 'A').length;
    const inProgress = evaluatedSkills.filter(skill => skill.status === 'EC').length;
    const notAcquired = evaluatedSkills.filter(skill => skill.status === 'NA').length;
    const globalPercentage = totalEvaluated > 0 ? Math.round((acquired / totalEvaluated) * 100) : 0;

    this.innerHTML = `
      <div class="print-layout">
        <!-- En-tête -->
        <header class="print-header">
          <div class="school-info">
            <h1>Carnet de Suivi des Apprentissages</h1>
            <h2>Grande Section - Programmes 2025</h2>
          </div>
          <div class="student-info">
            <div class="student-avatar">
              ${this.student.avatar ? `
                <img src="${this.student.avatar}" alt="Photo de ${this.student.prenom}" />
              ` : `
                <div class="avatar-placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              `}
            </div>
            <div class="student-details">
              <h3>${this.student.prenom} ${this.student.nom}</h3>
              ${this.student.naissance ? `<p>Né(e) le ${this.formatDate(this.student.naissance)}</p>` : ''}
              ${this.student.sexe ? `<p>${this.student.sexe === 'F' ? 'Fille' : this.student.sexe === 'M' ? 'Garçon' : this.student.sexe}</p>` : ''}
            </div>
          </div>
        </header>

        <!-- Informations du carnet -->
        <section class="carnet-info">
          <div class="info-grid">
            <div class="info-item">
              <strong>Année scolaire :</strong> ${this.carnet.meta.annee}-${parseInt(this.carnet.meta.annee) + 1}
            </div>
            <div class="info-item">
              <strong>Enseignant(e) :</strong> ${this.carnet.meta.enseignant}
            </div>
            <div class="info-item">
              <strong>Période :</strong> Période ${this.carnet.meta.periode}
            </div>
            <div class="info-item">
              <strong>Date d'édition :</strong> ${this.formatDate(new Date().toISOString().split('T')[0])}
            </div>
          </div>
        </section>

        <!-- Synthèse globale -->
        <section class="global-summary">
          <h2>Synthèse Globale</h2>
          <div class="summary-stats">
            <div class="stat-item acquired">
              <span class="stat-number">${acquired}</span>
              <span class="stat-label">Acquises</span>
            </div>
            <div class="stat-item in-progress">
              <span class="stat-number">${inProgress}</span>
              <span class="stat-label">En cours</span>
            </div>
            <div class="stat-item not-acquired">
              <span class="stat-number">${notAcquired}</span>
              <span class="stat-label">Non acquises</span>
            </div>
            <div class="stat-item total">
              <span class="stat-number">${globalPercentage}%</span>
              <span class="stat-label">Progression</span>
            </div>
          </div>
          <div class="progress-bar-print">
            <div class="progress-fill-print" style="width: ${globalPercentage}%"></div>
          </div>
        </section>

        <!-- Domaines évalués -->
        ${evaluatedDomains.map(domain => this.renderDomainForPrint(domain)).join('')}

        <!-- Synthèse personnalisée -->
        ${this.carnet.synthese && (this.carnet.synthese.forces || this.carnet.synthese.axes || this.carnet.synthese.projets) ? `
          <section class="personal-synthesis">
            <h2>Synthèse Personnalisée</h2>
            ${this.carnet.synthese.forces ? `
              <div class="synthesis-section">
                <h3>Points forts</h3>
                <p>${this.carnet.synthese.forces}</p>
              </div>
            ` : ''}
            ${this.carnet.synthese.axes ? `
              <div class="synthesis-section">
                <h3>Axes de progrès</h3>
                <p>${this.carnet.synthese.axes}</p>
              </div>
            ` : ''}
            ${this.carnet.synthese.projets ? `
              <div class="synthesis-section">
                <h3>Projets et perspectives</h3>
                <p>${this.carnet.synthese.projets}</p>
              </div>
            ` : ''}
          </section>
        ` : ''}

        <!-- Pied de page -->
        <footer class="print-footer">
          <div class="signatures">
            <div class="signature-block">
              <p><strong>L'enseignant(e)</strong></p>
              <div class="signature-line"></div>
            </div>
            <div class="signature-block">
              <p><strong>Les parents</strong></p>
              <div class="signature-line"></div>
            </div>
          </div>
          <p class="footer-note">
            Ce carnet de suivi est conforme aux programmes de l'école maternelle (BO spécial n°2 du 26 mars 2015)
          </p>
        </footer>

        <!-- Boutons d'action (masqués à l'impression) -->
        <div class="print-actions no-print">
          <button id="back-btn" class="btn-secondary">
            ← Retour au carnet
          </button>
          <button id="print-btn" class="btn-primary">
            🖨️ Imprimer
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private renderDomainForPrint(domain: any): string {
    if (!this.carnet) return '';

    // Filtrer les compétences évaluées de ce domaine
    const evaluatedSkills = domain.skills.filter((skill: any) => {
      const entry = this.carnet!.skills[skill.id];
      return entry && (entry.status === 'NA' || entry.status === 'EC' || entry.status === 'A');
    });

    if (evaluatedSkills.length === 0) return '';

    const progress = calculateDomainProgress(domain.id, this.carnet.skills);

    return `
      <section class="domain-section">
        <div class="domain-header">
          <div class="domain-title">
            <div class="domain-color" style="background-color: ${this.getColorValue(domain.color)}"></div>
            <h2>${domain.name}</h2>
          </div>
          <div class="domain-stats">
            <span class="domain-progress">${progress.acquired}/${progress.total} acquises (${progress.percentage}%)</span>
          </div>
        </div>
        
        <div class="skills-grid">
          ${evaluatedSkills.map((skill: any) => this.renderSkillForPrint(skill)).join('')}
        </div>
      </section>
    `;
  }

  private renderSkillForPrint(skill: any): string {
    if (!this.carnet) return '';

    const entry = this.carnet.skills[skill.id];
    if (!entry || !entry.status) return '';

    const statusClass = entry.status === 'A' ? 'acquired' : entry.status === 'EC' ? 'in-progress' : 'not-acquired';
    const statusText = entry.status === 'A' ? 'Acquise' : entry.status === 'EC' ? 'En cours' : 'Non acquise';

    return `
      <div class="skill-item">
        <div class="skill-header">
          <span class="skill-text">${skill.text}</span>
          <span class="skill-status ${statusClass}">${statusText}</span>
        </div>
        ${entry.comment ? `
          <div class="skill-comment">
            <p>${entry.comment}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  private getColorValue(colorClass: string): string {
    // Convertir les classes Tailwind en valeurs CSS
    const colorMap: Record<string, string> = {
      'bg-red-400': '#f87171',
      'bg-orange-400': '#fb923c',
      'bg-yellow-400': '#fbbf24',
      'bg-green-400': '#4ade80',
      'bg-blue-400': '#60a5fa',
      'bg-indigo-400': '#818cf8',
      'bg-purple-400': '#c084fc',
      'bg-pink-400': '#f472b6'
    };
    return colorMap[colorClass] || '#6b7280';
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private attachEvents() {
    this.querySelector('#back-btn')?.addEventListener('click', () => {
      router.goToStudentDetail(this.studentId);
    });

    this.querySelector('#print-btn')?.addEventListener('click', () => {
      window.print();
    });
  }
}

customElements.define('student-print', StudentPrint);
