'use strict';

class TaskForm {
  constructor(onSubmit) {
    this.onSubmit = onSubmit;
    this.editingId = null;
    this.dialog = document.createElement('dialog');
    this.dialog.id = 'task-dialog';
    this.dialog.innerHTML = `
      <form id="task-form">
        <h2 id="task-form-title">Nueva tarea</h2>
        <label>Título de la tarea *
          <input type="text" name="title" maxlength="100" required>
        </label>
        <label>Fecha límite *
          <input type="date" name="date" required>
        </label>
        <label>Hora (de 0 a 24) *
          <input type="text" name="time" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="Ej: 14:30" required>
          <span class="time-hint"></span>
        </label>
        <div class="dialog-actions">
          <button type="button" class="secondary-btn" data-action="cancel">Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>`;
    document.body.appendChild(this.dialog);
    this.form = this.dialog.querySelector('form');
    this.refreshHint = Utils.bindTimeHint(this.field('time'), this.dialog.querySelector('.time-hint'));
    this.bindEvents();
  }

  bindEvents() {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submit();
    });
    this.dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => this.close());
  }

  field(name) {
    return this.form.elements.namedItem(name);
  }

  open(task = null) {
    this.editingId = task ? task.id : null;
    this.form.reset();
    this.dialog.querySelector('#task-form-title').textContent = task ? 'Editar tarea' : 'Nueva tarea';
    if (task) {
      const { date, time } = Utils.splitDeadline(task.deadline);
      this.field('title').value = task.title;
      this.field('date').value = date;
      this.field('time').value = time;
    } else {
      this.field('date').value = Utils.toLocalIso(new Date()).slice(0, 10);
    }
    this.refreshHint();
    this.dialog.showModal();
    this.field('title').focus();
  }

  close() {
    this.dialog.close();
  }

  async submit() {
    const title = this.field('title').value.trim();
    const deadline = Utils.buildDeadline(this.field('date').value, this.field('time').value);
    if (!title || !deadline) return;
    this.close();
    await this.onSubmit(this.editingId, { title, deadline });
  }
}

class TaskBoard {
  constructor(taskRepository, listElement) {
    this.taskRepository = taskRepository;
    this.listElement = listElement;
    this.classId = null;
    this.form = new TaskForm((id, data) => this.saveTask(id, data));
    this.listElement.addEventListener('click', (event) => this.handleClick(event));
    this.listElement.addEventListener('change', (event) => this.handleChange(event));
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.task-menu')) this.closeMenus();
    });
  }

  async show(classId) {
    this.classId = classId;
    await this.render();
  }

  addTask() {
    this.form.open();
  }

  async render() {
    const tasks = await this.taskRepository.getByClass(this.classId);
    tasks.sort((a, b) => Number(a.done) - Number(b.done) || a.deadline.localeCompare(b.deadline));
    this.listElement.innerHTML = tasks.length
      ? tasks.map((task) => this.createItem(task)).join('')
      : '<li class="empty">Esta clase aún no tiene tareas.</li>';
  }

  createItem(task) {
    const overdue = !task.done && Utils.isOverdue(task.deadline) ? ' overdue' : '';
    const done = task.done ? ' done' : '';
    return `
      <li class="task-item${overdue}${done}" data-id="${task.id}">
        <input type="checkbox" ${task.done ? 'checked' : ''} aria-label="Marcar como hecha">
        <span class="task-title">${Utils.escapeHtml(task.title)}</span>
        <span class="note-deadline">${Utils.formatDeadline(task.deadline)}</span>
        <div class="task-menu">
          <button type="button" class="menu-btn" data-action="menu" aria-label="Opciones de la tarea">&#8942;</button>
          <div class="menu" hidden>
            <button type="button" data-action="edit">Editar tarea</button>
            <button type="button" class="danger" data-action="delete">Eliminar</button>
          </div>
        </div>
      </li>`;
  }

  async handleChange(event) {
    if (!event.target.matches('input[type="checkbox"]')) return;
    const id = event.target.closest('.task-item').dataset.id;
    const task = await this.taskRepository.getById(id);
    task.done = event.target.checked;
    await this.taskRepository.save(task);
    await this.render();
  }

  async handleClick(event) {
    const item = event.target.closest('.task-item');
    const actionElement = event.target.closest('[data-action]');
    if (!item || !actionElement) return;
    const id = item.dataset.id;

    switch (actionElement.dataset.action) {
      case 'menu':
        this.toggleMenu(item);
        break;
      case 'edit':
        this.closeMenus();
        this.form.open(await this.taskRepository.getById(id));
        break;
      case 'delete':
        if (!confirm('¿Eliminar esta tarea?')) return;
        await this.taskRepository.remove(id);
        await this.render();
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

  async saveTask(id, data) {
    const existing = id ? await this.taskRepository.getById(id) : null;
    const record = {
      ...(existing ?? { id: Utils.generateId(), classId: this.classId, done: false, createdAt: new Date().toISOString() }),
      ...data
    };
    await this.taskRepository.save(record);
    await this.render();
  }
}
