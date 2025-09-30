// Application Carnet de Suivi GS
console.log('🚀 Démarrage de l\'application...');

const app = document.getElementById('app')!;

// Import des composants et services
async function initApp() {
  try {
    // Import des modules principaux
    await Promise.all([
      import('./components/students-list.js'),
      import('./components/student-detail.js'),
      import('./components/student-modal.js'),
      import('./components/meta-modal.js'),
      import('./components/synthese-modal.js'),
      import('./components/home-screen.js'),
      import('./components/student-camera.js'),
      import('./components/student-print.js'),
      import('./components/domain-card.js'),
      import('./components/temp-photos-manager.js'),
      import('./components/backup-manager.js'),
      import('./services/backup.js'),
      import('./utils/events.js')
    ]);

    // Import du router
    const { router } = await import('./utils/router.js');
    
    // Fonction de rendu basée sur la route
    function renderApp() {
      const route = router.getCurrentRoute();
      console.log('📍 Route actuelle:', route);

      switch (route.name) {
        case 'home':
          app.innerHTML = '<home-screen></home-screen>';
          break;
        case 'students-list':
          app.innerHTML = '<students-list></students-list>';
          break;
        case 'student-detail':
          app.innerHTML = `<student-detail student-id="${route.studentId}"></student-detail>`;
          break;
        case 'student-print':
          app.innerHTML = `<student-print student-id="${route.studentId}"></student-print>`;
          break;
        case 'student-camera':
          app.innerHTML = '<student-camera></student-camera>';
          break;
        case 'temp-photos':
          app.innerHTML = '<temp-photos-manager></temp-photos-manager>';
          break;
        case 'backup-manager':
          app.innerHTML = '<backup-manager></backup-manager>';
          break;
        default:
          app.innerHTML = '<home-screen></home-screen>';
          break;
      }
    }

    // Écouter les changements de route
    router.addListener(renderApp);
    
    // Premier rendu
    renderApp();
    
    console.log('✅ Application démarrée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    
    // Affichage d'erreur
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div class="max-w-md mx-auto text-center p-6">
          <div class="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Erreur de chargement
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Impossible de démarrer l'application
          </p>
          <button onclick="location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Recharger la page
          </button>
        </div>
      </div>
    `;
  }
}

// Démarrer l'application
initApp();
