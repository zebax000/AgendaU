'use strict';

class ClassForm {
  constructor(onSubmit) {
    this.onSubmit = onSubmit;
    this.editingId = null;
    this.dialog = document.createElement('dialog');
    this.dialog.id = 'class-dialog';
    this.dialog.innerHTML = `
      <form id="class-form">
        <h2 id="class-form-title">Nueva clase</h2>
        <label>Nombre del curso *
          <input type="text" name="name" maxlength="80" required>
        </label>
        <p class="form-hint">Datos del profesor (opcionales)</p>
        <label>Correo
          <input type="email" name="teacherEmail" maxlength="100">
        </label>
        <label>Celular
          <input type="tel" name="teacherPhone" maxlength="30">
        </label>
        <label>Horarios de asesoría
          <input type="text" name="officeHours" maxlength="150" placeholder="Ej: martes 2-4 pm, oficina 301">
        </label>
        <div class="dialog-actions">
          <button type="button" class="secondary-btn" data-action="cancel">Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>`;
    document.body.appendChild(this.dialog);
    this.form = this.dialog.querySelector('form');
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

  open(classData = null) {
    this.editingId = classData ? classData.id : null;
    this.form.reset();
    this.dialog.querySelector('#class-form-title').textContent = classData ? 'Editar clase' : 'Nueva clase';
    if (classData) {
      ['name', 'teacherEmail', 'teacherPhone', 'officeHours'].forEach((key) => {
        this.field(key).value = classData[key] ?? '';
      });
    }
    this.dialog.showModal();
    this.field('name').focus();
  }

  close() {
    this.dialog.close();
  }

  async submit() {
    const data = {
      name: this.field('name').value.trim(),
      teacherEmail: this.field('teacherEmail').value.trim(),
      teacherPhone: this.field('teacherPhone').value.trim(),
      officeHours: this.field('officeHours').value.trim()
    };
    if (!data.name) return;
    this.close();
    await this.onSubmit(this.editingId, data);
  }
}

class ClassPanel {
  constructor(classRepository) {
    this.classRepository = classRepository;
    this.zone = document.getElementById('classes-zone');
    this.form = new ClassForm((id, data) => this.saveClass(id, data));
    this.zone.innerHTML = `
      <div class="classes-header">
        <h2>Clases</h2>
        <button type="button" id="add-class-btn">+ Agregar clase</button>
      </div>
      <ul id="classes-list"></ul>`;
    this.listElement = this.zone.querySelector('#classes-list');
    this.bindEvents();
  }

  bindEvents() {
    this.zone.querySelector('#add-class-btn').addEventListener('click', () => this.form.open());
    this.listElement.addEventListener('click', (event) => this.handleClick(event));
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.class-menu')) this.closeMenus();
    });
  }

  async start() {
    await this.render();
  }

  async render() {
    const classes = await this.classRepository.getAll();
    classes.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    this.listElement.innerHTML = classes.length
      ? classes.map((classData) => this.createItem(classData)).join('')
      : '<li class="empty-classes">Aún no has agregado clases.</li>';
  }

  createItem(classData) {
    return `
      <li class="class-item" data-id="${classData.id}">
        <div class="class-info">
          <span class="class-name">${Utils.escapeHtml(classData.name)}</span>
          ${this.renderDetails(classData)}
        </div>
        <div class="class-menu">
          <button type="button" class="menu-btn" data-action="menu" aria-label="Opciones de la clase">&#8942;</button>
          <div class="menu" hidden>
            <button type="button" data-action="edit">Editar clase</button>
            <button type="button" class="danger" data-action="delete">Eliminar</button>
          </div>
        </div>
      </li>`;
  }

  renderDetails(classData) {
    const rows = [];
    if (classData.teacherEmail) rows.push(['Correo', classData.teacherEmail]);
    if (classData.teacherPhone) rows.push(['Celular', classData.teacherPhone]);
    if (classData.officeHours) rows.push(['Asesoría', classData.officeHours]);
    return rows
      .map(([label, value]) => `<span class="class-detail">${label}: ${Utils.escapeHtml(value)}</span>`)
      .join('');
  }

  async handleClick(event) {
    const item = event.target.closest('.class-item');
    const actionElement = event.target.closest('[data-action]');
    if (!item || !actionElement) return;
    const id = item.dataset.id;

    switch (actionElement.dataset.action) {
      case 'menu':
        this.toggleMenu(item);
        break;
      case 'edit':
        this.closeMenus();
        this.form.open(await this.classRepository.getById(id));
        break;
      case 'delete':
        await this.deleteClass(id);
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

  async saveClass(id, data) {
    const existing = id ? await this.classRepository.getById(id) : null;
    const record = { ...(existing ?? { id: Utils.generateId() }), ...data };
    await this.classRepository.save(record);
    await this.render();
  }

  async deleteClass(id) {
    const classData = await this.classRepository.getById(id);
    const message = `¿Eliminar la clase "${classData.name}" y todas sus notas y tareas?`;
    if (!confirm(message)) return;
    await this.classRepository.removeWithContent(id);
    await this.render();
  }
}
