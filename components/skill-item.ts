import { getCarnet, updateSkill, addPhotoToSkill, removePhotoFromSkill } from '../store/repo.js';
import { Photo, ID } from '../data/schema.js';
import { emitSkillUpdate } from '../utils/events.js';

export class SkillItem extends HTMLElement {
  private studentId: ID = '';
  private skillId = '';
  private text = '';

  static get observedAttributes() {
    return ['student-id', 'data-skill-id', 'data-text'];
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (!value) return;
    if (name === 'student-id') this.studentId = value;
    if (name === 'data-skill-id') this.skillId = value;
    if (name === 'data-text') this.text = value;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  private async render() {
    if (!this.studentId || !this.skillId) return;
    
    const carnet = await getCarnet(this.studentId);
    if (!carnet) return;
    const entry = carnet.skills[this.skillId];
    if (!entry) return;

    this.innerHTML = `
      <article class="card p-3" aria-labelledby="skill-${this.skillId}">
        <header class="flex items-start justify-between gap-3">
          <h4 id="skill-${this.skillId}" class="font-medium">${this.text}</h4>
          <div class="radio-group" role="radiogroup" aria-label="État de la compétence">
            ${this.renderRadio('', '—', entry.status === '')}
            ${this.renderRadio('NA', 'NA', entry.status === 'NA')}
            ${this.renderRadio('EC', 'EC', entry.status === 'EC')}
            ${this.renderRadio('A', 'A', entry.status === 'A')}
          </div>
        </header>
        <div class="mt-3 grid md:grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500" for="comment-${this.skillId}">Observation</label>
            <textarea id="comment-${this.skillId}" class="textarea h-24" placeholder="Ajouter une observation...">${entry.comment || ''}</textarea>
          </div>
          <div>
            <photo-gallery skill-id="${this.skillId}"></photo-gallery>
          </div>
        </div>
      </article>
    `;

    // Hook up photo-gallery
    const gallery = this.querySelector('photo-gallery') as any;
    gallery.setPhotos(entry.photos || []);
    gallery.setCallbacks(
      async (photo: Photo) => {
        await addPhotoToSkill(this.studentId, this.skillId, photo);
        await this.render();
      },
      async (photoId: string) => {
        await removePhotoFromSkill(this.studentId, this.skillId, photoId);
        await this.render();
      }
    );

    // Radios
    this.querySelectorAll(`input[name="status-${this.skillId}"]`).forEach(r => {
      r.addEventListener('change', async (e) => {
        const value = (e.target as HTMLInputElement).value as ''|'NA'|'EC'|'A';
        await updateSkill(this.studentId, this.skillId, { status: value });
        
        // Émettre l'événement de mise à jour
        const domainId = this.skillId.split('.')[0]; // Extraire l'ID du domaine
        emitSkillUpdate(this.studentId, this.skillId, domainId, value);
      });
    });

    // Comment textarea with debounce
    const textarea = this.querySelector(`#comment-${this.skillId}`) as HTMLTextAreaElement;
    let t: number | undefined;
    textarea.addEventListener('input', () => {
      window.clearTimeout(t);
      t = window.setTimeout(async () => {
        await updateSkill(this.studentId, this.skillId, { comment: textarea.value });
        
        // Émettre l'événement de mise à jour (commentaire modifié)
        const domainId = this.skillId.split('.')[0];
        emitSkillUpdate(this.studentId, this.skillId, domainId, 'comment');
      }, 400);
    });
  }

  private renderRadio(idSuffix: string, label: string, checked: boolean) {
    const id = `status-${this.skillId}-${idSuffix || 'none'}`;
    let color = 'text-gray-600';
    if (label === 'A') color = 'text-green-600';
    else if (label === 'EC') color = 'text-blue-600';
    else if (label === 'NA') color = 'text-red-600';
    
    return `
      <label for="${id}" class="radio-item ${color}">
        <input id="${id}" class="radio-input" type="radio" name="status-${this.skillId}" value="${idSuffix}" ${checked ? 'checked' : ''} />
        <span>${label}</span>
      </label>
    `;
  }
}

customElements.define('skill-item', SkillItem);
