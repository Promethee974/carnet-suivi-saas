import { getAllStudents, sortStudents, importStudentsFromCSV, deleteStudent } from '../store/students-repo.js';
import { getTemporaryPhotos } from '../store/temp-photos.js';
import { getCarnet } from '../store/repo.js';
import { DOMAINS } from '../data/skills.js';
import { Student } from '../data/schema.js';
import { router } from '../utils/router.js';
import { createFileInput } from '../utils/export.js';
import './student-modal.js';

// Types de tri disponibles pour la liste des élèves
type SortOption = 'nom' | 'prenom' | 'createdAt' | 'progression';

export class StudentsList extends HTMLElement {
  private students: Student[] = [];
  private filteredStudents: Student[] = [];
  private searchQuery = '';
  private sortBy: SortOption = 'nom';
  private studentsProgression: Map<string, number> = new Map();
  private studentsSkillsCount: Map<string, { evaluated: number; total: number }> = new Map();

  constructor() {
    super();
    void this.loadStudents();
  }

  connectedCallback() {
    // Afficher un état initial pendant le chargement
    this.render();
  }

  // Chargement des élèves depuis l'IndexedDB
  private async loadStudents(): Promise<void> {
    try {
      this.students = await getAllStudents();
      await this.applyFilters();
      this.render();
    } catch (error) {
      console.error('Erreur lors du chargement des élèves:', error);
      this.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div class="max-w-md mx-auto text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Impossible de charger la liste des élèves
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Vérifiez vos données locales et réessayez.
            </p>
            <button class="btn-primary" onclick="location.reload()">Réessayer</button>
          </div>
        </div>
      `;
    }
  }

  // Mise à jour du compteur de photos temporaires
  private async updateTempPhotosCount(): Promise<void> {
    try {
      const tempPhotos = await getTemporaryPhotos();
      const countElement = this.querySelector('#temp-photos-count');
      if (countElement) {
        countElement.textContent = tempPhotos.length.toString();
        countElement.classList.toggle('hidden', tempPhotos.length === 0);
      }
    } catch (error) {
      console.error('Erreur lors du comptage des photos temporaires:', error);
    }
  }

  public async refreshPhotosCount(): Promise<void> {
    await this.updateTempPhotosCount();
  }

  // Application des filtres de recherche et du tri
  private async applyFilters(): Promise<void> {
    const query = this.searchQuery.trim().toLowerCase();
    this.studentsProgression.clear();
    this.studentsSkillsCount.clear();

    const filtered = query
      ? this.students.filter((student) => {
          const nom = student.nom.toLowerCase();
          const prenom = student.prenom.toLowerCase();
          return (
            nom.includes(query) ||
            prenom.includes(query) ||
            `${prenom} ${nom}`.includes(query)
          );
        })
      : [...this.students];

    if (this.sortBy === 'progression') {
      this.filteredStudents = await this.sortByProgression(filtered);
      return;
    }

    await this.calculateStudentsStats(filtered);
    this.filteredStudents = sortStudents(filtered, this.sortBy);
  }

  // Calcul de la progression d'un élève
  private async calculateStudentProgression(student: Student): Promise<{
    progression: number;
    evaluated: number;
    total: number;
  }> {
    const carnet = await getCarnet(student.id);

    let totalSkills = 0;
    let evaluatedSkills = 0;
    let accumulatedProgress = 0;

    if (carnet) {
      for (const domain of DOMAINS) {
        for (const skill of domain.skills) {
          totalSkills++;
          const skillEntry = carnet.skills[skill.id];
          if (skillEntry && skillEntry.status !== '') {
            evaluatedSkills++;
            switch (skillEntry.status) {
              case 'A':
                accumulatedProgress += 100;
                break;
              case 'EC':
                accumulatedProgress += 50;
                break;
              case 'NA':
              default:
                accumulatedProgress += 0;
                break;
            }
          }
        }
      }
    }

    const progression = evaluatedSkills > 0 ? accumulatedProgress / evaluatedSkills : 0;

    return {
      progression,
      evaluated: evaluatedSkills,
      total: totalSkills,
    };
  }

  // Calcul des statistiques de progression pour un ensemble d'élèves
  private async calculateStudentsStats(students: Student[]): Promise<void> {
    await Promise.all(
      students.map(async (student) => {
        const { progression, evaluated, total } = await this.calculateStudentProgression(student);
        this.studentsProgression.set(student.id, progression);
        this.studentsSkillsCount.set(student.id, { evaluated, total });
      })
    );
  }

  // Tri des élèves par progression décroissante
  private async sortByProgression(students: Student[]): Promise<Student[]> {
    const studentsWithProgression = await Promise.all(
      students.map(async (student) => {
        const { progression, evaluated, total } = await this.calculateStudentProgression(student);
        this.studentsProgression.set(student.id, progression);
        this.studentsSkillsCount.set(student.id, { evaluated, total });
        return { student, progression };
      })
    );

    studentsWithProgression.sort((a, b) => b.progression - a.progression);
    return studentsWithProgression.map((entry) => entry.student);
  }

  private render(): void {
    this.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 pt-safe-top">
          <div class="px-4 py-4">
            <div class="flex items-center justify-between">
              <button id="back-home-btn" class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
              </button>
              <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Mes Élèves (${this.students.length})
              </h1>
              <div class="flex items-center gap-2">
                <button id="temp-photos-btn" class="btn-icon relative" title="Photos sauvegardées">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  </svg>
                  <span id="temp-photos-count" class="absolute -top-2 -right-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full hidden">0</span>
                </button>
                <button id="backup-btn" class="btn-icon" title="Gérer les sauvegardes">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </button>
                <button id="import-csv" class="btn-icon" title="Importer depuis CSV">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                  </svg>
                </button>
                <button id="add-student" class="btn-primary" title="Ajouter un élève">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  Nouvel Élève
                </button>
              </div>
            </div>
          </div>
        </header>

        <main class="container mx-auto px-4 py-6">
          <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <div class="flex-1">
              <input 
                type="text" 
                id="search-input" 
                class="input" 
                placeholder="Rechercher un élève (nom, prénom)..."
                value="${this.searchQuery}"
              />
            </div>
            <select id="sort-select" class="input sm:w-48">
              <option value="nom" ${this.sortBy === 'nom' ? 'selected' : ''}>Trier par nom</option>
              <option value="prenom" ${this.sortBy === 'prenom' ? 'selected' : ''}>Trier par prénom</option>
              <option value="createdAt" ${this.sortBy === 'createdAt' ? 'selected' : ''}>Plus récents</option>
              <option value="progression" ${this.sortBy === 'progression' ? 'selected' : ''}>📈 Progression générale</option>
            </select>
          </div>

          ${this.filteredStudents.length > 0 ? `
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              ${this.filteredStudents.map((student) => this.renderStudentCard(student)).join('')}
            </div>
          ` : `
            <div class="text-center py-12">
              <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                ${this.searchQuery ? 'Aucun élève trouvé' : 'Aucun élève'}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                ${this.searchQuery 
                  ? 'Essayez de modifier votre recherche' 
                  : 'Commencez par ajouter vos élèves ou importer une liste CSV'
                }
              </p>
              ${!this.searchQuery ? `
                <button class="btn-primary" id="cta-add-first">Ajouter mon premier élève</button>
              ` : ''}
            </div>
          `}
        </main>

        <student-modal></student-modal>
      </div>
    `;

    this.attachEvents();
    void this.updateTempPhotosCount();
  }

  private renderStudentCard(student: Student): string {
    const age = student.naissance ? this.calculateAge(student.naissance) : null;
    const sexeIcon = student.sexe === 'F' ? '♀' : student.sexe === 'M' ? '♂' : '';
    const progression = this.studentsProgression.get(student.id) || 0;
    const progressionPercent = Math.round(progression);
    const skillsCount = this.studentsSkillsCount.get(student.id) || { evaluated: 0, total: 0 };

    let progressColor = 'bg-gray-300';
    if (progressionPercent >= 80) {
      progressColor = 'bg-green-500';
    } else if (progressionPercent >= 60) {
      progressColor = 'bg-blue-500';
    } else if (progressionPercent >= 40) {
      progressColor = 'bg-yellow-500';
    } else if (progressionPercent >= 20) {
      progressColor = 'bg-orange-500';
    } else {
      progressColor = 'bg-red-500';
    }

    const evaluatedPercent = skillsCount.total > 0 ? Math.round((skillsCount.evaluated / skillsCount.total) * 100) : 0;
    let countColor = 'text-gray-600';
    if (evaluatedPercent >= 80) {
      countColor = 'text-green-600';
    } else if (evaluatedPercent >= 60) {
      countColor = 'text-blue-600';
    } else if (evaluatedPercent >= 40) {
      countColor = 'text-yellow-600';
    } else if (evaluatedPercent >= 20) {
      countColor = 'text-orange-600';
    } else {
      countColor = 'text-red-600';
    }

    const avatar = student.avatar || student.photo;
    const initials = `${student.prenom.charAt(0) || ''}${student.nom.charAt(0) || ''}`.toUpperCase();

    return `
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-14 h-14 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-300 font-semibold text-lg">
            ${avatar ? `<img src="${avatar}" alt="${student.prenom} ${student.nom}" class="w-full h-full object-cover" />` : initials}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">
              ${student.prenom} ${student.nom}
            </h3>
            <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              ${sexeIcon ? `<span>${sexeIcon}</span>` : ''}
              ${age ? `<span>${age} ans</span>` : ''}
            </div>
          </div>
        </div>

        ${this.sortBy === 'progression' || progression > 0 ? `
          <div class="mb-3">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-gray-600 dark:text-gray-400">📈 Progression générale</span>
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-gray-100">${progressionPercent}%</span>
                <span class="${countColor} font-medium text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  ${skillsCount.evaluated}/${skillsCount.total}
                </span>
              </div>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
              <div class="${progressColor} h-2 rounded-full transition-all duration-300" style="width: ${progressionPercent}%"></div>
            </div>
            <div class="text-xs ${countColor} text-right">
              ${skillsCount.evaluated} compétence${skillsCount.evaluated > 1 ? 's' : ''} évaluée${skillsCount.evaluated > 1 ? 's' : ''} sur ${skillsCount.total}
            </div>
          </div>
        ` : ''}

        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500 dark:text-gray-400">
            Ajouté le ${new Date(student.createdAt).toLocaleDateString('fr-FR')}
          </span>
          <div class="flex gap-1">
            <button class="btn-icon text-primary-600 hover:bg-primary-50" data-action="view" data-student-id="${student.id}" title="Consulter">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
            <button class="btn-icon text-blue-600 hover:bg-blue-50" data-action="edit" data-student-id="${student.id}" title="Modifier">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button class="btn-icon text-red-600 hover:bg-red-50" data-action="delete" data-student-id="${student.id}" title="Supprimer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  private attachEvents(): void {
    this.querySelector('#back-home-btn')?.addEventListener('click', () => {
      router.navigateTo({ name: 'home' });
    });

    this.querySelector('#temp-photos-btn')?.addEventListener('click', () => {
      router.navigateTo({ name: 'temp-photos' });
    });

    this.querySelector('#backup-btn')?.addEventListener('click', () => {
      router.navigateTo({ name: 'backup-manager' });
    });

    const addButtons = [
      this.querySelector('#add-student'),
      this.querySelector('#cta-add-first'),
    ].filter(Boolean) as HTMLButtonElement[];
    addButtons.forEach((button) =>
      button.addEventListener('click', () => this.openCreateModal())
    );

    this.querySelector('#import-csv')?.addEventListener('click', () => {
      void this.handleCSVImport();
    });

    const searchInput = this.querySelector<HTMLInputElement>('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', async (event) => {
        const target = event.target as HTMLInputElement;
        this.searchQuery = target.value;
        const caretPosition = target.selectionStart ?? target.value.length;

        await this.applyFilters();
        this.render();

        const updatedInput = this.querySelector<HTMLInputElement>('#search-input');
        if (updatedInput) {
          updatedInput.focus();
          updatedInput.setSelectionRange(caretPosition, caretPosition);
        }
      });
    }

    const sortSelect = this.querySelector<HTMLSelectElement>('#sort-select');
    sortSelect?.addEventListener('change', async (event) => {
      this.sortBy = (event.target as HTMLSelectElement).value as SortOption;
      await this.applyFilters();
      this.render();
    });

    this.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      button.addEventListener('click', (event) => {
        const target = event.currentTarget as HTMLButtonElement;
        const studentId = target.dataset.studentId;
        const action = target.dataset.action;

        if (!studentId || !action) {
          return;
        }

        switch (action) {
          case 'view':
            router.navigateTo({ name: 'student-detail', studentId });
            break;
          case 'edit':
            this.openEditModal(studentId);
            break;
          case 'delete':
            void this.handleDeleteStudent(studentId);
            break;
        }
      });
    });
  }

  private openCreateModal(): void {
    const modal = this.querySelector('student-modal') as any;
    modal?.openForCreate(
      async () => {
        await this.loadStudents();
      },
      () => {}
    );
  }

  private openEditModal(studentId: string): void {
    const modal = this.querySelector('student-modal') as any;
    modal?.openForEdit(
      studentId,
      async () => {
        await this.loadStudents();
      },
      () => {}
    );
  }

  private async handleCSVImport(): Promise<void> {
    const file = await createFileInput('.csv');
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const result = await importStudentsFromCSV(content);

      if (result.errors.length > 0) {
        alert(`Import terminé avec ${result.imported} élèves et ${result.errors.length} erreurs.\n${result.errors.join('\n')}`);
      } else {
        alert(`Import réussi ! ${result.imported} élèves ajoutés.`);
      }

      await this.loadStudents();
    } catch (error) {
      console.error('Erreur lors de l\'import CSV:', error);
      alert('Erreur lors de l\'import du fichier CSV.');
    }
  }

  private async handleDeleteStudent(studentId: string): Promise<void> {
    const confirmed = window.confirm('Confirmez-vous la suppression de cet élève et de son carnet ?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteStudent(studentId);
      await this.loadStudents();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'élève:', error);
      alert('Erreur lors de la suppression de l\'élève.');
    }
  }
}

customElements.define('students-list', StudentsList);
