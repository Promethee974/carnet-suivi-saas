import { getAllStudents, sortStudents, importStudentsFromCSV, deleteStudent } from '../store/students-repo.js';
import { getTemporaryPhotos } from '../store/temp-photos.js';
import { getCarnet } from '../store/repo.js';
import { DOMAINS } from '../data/skills.js';
import { Student } from '../data/schema.js';
import { router } from '../utils/router.js';
import { createFileInput } from '../utils/export.js';
import './student-modal.js';

export class StudentsList extends HTMLElement {
  private students: Student[] = [];
  private filteredStudents: Student[] = [];
  private searchQuery = '';
  private sortBy: 'nom' | 'prenom' | 'createdAt' | 'progression' = 'nom';
  private studentsProgression: Map<string, number> = new Map();
  private studentsSkillsCount: Map<string, {evaluated: number, total: number}> = new Map();

  constructor() {
    super();
    this.loadStudents();
  }

  private async loadStudents() {
    this.students = await getAllStudents();
    await this.applyFilters();
    await this.updateTempPhotosCount();
    this.render();
  }

  private async updateTempPhotosCount() {
    try {
      const tempPhotos = await getTemporaryPhotos();
      const count = tempPhotos.length;
      const countElement = this.querySelector('#temp-photos-count');
      
      if (countElement) {
        countElement.textContent = count.toString();
        if (count > 0) {
          countElement.classList.remove('hidden');
        } else {
          countElement.classList.add('hidden');
        }
      }
    } catch (error) {
      console.error('Erreur chargement photos temporaires:', error);
    }
  }

