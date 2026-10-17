'use strict';

class NoteDialog {
  constructor(onSubmit) {
    this.onSubmit = onSubmit;
    this.dialog = document.getElementById('note-dialog');
    this.form = document.getElementById('note-form');
    this.titleInput = document.getElementById('note-title');
    this.dateInput = document.getElementById('note-date');
    this.timeInput = document.getElementById('note-time');
    this.refreshTimeHint = Utils.bindTimeHint(
      this.timeInput,
      document.getElementById('note-time-hint')
    );
    this.bindEvents();
  }

  bindEvents() {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submit();
    });
    document.getElementById('note-cancel').addEventListener('click', () => this.close());
  }

  open() {
    this.form.reset();
    this.dateInput.value = Utils.toLocalIso(new Date()).slice(0, 10);
    this.refreshTimeHint();
    this.dialog.showModal();
    this.titleInput.focus();
  }

  close() {
    this.dialog.close();
  }

  async submit() {
    const title = this.titleInput.value.trim();
    const deadline = Utils.buildDeadline(this.dateInput.value, this.timeInput.value);
    if (!title || !deadline) return;
    this.close();
    await this.onSubmit({ title, deadline });
  }
}

class NoteList {
  constructor(noteRepository, onOpen) {
    this.noteRepository = noteRepository;
    this.onOpen = onOpen;
    this.listElement = document.getElementById('notes-list');
    this.listElement.addEventListener('click', (event) => this.handleClick(event));
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.note-menu')) this.closeMenus();
    });
  }

  async render() {
    const notes = await this.noteRepository.getGeneral();
    notes.sort((a, b) => a.deadline.localeCompare(b.deadline));
    this.listElement.innerHTML = notes.length
      ? notes.map((note) => this.createItem(note)).join('')
      : '<li class="empty">Aún no tienes notas.</li>';
  }

  createItem(note) {
    const overdue = Utils.isOverdue(note.deadline) ? ' overdue' : '';
    return `
      <li class="note-item${overdue}" data-id="${note.id}">
        <span class="note-title">${Utils.escapeHtml(note.title)}</span>
        <span class="note-deadline">${Utils.formatDeadline(note.deadline)}</span>
        <div class="note-menu">
          <button type="button" class="menu-btn" data-action="menu" aria-label="Opciones de la nota">&#8942;</button>
          <div class="menu" hidden>
            <button type="button" data-action="edit">Editar contenido</button>
            <button type="button" class="danger" data-action="delete">Eliminar</button>
          </div>
        </div>
      </li>`;
  }

  async handleClick(event) {
    const item = event.target.closest('.note-item');
    if (!item) return;
    const id = item.dataset.id;
    const actionElement = event.target.closest('[data-action]');

    if (!actionElement) {
      if (!event.target.closest('.note-menu')) this.onOpen(id, 'view');
      return;
    }

    switch (actionElement.dataset.action) {
      case 'menu':
        this.toggleMenu(item);
        break;
      case 'edit':
        this.onOpen(id, 'edit');
        break;
      case 'delete':
        await this.deleteNote(id);
        break;
    }
  }

  toggleMenu(item) {
    const menu = item.querySelector('.menu');
    const willOpen = menu.hidden;
    this.closeMenus();
    menu.hidden = !willOpen;
  }

  closeMenus() {
    this.listElement.querySelectorAll('.menu').forEach((menu) => {
      menu.hidden = true;
    });
  }

  async deleteNote(id) {
    if (!confirm('¿Eliminar esta nota?')) return;
    await this.noteRepository.remove(id);
    await this.render();
  }
}

class NotesSection {
  constructor(noteRepository) {
    this.noteRepository = noteRepository;
    this.panel = new NotePanel(noteRepository, () => this.list.render());
    this.list = new NoteList(noteRepository, (id, mode) => this.openNote(id, mode));
    this.dialog = new NoteDialog((data) => this.createNote(data));
    document.getElementById('new-note-btn').addEventListener('click', () => this.dialog.open());
  }

  async start() {
    await this.list.render();
    this.dialog.open();
  }

  async openNote(id, mode) {
    const note = await this.noteRepository.getById(id);
    if (note) this.panel.open(note, mode);
  }

  async createNote({ title, deadline }) {
    const note = {
      id: Utils.generateId(),
      title,
      deadline,
      classId: null,
      lines: [],
      createdAt: new Date().toISOString()
    };
    await this.noteRepository.save(note);
    await this.list.render();
    this.panel.open(note, 'edit');
  }
}
