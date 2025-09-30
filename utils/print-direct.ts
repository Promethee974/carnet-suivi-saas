import { getStudent } from '../store/students-repo.js';
import { getCarnet } from '../store/repo.js';
import { getAllDomains } from '../data/skills.js';
import { calculateDomainProgress } from '../utils/progress.js';
import { Student, Carnet, ID } from '../data/schema.js';

export async function printStudentDirect(studentId: ID): Promise<void> {
  try {
    const student = await getStudent(studentId);
    const carnet = await getCarnet(studentId);
    
    if (!student || !carnet) {
      alert('Impossible de charger les données de l\'élève pour l\'impression');
      return;
    }

    // Générer le contenu HTML pour l'impression
    const printContent = generatePrintContent(student, carnet);
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups ne sont pas bloqués.');
      return;
    }

    // Écrire le contenu dans la nouvelle fenêtre
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Carnet de ${student.prenom} ${student.nom}</title>
        <style>
          ${getPrintStyles()}
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);

    printWindow.document.close();

    // Attendre que le contenu soit chargé puis lancer l'impression
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };

  } catch (error) {
    console.error('Erreur lors de l\'impression:', error);
    alert('Erreur lors de la génération du document d\'impression');
  }
}

function generatePrintContent(student: Student, carnet: Carnet): string {
  // Filtrer les domaines qui ont au moins une compétence acquise ou en cours
  const allDomains = getAllDomains(true);
  const evaluatedDomains = allDomains.filter(domain => {
    return domain.skills.some(skill => {
      const entry = carnet.skills[skill.id];
      return entry && (entry.status === 'EC' || entry.status === 'A');
    });
  });

  // Filtrer les compétences évaluées (acquises ou en cours)
  const evaluatedSkills = Object.values(carnet.skills).filter(skill => 
    skill.status === 'EC' || skill.status === 'A'
  );
  
  // Calculer les statistiques
  const acquired = evaluatedSkills.filter(skill => skill.status === 'A').length;
  const inProgress = evaluatedSkills.filter(skill => skill.status === 'EC').length;

  return `
    <div class="print-layout">
      <!-- En-tête -->
      <header class="print-header">
        <div class="school-info">
          <h1>Carnet de Suivi des Apprentissages</h1>
          <h2>Grande Section - Programmes 2025</h2>
        </div>
        <div class="student-info">
          <div class="student-avatar">
            ${student.avatar ? `
              <img src="${student.avatar}" alt="Photo de ${student.prenom}" />
            ` : `
              <div class="avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            `}
          </div>
          <div class="student-details">
            <h3>${student.prenom} ${student.nom}</h3>
            ${student.naissance ? `<p>Né(e) le ${formatDate(student.naissance)}</p>` : ''}
            ${student.sexe ? `<p>${student.sexe === 'F' ? 'Fille' : student.sexe === 'M' ? 'Garçon' : student.sexe}</p>` : ''}
          </div>
        </div>
      </header>

      <!-- Informations du carnet -->
      <section class="carnet-info">
        <div class="info-grid">
          <div class="info-item">
            <strong>Année scolaire :</strong> ${carnet.meta.annee}-${parseInt(carnet.meta.annee) + 1}
          </div>
          <div class="info-item">
            <strong>Enseignant(e) :</strong> ${carnet.meta.enseignant}
          </div>
          <div class="info-item">
            <strong>Période :</strong> Période ${carnet.meta.periode}
          </div>
          <div class="info-item">
            <strong>Date d'édition :</strong> ${formatDate(new Date().toISOString().split('T')[0])}
          </div>
          <div class="info-item">
            <strong>Compétences acquises :</strong> ${acquired}
          </div>
          <div class="info-item">
            <strong>Compétences en cours :</strong> ${inProgress}
          </div>
        </div>
      </section>

      <!-- Domaines évalués -->
      ${evaluatedDomains.map(domain => renderDomainForPrint(domain, carnet)).join('')}

      <!-- Synthèse personnalisée -->
      ${carnet.synthese && (carnet.synthese.forces || carnet.synthese.axes || carnet.synthese.projets) ? `
        <section class="personal-synthesis">
          <h2>Synthèse Personnalisée</h2>
          ${carnet.synthese.forces ? `
            <div class="synthesis-section">
              <h3>Points forts</h3>
              <p>${carnet.synthese.forces}</p>
            </div>
          ` : ''}
          ${carnet.synthese.axes ? `
            <div class="synthesis-section">
              <h3>Axes de progrès</h3>
              <p>${carnet.synthese.axes}</p>
            </div>
          ` : ''}
          ${carnet.synthese.projets ? `
            <div class="synthesis-section">
              <h3>Projets et perspectives</h3>
              <p>${carnet.synthese.projets}</p>
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
    </div>
  `;
}

function renderDomainForPrint(domain: any, carnet: Carnet): string {
  // Filtrer les compétences acquises ou en cours de ce domaine
  const evaluatedSkills = domain.skills.filter((skill: any) => {
    const entry = carnet.skills[skill.id];
    return entry && (entry.status === 'EC' || entry.status === 'A');
  });

  if (evaluatedSkills.length === 0) return '';

  const progress = calculateDomainProgress(domain.id, carnet.skills);

  return `
    <section class="domain-section">
      <div class="domain-header">
        <div class="domain-title">
          <div class="domain-color" style="background-color: ${getColorValue(domain.color)}"></div>
          <h2>${domain.name}</h2>
        </div>
        <div class="domain-stats">
          <span class="domain-progress">${progress.acquired}/${progress.total} acquises (${progress.percentage}%)</span>
        </div>
      </div>
      
      <div class="skills-grid">
        ${evaluatedSkills.map((skill: any) => renderSkillForPrint(skill, carnet)).join('')}
      </div>
    </section>
  `;
}

function renderSkillForPrint(skill: any, carnet: Carnet): string {
  const entry = carnet.skills[skill.id];
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
      ${entry.photos && entry.photos.length > 0 ? renderPhotosForPrint(entry.photos) : ''}
    </div>
  `;
}

function renderPhotosForPrint(photos: any[]): string {
  if (!photos || photos.length === 0) return '';

  // Limiter à 4 photos maximum pour un rendu propre
  const displayPhotos = photos.slice(0, 4);
  const remainingCount = photos.length - displayPhotos.length;

  return `
    <div class="skill-photos">
      <div class="photos-grid ${getPhotosGridClass(displayPhotos.length)}">
        ${displayPhotos.map(photo => `
          <div class="photo-item">
            <img src="${photo.dataURL}" alt="Photo compétence" />
            ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
          </div>
        `).join('')}
        ${remainingCount > 0 ? `
          <div class="photo-item more-photos">
            <div class="more-photos-indicator">
              <span class="more-count">+${remainingCount}</span>
              <span class="more-text">photo${remainingCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function getPhotosGridClass(count: number): string {
  switch (count) {
    case 1: return 'photos-grid-1';
    case 2: return 'photos-grid-2';
    case 3: return 'photos-grid-3';
    case 4: return 'photos-grid-4';
    default: return 'photos-grid-4';
  }
}

function getColorValue(colorClass: string): string {
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getPrintStyles(): string {
  return `
    /* Reset et base */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }
    
    /* Layout principal */
    .print-layout {
      max-width: 190mm;
      margin: 0 auto;
      padding: 10mm;
    }
    
    /* En-tête */
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20pt;
      padding-bottom: 15pt;
      border-bottom: 2pt solid #000;
    }
    
    .school-info h1 {
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 5pt;
    }
    
    .school-info h2 {
      font-size: 14pt;
      color: #666;
    }
    
    .student-info {
      display: flex;
      align-items: center;
      gap: 10pt;
    }
    
    .student-avatar {
      width: 60pt;
      height: 60pt;
      border-radius: 50%;
      overflow: hidden;
      border: 1pt solid #ddd;
    }
    
    .student-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
    
    .avatar-placeholder svg {
      width: 30pt;
      height: 30pt;
    }
    
    .student-details h3 {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 3pt;
    }
    
    .student-details p {
      font-size: 12pt;
      color: #666;
      margin: 1pt 0;
    }
    
    /* Informations carnet */
    .carnet-info {
      margin-bottom: 20pt;
      padding: 10pt;
      background: #f8f9fa;
      border: 1pt solid #ddd;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8pt;
    }
    
    .info-item {
      font-size: 11pt;
    }
    
    /* Domaines */
    .domain-section {
      margin-bottom: 20pt;
      page-break-inside: avoid;
    }
    
    .domain-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10pt;
      padding: 8pt;
      background: #f0f0f0;
      border: 1pt solid #ccc;
    }
    
    .domain-title {
      display: flex;
      align-items: center;
      gap: 8pt;
    }
    
    .domain-color {
      width: 15pt;
      height: 15pt;
      border-radius: 2pt;
    }
    
    .domain-title h2 {
      font-size: 14pt;
      font-weight: bold;
    }
    
    .domain-stats {
      font-size: 12pt;
      font-weight: bold;
    }
    
    /* Compétences */
    .skills-grid {
      display: grid;
      gap: 8pt;
    }
    
    .skill-item {
      padding: 8pt;
      border: 1pt solid #ddd;
      background: #fff;
      page-break-inside: avoid;
    }
    
    .skill-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4pt;
    }
    
    .skill-text {
      font-size: 11pt;
      flex: 1;
      margin-right: 8pt;
    }
    
    .skill-status {
      font-size: 10pt;
      font-weight: bold;
      padding: 2pt 6pt;
      border-radius: 8pt;
      white-space: nowrap;
    }
    
    .skill-status.acquired {
      background: #d1fae5;
      color: #059669;
    }
    
    .skill-status.in-progress {
      background: #dbeafe;
      color: #2563eb;
    }
    
    .skill-status.not-acquired {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .skill-comment {
      margin-top: 6pt;
      padding: 6pt;
      background: #f9fafb;
      border-left: 2pt solid #d1d5db;
      font-style: italic;
      font-size: 10pt;
    }
    
    /* Photos des compétences */
    .skill-photos {
      margin-top: 8pt;
      padding-top: 8pt;
      border-top: 1pt solid #e5e7eb;
    }
    
    .photos-grid {
      display: grid;
      gap: 4pt;
      margin-bottom: 4pt;
    }
    
    .photos-grid-1 {
      grid-template-columns: 1fr;
      max-width: 80pt;
    }
    
    .photos-grid-2 {
      grid-template-columns: 1fr 1fr;
      max-width: 160pt;
    }
    
    .photos-grid-3 {
      grid-template-columns: 1fr 1fr 1fr;
      max-width: 240pt;
    }
    
    .photos-grid-4 {
      grid-template-columns: 1fr 1fr 1fr 1fr;
      max-width: 320pt;
    }
    
    .photo-item {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 3pt;
      border: 1pt solid #d1d5db;
      background: #f9fafb;
    }
    
    .photo-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    
    .photo-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      font-size: 8pt;
      padding: 2pt 4pt;
      line-height: 1.2;
      max-height: 50%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .more-photos {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border: 2pt dashed #9ca3af;
    }
    
    .more-photos-indicator {
      text-align: center;
      color: #6b7280;
    }
    
    .more-count {
      display: block;
      font-size: 14pt;
      font-weight: bold;
      line-height: 1;
    }
    
    .more-text {
      display: block;
      font-size: 8pt;
      margin-top: 2pt;
    }
    
    /* Synthèse personnalisée */
    .personal-synthesis {
      margin-top: 25pt;
      page-break-before: always;
    }
    
    .personal-synthesis h2 {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 15pt;
      text-align: center;
    }
    
    .synthesis-section {
      margin-bottom: 15pt;
    }
    
    .synthesis-section h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 6pt;
      color: #374151;
    }
    
    .synthesis-section p {
      font-size: 11pt;
      line-height: 1.5;
      padding: 8pt;
      border: 1pt solid #d1d5db;
      background: #f9fafb;
      min-height: 40pt;
    }
    
    /* Pied de page */
    .print-footer {
      margin-top: 30pt;
      padding-top: 15pt;
      border-top: 1pt solid #ccc;
    }
    
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15pt;
    }
    
    .signature-block {
      text-align: center;
      width: 150pt;
    }
    
    .signature-block p {
      margin-bottom: 8pt;
      font-weight: bold;
    }
    
    .signature-line {
      height: 1pt;
      background: #000;
      margin-top: 30pt;
    }
    
    .footer-note {
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    /* Optimisations impression */
    @page {
      margin: 15mm;
      size: A4;
    }
    
    @media print {
      .print-layout {
        max-width: none;
        margin: 0;
        padding: 0;
      }
    }
  `;
}