  private async applyFilters() {
    let filtered = this.searchQuery 
      ? this.students.filter(s => 
          s.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          s.prenom.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      : this.students;
    
    if (this.sortBy === 'progression') {
      this.filteredStudents = await this.sortByProgression(filtered);
    } else {
      // Calculer les statistiques même pour les autres tris
      await this.calculateStudentsStats(filtered);
      this.filteredStudents = sortStudents(filtered, this.sortBy);
    }
  }

  private async calculateStudentProgression(student: Student): Promise<{progression: number, evaluated: number, total: number}> {
    const carnet = await getCarnet(student.id);
    let totalProgression = 0;
    let totalSkills = 0;
    let evaluatedSkills = 0;

    if (carnet) {
      // Calculer pour tous les domaines
      for (const domain of DOMAINS) {
        for (const skill of domain.skills) {
          totalSkills++;
          const skillEntry = carnet.skills[skill.id];
          if (skillEntry && skillEntry.status !== '') {
            evaluatedSkills++;
            // Convertir le statut en pourcentage
            switch (skillEntry.status) {
              case 'A': // Acquis
                totalProgression += 100;
                break;
              case 'EC': // En cours
                totalProgression += 50;
                break;
              case 'NA': // Non acquis
                totalProgression += 0;
                break;
            }
          }
        }
      }
    }

    const averageProgression = evaluatedSkills > 0 ? totalProgression / evaluatedSkills : 0;
    
    return {
      progression: averageProgression,
      evaluated: evaluatedSkills,
      total: totalSkills
    };
  }

  private async calculateStudentsStats(students: Student[]): Promise<void> {
    await Promise.all(
      students.map(async (student) => {
        const { progression, evaluated, total } = await this.calculateStudentProgression(student);
        
        // Stocker les données
        this.studentsProgression.set(student.id, progression);
        this.studentsSkillsCount.set(student.id, { evaluated, total });
      })
    );
  }

  private async sortByProgression(students: Student[]): Promise<Student[]> {
    // Calculer la progression pour chaque élève
    const studentsWithProgression = await Promise.all(
      students.map(async (student) => {
        const { progression, evaluated, total } = await this.calculateStudentProgression(student);
        
        // Stocker la progression et le comptage pour l'affichage
        this.studentsProgression.set(student.id, progression);
        this.studentsSkillsCount.set(student.id, { evaluated, total });
        
        return {
          student,
          progression
        };
      })
    );

    // Trier par progression décroissante (meilleurs élèves en premier)
    studentsWithProgression.sort((a, b) => b.progression - a.progression);
    
    return studentsWithProgression.map(item => item.student);
  }

  private render() {
    this.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- En-tête -->
        <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div class="px-4 py-4">
            <div class="flex items-center justify-between">
              <button id="back-home-btn" class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Retour à l'accueil
              </button>
              <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                👩‍🏫 Mes Élèves (${this.students.length})
              </h1>
              <div class="flex items-center gap-2">
            <button id="temp-photos-btn" class="btn-icon relative" title="Photos sauvegardées">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
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

        <!-- Contenu principal -->
        <main class="container mx-auto px-4 py-6">
          <!-- Barre de recherche et tri -->
        <div class="flex flex-col sm:flex-row gap-4">
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

        <!-- Liste des élèves -->
        ${this.filteredStudents.length > 0 ? `
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            ${this.filteredStudents.map(student => this.renderStudentCard(student)).join('')}
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
              <button class="btn-primary" onclick="document.getElementById('add-student').click()">
                Ajouter mon premier élève
              </button>
            ` : ''}
          </div>
        `}
        </main>

        <!-- Modale d'édition -->
        <student-modal></student-modal>
      </div>
    `;

    this.attachEvents();
  }

  private renderStudentCard(student: Student): string {
    const age = student.naissance ? this.calculateAge(student.naissance) : null;
    const sexeIcon = student.sexe === 'F' ? '♀' : student.sexe === 'M' ? '♂' : '';
    const progression = this.studentsProgression.get(student.id) || 0;
    const progressionPercent = Math.round(progression);
    const skillsCount = this.studentsSkillsCount.get(student.id) || { evaluated: 0, total: 0 };
    
    // Couleur de la barre de progression selon le niveau
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
    
    // Couleur pour le compteur de compétences
    const evaluationPercent = skillsCount.total > 0 ? Math.round((skillsCount.evaluated / skillsCount.total) * 100) : 0;
    let countColor = 'text-gray-600';
    if (evaluationPercent >= 80) {
      countColor = 'text-green-600';
    } else if (evaluationPercent >= 60) {
      countColor = 'text-blue-600';
    } else if (evaluationPercent >= 40) {
      countColor = 'text-yellow-600';
    } else if (evaluationPercent >= 20) {
      countColor = 'text-orange-600';
    } else {
      countColor = 'text-red-600';
    }
    
    return `
      <div class="card card-hover p-4 cursor-pointer student-card" data-student-id="${student.id}">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            ${student.avatar ? `
              <img src="${student.avatar}" alt="Avatar" class="w-full h-full object-cover" />
            ` : `
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            `}
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
        
        <!-- Barre de progression -->
        ${this.sortBy === 'progression' || progression > 0 ? `
          <div class="mb-3">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-gray-600 dark:text-gray-400">📈 Progression générale</span>
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-gray-100">${progressionPercent}%</span>
                <span class="${countColor} dark:${countColor.replace('text-', 'text-')} font-medium text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  ${skillsCount.evaluated}/${skillsCount.total}
                </span>
              </div>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
              <div class="${progressColor} h-2 rounded-full transition-all duration-300" style="width: ${progressionPercent}%"></div>
            </div>
            <div class="text-xs ${countColor} dark:${countColor.replace('text-', 'text-')} text-right">
              ${skillsCount.evaluated} compétence${skillsCount.evaluated > 1 ? 's' : ''} évaluée${skillsCount.evaluated > 1 ? 's' : ''} sur ${skillsCount.total}
            </div>
          </div>
        ` : ''}
        
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500 dark:text-gray-400">
            Ajouté le ${new Date(student.createdAt).toLocaleDateString('fr-FR')}
          </span>
          <div class="flex gap-1">
            <button class="btn-icon text-primary-600 hover:bg-primary-50" data-action="edit" data-student-id="${student.id}" title="Modifier">
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

  private attachEvents() {
    // Recherche
    const searchInput = this.querySelector('#search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', async (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      await this.applyFilters();
      this.render();
    });

    // Tri
    const sortSelect = this.querySelector('#sort-select') as HTMLSelectElement;
    sortSelect?.addEventListener('change', async (e) => {
      this.sortBy = (e.target as HTMLSelectElement).value as any;
      await this.applyFilters();
      this.render();
    });

    // Navigation vers détail élève
    this.querySelectorAll('.student-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Ignorer si on clique sur un bouton d'action
        if ((e.target as HTMLElement).closest('[data-action]')) return;
        
        const studentId = (card as HTMLElement).dataset.studentId;
        if (studentId) {
          router.goToStudentDetail(studentId);
        }
      });
    });

    // Actions sur les élèves
    this.addEventListener('click', (e) => {
      const button = (e.target as HTMLElement).closest('[data-action]') as HTMLElement;
      if (!button) return;

      e.stopPropagation();
      const action = button.dataset.action;
      const studentId = button.dataset.studentId;

      if (action === 'edit' && studentId) {
        this.editStudent(studentId);
      } else if (action === 'delete' && studentId) {
        this.deleteStudent(studentId);
      }
    });

    // Navigation
    this.querySelector('#back-home-btn')?.addEventListener('click', () => {
      router.navigateTo({ name: 'home' });
    });

    // Boutons d'action
    this.querySelector('#temp-photos-btn')?.addEventListener('click', () => {
      router.navigateTo({ name: 'temp-photos' });
    });
    
    this.querySelector('#backup-btn')?.addEventListener('click', () => {
      router.navigateTo({ name: 'backup-manager' });
    });
    
    this.querySelector('#add-student')?.addEventListener('click', () => this.addStudent());
    this.querySelector('#import-csv')?.addEventListener('click', () => this.importCSV());
  }

  private addStudent() {
    const modal = this.querySelector('student-modal') as any;
    modal.openForCreate(
      (student: Student) => {
        console.log('Élève créé:', student);
        this.loadStudents(); // Recharger la liste
      },
      () => {
        console.log('Création annulée');
      }
    );
  }

  private editStudent(studentId: string) {
    const modal = this.querySelector('student-modal') as any;
    modal.openForEdit(
      studentId,
      (student: Student) => {
        console.log('Élève modifié:', student);
        this.loadStudents(); // Recharger la liste
      },
      () => {
        console.log('Modification annulée');
      }
    );
  }

  private async deleteStudent(studentId: string) {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return;

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer l'élève "${student.prenom} ${student.nom}" ?\n\n` +
      `⚠️ Cette action supprimera également son carnet de suivi et toutes ses données.\n` +
      `Cette action est irréversible.`
    );

    if (confirmed) {
      try {
        await deleteStudent(studentId);
        await this.loadStudents(); // Recharger la liste
        console.log('Élève supprimé:', studentId);
      } catch (error) {
        console.error('Erreur suppression élève:', error);
        alert('Erreur lors de la suppression de l\'élève');
      }
    }
  }

  private async importCSV() {
    try {
      const file = await createFileInput('.csv');
      if (!file) return;

      const content = await file.text();
      const result = await importStudentsFromCSV(content);
      
      if (result.errors.length > 0) {
        console.warn('Erreurs lors de l\'import:', result.errors);
      }
      
      alert(`Import terminé: ${result.imported} élève(s) importé(s)${result.errors.length > 0 ? `, ${result.errors.length} erreur(s)` : ''}`);
      
      await this.loadStudents();
    } catch (error) {
      console.error('Erreur import CSV:', error);
      alert('Erreur lors de l\'import du fichier CSV');
    }
  }
}

customElements.define('students-list', StudentsList);
