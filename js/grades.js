'use strict';

class GradeForm {
  constructor(onSubmit, onDelete) {
    this.onSubmit = onSubmit;
    this.onDelete = onDelete;
    this.grades = [];
    this.editingId = null;

    const options = GradeCalculator.BLOCKS
      .map((block) => `<option value="${block.id}">${block.label} (${block.weight}%)</option>`)
      .join('');

    this.dialog = document.createElement('dialog');
    this.dialog.id = 'grade-dialog';
    this.dialog.innerHTML = `
      <form id="grade-form">
        <h2 id="grade-form-title">Nueva calificación</h2>
        <p class="bot-message">¿Cómo se llama? (por ejemplo: Taller 1)</p>
        <input type="text" name="name" maxlength="60" required>
        <p class="bot-message">¿Cuánto vale? (% de toda la materia)</p>
        <input type="number" name="weight" min="0.5" max="100" step="0.1" inputmode="decimal" required>
        <p class="grade-hint"></p>
        <p class="bot-message">¿Cuánto sacaste? (de 0 a 5, con un decimal)</p>
        <input type="number" name="score" min="0" max="5" step="0.1" inputmode="decimal" required>
        <p class="bot-message">¿De qué periodo es?</p>
        <select name="block" required>${options}</select>
        <div class="dialog-actions">
          <button type="button" class="danger-btn" data-action="delete" hidden>Eliminar</button>
          <button type="button" class="secondary-btn" data-action="cancel">Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>`;
    document.body.appendChild(this.dialog);

    this.form = this.dialog.querySelector('form');
    this.hint = this.dialog.querySelector('.grade-hint');
    this.deleteButton = this.dialog.querySelector('[data-action="delete"]');
    this.bindEvents();
  }

  bindEvents() {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submit();
    });
    this.field('block').addEventListener('change', () => this.syncBlock());
    this.field('weight').addEventListener('input', () => this.syncBlock());
    this.dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => this.close());
    this.deleteButton.addEventListener('click', () => this.remove());
  }

  field(name) {
    return this.form.elements.namedItem(name);
  }

  open(grades, grade = null) {
    this.grades = grades;
    this.editingId = grade ? grade.id : null;
    this.form.reset();
    this.field('weight').readOnly = false;
    this.dialog.querySelector('#grade-form-title').textContent = grade ? 'Editar calificación' : 'Nueva calificación';
    this.deleteButton.hidden = !grade;

    if (grade) {
      this.field('name').value = grade.name;
      this.field('weight').value = grade.weight;
      this.field('score').value = grade.score.toFixed(1);
      this.field('block').value = grade.block;
    } else {
      const open = GradeCalculator.BLOCKS.find(
        (block) => GradeCalculator.usedWeight(grades, block.id) < block.weight
      );
      this.field('block').value = (open ?? GradeCalculator.BLOCKS[0]).id;
    }

    this.syncBlock();
    this.dialog.showModal();
    this.field('name').focus();
  }

  close() {
    this.dialog.close();
  }

  syncBlock() {
    const block = GradeCalculator.getBlock(this.field('block').value);
    const weight = this.field('weight');
    const isFinal = block.id === 'final';
    const hasOtherFinal = this.grades.some((grade) => grade.block === 'final' && grade.id !== this.editingId);
    const used = GradeCalculator.usedWeight(this.grades, block.id, this.editingId);
    const available = GradeCalculator.round(block.weight - used);

    if (isFinal) weight.value = block.weight;
    else if (weight.readOnly) weight.value = '';
    weight.readOnly = isFinal;

    this.hint.textContent = isFinal
      ? 'El final vale 25% y tiene una sola nota.'
      : `Disponible en el ${block.label.toLowerCase()}: ${available}% de ${block.weight}%.`;
    weight.setCustomValidity(
      !isFinal && Number(weight.value) > available ? `Solo quedan ${available}% en este periodo.` : ''
    );
    this.field('block').setCustomValidity(
      isFinal && hasOtherFinal ? 'Ya registraste el final. Edítalo desde la tabla.' : ''
    );
  }

  remove() {
    const id = this.editingId;
    this.close();
    this.onDelete(id);
  }

  async submit() {
    const name = this.field('name').value.trim();
    const weight = Number(this.field('weight').value);
    const score = Math.round(Number(this.field('score').value) * 10) / 10;
    if (!name || !(weight > 0) || Number.isNaN(score)) return;
    const block = this.field('block').value;
    this.close();
    await this.onSubmit(this.editingId, { name, weight, score, block });
  }
}

