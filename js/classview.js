'use strict';

class ClassView {
  constructor({ classRepository, noteRepository, taskRepository, onOpenNote, onNewNote }) {
    this.classRepository = classRepository;
    this.onOpenNote = onOpenNote;
    this.onNewNote = onNewNote;
    this.classId = null;
    this.notesView = document.getElementById('notes-view');

    this.element = document.createElement('section');
    this.element.id = 'class-view';
    this.element.hidden = true;
    this.element.innerHTML = `
      <div class="class-view-header">
        <button type="button" class="secondary-btn" data-view="exit">← Notas generales</button>
        <div class="class-view-info">
          <h1 id="class-view-name"></h1>
          <div class="class-view-details" id="class-view-details"></div>
        </div>
      </div>
      <div class="tabs">
        <button type="button" class="tab" data-view="tab" data-tab="notes">Notas</button>
        <button type="button" class="tab" data-view="tab" data-tab="tasks">Tareas</button>
      </div>
      <div id="class-notes-tab">
        <div class="tab-toolbar"><button type="button" data-view="new-note">+ Nueva nota</button></div>
        <ul id="class-notes-list"></ul>
      </div>
      <div id="class-tasks-tab" hidden>
        <div class="tab-toolbar"><button type="button" data-view="new-task">+ Nueva tarea</button></div>
        <ul id="class-tasks-list"></ul>
      </div>`;
    document.getElementById('notes-zone').appendChild(this.element);

    this.noteList = new NoteList(
      noteRepository,
      this.element.querySelector('#class-notes-list'),
      () => noteRepository.getByClass(this.classId),
      (id, mode) => this.onOpenNote(id, mode, this.backTarget()),
      'Esta clase aún no tiene notas.'
    );
    this.taskBoard = new TaskBoard(taskRepository, this.element.querySelector('#class-tasks-list'));
    this.element.addEventListener('click', (event) => this.handleClick(event));
  }

  backTarget() {
    return { view: this.element, refresh: () => this.refresh() };
  }

  async backFor(classId) {
    if (this.classId !== classId || this.element.hidden) await this.open(classId);
    return this.backTarget();
  }

  async open(classId, tab = 'notes') {
    const classData = await this.classRepository.getById(classId);
    if (!classData) return;
    this.classId = classId;
    this.renderHeader(classData);
    this.selectTab(tab);
    this.notesView.hidden = true;
    this.element.hidden = false;
    await this.refresh();
  }

  close() {
    this.element.hidden = true;
    this.classId = null;
    this.notesView.hidden = false;
  }

  async refresh() {
    await Promise.all([this.noteList.render(), this.taskBoard.show(this.classId)]);
  }

  async syncClass(classId) {
    if (this.classId !== classId || this.element.hidden) return;
    const classData = await this.classRepository.getById(classId);
    if (classData) this.renderHeader(classData);
    else this.close();
  }

  newTask() {
    this.taskBoard.addTask();
  }

  renderHeader(classData) {
    this.element.querySelector('#class-view-name').textContent = classData.name;
    this.element.querySelector('#class-view-details').innerHTML = ClassPanel.detailRows(classData)
      .map(([label, value]) => `<span><strong>${label}:</strong> ${Utils.escapeHtml(value)}</span>`)
      .join('');
  }

  selectTab(tab) {
    this.element.querySelectorAll('.tab').forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    this.element.querySelector('#class-notes-tab').hidden = tab !== 'notes';
    this.element.querySelector('#class-tasks-tab').hidden = tab !== 'tasks';
  }

  handleClick(event) {
    const control = event.target.closest('[data-view]');
    if (!control) return;
    switch (control.dataset.view) {
      case 'exit':
        this.close();
        break;
      case 'tab':
        this.selectTab(control.dataset.tab);
        break;
      case 'new-note':
        this.onNewNote(this.classId);
        break;
      case 'new-task':
        this.newTask();
        break;
    }
  }
}
