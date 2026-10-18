'use strict';

class QuickCalculator {
  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.id = 'quick-dialog';
    this.dialog.innerHTML = `
      <form id="quick-form">
        <h2>¿Cuánto me falta para el final?</h2>
        <p class="quick-intro">Ingresa aquí tus notas actuales:</p>
        <div class="quick-rows"></div>
        <button type="button" class="quick-add" data-quick="add">+ Agregar nota</button>
        <p class="quick-result" hidden></p>
        <div class="dialog-actions">
          <button type="button" class="secondary-btn" data-quick="close">Cerrar</button>
          <button type="submit">Calcular nota</button>
        </div>
      </form>`;
    document.body.appendChild(this.dialog);

    this.form = this.dialog.querySelector('form');
    this.rows = this.dialog.querySelector('.quick-rows');
    this.result = this.dialog.querySelector('.quick-result');
    this.bindEvents();
  }

  mount(referenceButton) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'quick-calc-btn';
    button.textContent = '¿Cuánto me falta para el final?';
    button.addEventListener('click', () => this.open());
    referenceButton.before(button);
  }

  bindEvents() {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.calculate();
    });
    this.form.addEventListener('click', (event) => {
      const control = event.target.closest('[data-quick]');
      if (!control) return;
      if (control.dataset.quick === 'add') this.addRow();
      else if (control.dataset.quick === 'remove') this.removeRow(control.closest('.quick-row'));
      else this.dialog.close();
    });
  }

  open() {
    this.rows.innerHTML = '';
    this.result.hidden = true;
    this.addRow();
    this.dialog.showModal();
    this.rows.querySelector('input').focus();
  }

  addRow() {
    const row = document.createElement('div');
    row.className = 'quick-row';
    row.innerHTML = `
      <input type="number" name="score" min="0" max="5" step="0.1" inputmode="decimal" placeholder="Nota" aria-label="Nota" required>
      <input type="number" name="percent" min="0.1" max="100" step="0.1" inputmode="decimal" placeholder="Porcentaje %" aria-label="Porcentaje" required>
      <button type="button" class="quick-remove" data-quick="remove" aria-label="Quitar nota">×</button>`;
    this.rows.appendChild(row);
    this.refreshRemoveButtons();
    row.querySelector('input').focus();
  }

  removeRow(row) {
    row.remove();
    this.refreshRemoveButtons();
  }

  refreshRemoveButtons() {
    const onlyOne = this.rows.children.length === 1;
    this.rows.querySelectorAll('.quick-remove').forEach((button) => {
      button.hidden = onlyOne;
    });
  }

  calculate() {
    const entries = [...this.rows.children].map((row) => ({
      score: Number(row.querySelector('[name="score"]').value),
      percent: Number(row.querySelector('[name="percent"]').value)
    }));
    this.showResult(GradeCalculator.quick(entries));
  }

  showResult(result) {
    const passing = GradeCalculator.PASSING.toFixed(1);
    let text;
    let bad = false;

    if (result.status === 'invalid') {
      text = `Los porcentajes suman ${result.registered}%, más de 100%. Revísalos.`;
      bad = true;
    } else if (result.status === 'passed') {
      text = `Ya alcanzas ${passing} con lo que llevas (${result.points.toFixed(2)}).`;
    } else if (result.status === 'impossible') {
      text =
        result.remaining === 0
          ? `Ya está el 100% evaluado y quedaste en ${result.points.toFixed(2)}, por debajo de ${passing}.`
          : `Aunque saques 5.0 en el ${result.remaining}% que falta, llegarías a ${result.maxPossible.toFixed(2)} y no alcanzas ${passing}.`;
      bad = true;
    } else {
      text = `Para llegar a ${passing} necesitas un promedio de ${result.needed.toFixed(1)} en el ${result.remaining}% que falta.`;
    }

    this.result.textContent = text;
    this.result.classList.toggle('bad', bad);
    this.result.hidden = false;
  }
}
