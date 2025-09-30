import { ID } from '../data/schema.js';

export type Route = 
  | { name: 'home' }
  | { name: 'students-list' }
  | { name: 'student-detail'; studentId: ID }
  | { name: 'student-print'; studentId: ID }
  | { name: 'student-camera' }
  | { name: 'temp-photos' }
  | { name: 'backup-manager' };

export class Router {
  private currentRoute: Route = { name: 'students-list' };
  private listeners: ((route: Route) => void)[] = [];

  constructor() {
    window.addEventListener('hashchange', () => this.handleHashChange());
    window.addEventListener('popstate', () => this.handleHashChange());
    this.handleHashChange();
  }

  private handleHashChange() {
    const hash = window.location.hash.slice(1); // Remove #
    const route = this.parseHash(hash);
    this.setRoute(route);
  }

  private parseHash(hash: string): Route {
    if (!hash || hash === '/') {
      return { name: 'home' };
    }

    const parts = hash.split('/').filter(Boolean);
    
    if (parts[0] === 'students') {
      return { name: 'students-list' };
    }
    
    if (parts[0] === 'camera') {
      return { name: 'student-camera' };
    }
    
    if (parts[0] === 'photos') {
      return { name: 'temp-photos' };
    }
    
    if (parts[0] === 'backup') {
      return { name: 'backup-manager' };
    }
    
    if (parts[0] === 'student' && parts[1]) {
      const studentId = parts[1];
      
      if (parts[2] === 'print') {
        return { name: 'student-print', studentId };
      }
      
      return { name: 'student-detail', studentId };
    }

    // Route inconnue, retour à l'accueil
    return { name: 'home' };
  }

  private routeToHash(route: Route): string {
    switch (route.name) {
      case 'home':
        return '#/';
      case 'students-list':
        return '#/students';
      case 'student-camera':
        return '#/camera';
      case 'temp-photos':
        return '#/photos';
      case 'backup-manager':
        return '#/backup';
      case 'student-detail':
        return `#/student/${route.studentId}`;
      case 'student-print':
        return `#/student/${route.studentId}/print`;
      default:
        return '#/';
    }
  }

  public getCurrentRoute(): Route {
    return this.currentRoute;
  }

  public navigateTo(route: Route, replace = false) {
    const hash = this.routeToHash(route);
    
    if (replace) {
      window.history.replaceState(null, '', hash);
    } else {
      window.history.pushState(null, '', hash);
    }
    
    this.setRoute(route);
  }

  public goBack() {
    window.history.back();
  }

  private setRoute(route: Route) {
    this.currentRoute = route;
    this.listeners.forEach(listener => listener(route));
  }

  public onRouteChange(listener: (route: Route) => void) {
    this.listeners.push(listener);
    
    // Retourner une fonction de nettoyage
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public addListener(listener: (route: Route) => void) {
    return this.onRouteChange(listener);
  }

  // Méthodes utilitaires pour la navigation
  public goToStudentsList() {
    this.navigateTo({ name: 'students-list' });
  }

  public goToStudentDetail(studentId: ID) {
    this.navigateTo({ name: 'student-detail', studentId });
  }

  public goToStudentPrint(studentId: ID) {
    this.navigateTo({ name: 'student-print', studentId });
  }
}

// Instance singleton du routeur
export const router = new Router();
