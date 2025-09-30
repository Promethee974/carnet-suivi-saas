// Déclaration des types globaux

declare global {
  interface DocumentEventMap {
    'temp-photos-updated': CustomEvent<{ count: number }>;
  }
}

export {}; // Ceci est nécessaire pour que le fichier soit considéré comme un module
