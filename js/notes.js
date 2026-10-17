'use strict';

class NoteDialog {
  constructor(onSubmit) {
    this.onSubmit = onSubmit;
    this.dialog = document.getElementById('note-dialog');
    this.form = document.getElementById('note-form');
    this.titleInput = document.getElementById('note-title');
    this.deadlineInput = document.getElementById('note-deadline');
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
    this.dialog.showModal();
    this.titleInput.focus();
  }

  close() {
    this.dialog.close();
  }

  async submit() {
    const title = this.titleInput.value.trim();
    if (!title) return;
    await this.onSubmit({ title, deadline: this.deadlineInput.value });
    this.close();
  }
}

class NoteList {
  constructor(noteRepository) {
    this.noteRepository = noteRepository;
    this.listElement = document.getElementById('notes-list');
    this.listElement.addEventListener('click', (event) => this.handleClick(event));
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
        <button type="button" class="delete-btn" data-action="delete">Eliminar</button>
      </li>`;
  }

  async handleClick(event) {
    const button = event.target.closest('[data-action="delete"]');
    if (!button) return;
    if (!confirm('¿Eliminar esta nota?')) return;
    const id = button.closest('.note-item').dataset.id;
    await this.noteRepository.remove(id);
    await this.render();
  }
}

class NotesSection {
  constructor(noteRepository) {
    this.noteRepository = noteRepository;
    this.list = new NoteList(noteRepository);
    this.dialog = new NoteDialog((data) => this.createNote(data));
    document.getElementById('new-note-btn').addEventListener('click', () => this.dialog.open());
  }

  async start() {
    await this.list.render();
    this.dialog.open();
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
  }
}
