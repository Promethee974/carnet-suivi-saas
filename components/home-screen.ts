import { router } from '../utils/router.js';

export class HomeScreen extends HTMLElement {
  connectedCallback() {
    this.render();
    this.attachEvents();
  }

  private render() {
    this.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div class="max-w-4xl w-full">
          <!-- En-tête -->
          <div class="text-center mb-12">
            <div class="w-24 h-24 mx-auto mb-6 bg-blue-600 rounded-full flex items-center justify-center">
              <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Carnet de Suivi Maternelle
            </h1>
            <p class="text-xl text-gray-600 dark:text-gray-400">
              Programmes 2025
            </p>
          </div>

          <!-- Choix d'accès -->
          <div class="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <!-- Accès Enseignant -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow cursor-pointer group" id="teacher-access">
              <div class="text-center">
                <div class="w-16 h-16 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Enseignant
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                  Accédez à la liste des élèves pour gérer les carnets de suivi et évaluer les compétences
                </p>
                <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Gestion des élèves
                  </div>
                  <div class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Évaluation des compétences
                  </div>
                  <div class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Impression des carnets
                  </div>
                </div>
              </div>
            </div>

            <!-- Accès Élève -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow cursor-pointer group" id="student-access">
              <div class="text-center">
                <div class="w-16 h-16 mx-auto mb-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <svg class="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Élève
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                  Prends une photo de tes réalisations pour documenter tes apprentissages
                </p>
                <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Prise de photos facile
                  </div>
                  <div class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Choix de ton nom
                  </div>
                  <div class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Sauvegarde automatique
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Informations -->
          <div class="text-center mt-12">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Application conforme aux programmes de l'école maternelle 2025
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents() {
    // Accès enseignant
    this.querySelector('#teacher-access')?.addEventListener('click', () => {
      router.goToStudentsList();
    });

    // Accès élève
    this.querySelector('#student-access')?.addEventListener('click', () => {
      router.navigateTo({ name: 'student-camera' });
    });
  }
}

customElements.define('home-screen', HomeScreen);