class GradeBoard {
  constructor(gradeRepository, container) {
    this.gradeRepository = gradeRepository;
    this.container = container;
    this.classId = null;
    this.grades = [];
    this.form = new GradeForm(
      (id, data) => this.saveGrade(id, data),
      (id) => this.deleteGrade(id)
    );
    this.container.addEventListener('click', (event) => this.handleClick(event));
    this.container.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  async show(classId) {
    this.classId = classId;
    await this.render();
  }

  addGrade() {
    this.form.open(this.grades);
  }

  async render() {
    const previousScroll = this.container.querySelector('.grades-scroll')?.scrollTop ?? 0;
    this.grades = await this.gradeRepository.getByClass(this.classId);
    const analysis = GradeCalculator.analyze(this.grades);

    this.container.innerHTML = `
      <p class="grades-rule">Las notas que aún no tienes cuentan como 0.</p>
      <div class="grades-scroll">
        ${analysis.blocks.map((block) => this.renderBlock(block)).join('')}
        ${this.renderAnalysis(analysis)}
      </div>`;
    this.container.querySelector('.grades-scroll').scrollTop = previousScroll;
  }

  renderBlock(block) {
    const percent = Math.min(100, (block.registered / block.weight) * 100);
    const rows = block.grades.length
      ? block.grades.map((grade) => this.renderRow(grade)).join('')
      : '<tr class="grade-empty"><td colspan="4">Sin calificaciones en este periodo.</td></tr>';

    return `
      <section class="grade-block${block.complete ? ' complete' : ''}">
        <header class="grade-block-header">
          <h3>${block.label} · ${block.weight}%</h3>
          <span class="grade-progress-text">Registrado ${block.registered}% de ${block.weight}%</span>
        </header>
        <div class="grade-progress"><div class="grade-progress-bar" style="width: ${percent}%"></div></div>
        <table class="grade-table">
          <thead><tr><th>Nombre</th><th>Vale</th><th>Nota</th><th>Aporte</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td>Total registrado</td>
              <td>${block.registered}%</td>
              <td></td>
              <td>${block.points.toFixed(2)} / ${block.maxPoints.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <p class="grade-note">Nota del periodo: <strong>${block.score.toFixed(1)}</strong> / 5.0</p>
      </section>`;
  }

  renderRow(grade) {
    const points = GradeCalculator.pointsOf(grade);
    return `
      <tr class="grade-row" data-id="${grade.id}" tabindex="0" title="Haz clic para editar">
        <td>${Utils.escapeHtml(grade.name)}</td>
        <td>${grade.weight}%</td>
        <td>${grade.score.toFixed(1)}</td>
        <td>${points.toFixed(2)}</td>
      </tr>`;
  }

  renderAnalysis(analysis) {
    if (!analysis.hasData) {
      return `
        <section class="grade-analysis">
          <h3>Análisis</h3>
          <p class="empty">Agrega una calificación para ver tu análisis.</p>
        </section>`;
    }

    const messages = this.buildMessages(analysis)
      .map(([type, text]) => `<li class="grade-message ${type}">${text}</li>`)
      .join('');
    const maxPossible = Math.min(GradeCalculator.MAX_SCORE, analysis.maxPossible);

    return `
      <section class="grade-analysis">
        <h3>Análisis</h3>
        <div class="grade-stats">
          ${this.renderStat('Definitiva actual', analysis.points.toFixed(2))}
          ${this.renderStat('Máximo posible', maxPossible.toFixed(2), 'si sacas 5.0 en lo que falta')}
        </div>
        <ul class="grade-messages">${messages}</ul>
      </section>`;
  }

  renderStat(label, value, hint = '') {
    const note = hint ? `<small>${hint}</small>` : '';
    return `<div class="grade-stat"><span>${label}</span><strong>${value}</strong>${note}</div>`;
  }

  buildMessages(analysis) {
    const passing = GradeCalculator.PASSING.toFixed(1);
    const { neededInCuts: cuts, neededInFinal: final, cutsWeight } = analysis;
    const messages = [];

    if (analysis.status === 'passed') {
      messages.push(['good', `Ya alcanzas ${passing} con lo que llevas.`]);
    } else if (analysis.status === 'impossible') {
      messages.push([
        'bad',
        `Aunque saques 5.0 en todo lo que falta, llegarías a ${analysis.maxPossible.toFixed(2)} y no alcanzas ${passing}.`
      ]);
    } else if (final) {
      if (cuts && cuts.reachable) {
        messages.push([
          '',
          `Para no necesitar nada en el final, necesitas mantener un promedio de ${cuts.needed.toFixed(1)} en el ${cuts.remaining}% que falta de los cortes (${cuts.weight}%).`
        ]);
      } else if (cuts) {
        messages.push(['', 'Aunque saques 5.0 en lo que falta de los cortes, vas a necesitar nota en el final.']);
      }
    } else {
      messages.push([
        '',
        `Para llegar a ${passing} necesitas un promedio de ${analysis.neededOnRemaining.toFixed(1)} en el ${analysis.remainingWeight}% que falta.`
      ]);
    }

    if (final && analysis.status === 'possible') {
      if (final.reachable) {
        messages.push([
          '',
          `Con lo que llevas en los cortes (${cutsWeight}%), necesitas ${final.needed.toFixed(1)} en el final para llegar a ${passing}.`
        ]);
      } else {
        messages.push(['bad', `Con el final solo no alcanzas ${passing}: necesitas sumar más en los cortes.`]);
      }
    }
    return messages;
  }

  handleClick(event) {
    const row = event.target.closest('.grade-row');
    if (row) this.editRow(row);
  }

  handleKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = event.target.closest('.grade-row');
    if (!row) return;
    event.preventDefault();
    this.editRow(row);
  }

  editRow(row) {
    const grade = this.grades.find((item) => item.id === row.dataset.id);
    if (grade) this.form.open(this.grades, grade);
  }

  async saveGrade(id, data) {
    const existing = id ? this.grades.find((item) => item.id === id) : null;
    const record = { ...(existing ?? { id: Utils.generateId(), classId: this.classId }), ...data };
    await this.gradeRepository.save(record);
    await this.render();
  }

  async deleteGrade(id) {
    if (!confirm('¿Eliminar esta calificación?')) return;
    await this.gradeRepository.remove(id);
    await this.render();
  }
}
