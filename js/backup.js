'use strict';

class BackupService {
  static FORMAT_VERSION = 1;

  constructor({ classRepository, noteRepository, taskRepository }) {
    this.classRepository = classRepository;
    this.noteRepository = noteRepository;
    this.taskRepository = taskRepository;
  }

  static async requestPersistence() {
    if (!navigator.storage || !navigator.storage.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return navigator.storage.persist();
  }

  mount(container) {
    this.element = document.createElement('div');
    this.element.className = 'backup-bar';
    this.element.innerHTML = `
      <p>Copia de seguridad</p>
      <button type="button" data-backup="export">Exportar copia</button>
      <button type="button" data-backup="import">Importar copia</button>
      <input type="file" accept=".json,application/json" hidden>
      <span class="backup-status" role="status"></span>`;
    container.appendChild(this.element);

    this.fileInput = this.element.querySelector('input[type="file"]');
    this.status = this.element.querySelector('.backup-status');
    this.element.addEventListener('click', (event) => this.handleClick(event));
    this.fileInput.addEventListener('change', () => this.importSelected());
  }

  handleClick(event) {
    const button = event.target.closest('[data-backup]');
    if (!button) return;
    if (button.dataset.backup === 'export') this.exportData();
    else this.fileInput.click();
  }

  setStatus(text) {
    this.status.textContent = text;
  }

  async exportData() {
    const [classes, notes, tasks] = await Promise.all([
      this.classRepository.getAll(),
      this.noteRepository.getAll(),
      this.taskRepository.getAll()
    ]);
    const data = {
      app: 'AgendaU',
      version: BackupService.FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      classes,
      notes,
      tasks
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AgendaU-respaldo-${Utils.toLocalIso(new Date()).slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    this.setStatus(`Copia exportada: ${classes.length} clases, ${notes.length} notas, ${tasks.length} tareas.`);
  }

  async importSelected() {
    const file = this.fileInput.files[0];
    this.fileInput.value = '';
    if (!file) return;

    try {
      const data = JSON.parse(await file.text());
      this.validate(data);
      const message =
        `Se importarán ${data.classes.length} clases, ${data.notes.length} notas y ${data.tasks.length} tareas.\n` +
        'Los elementos con el mismo id se sobrescriben y los demás se conservan. ¿Continuar?';
      if (!confirm(message)) return;

      await this.saveAll(this.classRepository, data.classes);
      await this.saveAll(this.noteRepository, data.notes);
      await this.saveAll(this.taskRepository, data.tasks);
      this.setStatus('Copia importada. Recargando...');
      setTimeout(() => location.reload(), 600);
    } catch (error) {
      this.setStatus(`No se pudo importar: ${error.message}`);
    }
  }

  validate(data) {
    const valid =
      data && data.app === 'AgendaU' && ['classes', 'notes', 'tasks'].every((key) => Array.isArray(data[key]));
    if (!valid) throw new Error('el archivo no es una copia de AgendaU.');

    const items = [...data.classes, ...data.notes, ...data.tasks];
    if (!items.every((item) => item && typeof item.id === 'string')) {
      throw new Error('hay elementos sin id.');
    }
  }

  async saveAll(repository, items) {
    for (const item of items) {
      await repository.save(item);
    }
  }
}
