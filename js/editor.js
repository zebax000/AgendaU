'use strict';

class NotePanel {
  constructor(noteRepository, onClose) {
    this.noteRepository = noteRepository;
    this.onClose = onClose;
    this.panel = document.getElementById('note-panel');
    this.listView = document.getElementById('notes-view');
    this.note = null;
    this.mode = 'view';
    this.saveTimer = null;
    this.bindEvents();
  }

  bindEvents() {
    this.panel.addEventListener('click', (event) => this.handleClick(event));
    this.panel.addEventListener('input', (event) => this.handleInput(event));
    this.panel.addEventListener('keydown', (event) => this.handleKeydown(event));
    this.panel.addEventListener('paste', (event) => this.handlePaste(event));
  }

  open(note, mode) {
    this.note = note;
    this.listView.hidden = true;
    this.panel.hidden = false;
    this.setMode(mode);
  }

  async close() {
    await this.flush();
    this.panel.hidden = true;
    this.panel.innerHTML = '';
    this.listView.hidden = false;
    this.note = null;
    await this.onClose();
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'edit' && this.note.lines.length === 0) {
      this.note.lines.push({ kind: 'text', content: '' });
    }
    this.render();
    if (mode === 'edit') {
      const last = this.note.lines.length - 1;
      this.focusLine(last, this.note.lines[last].content.length);
    }
  }

  render() {
    const editing = this.mode === 'edit';
    const overdue = Utils.isOverdue(this.note.deadline) ? ' overdue' : '';
    this.panel.innerHTML = `
      <div class="panel-header">
        <button type="button" class="secondary-btn" data-action="back">← Volver</button>
        <div class="panel-info">
          <h1>${Utils.escapeHtml(this.note.title)}</h1>
          <span class="note-deadline${overdue}">${Utils.formatDeadline(this.note.deadline)}</span>
        </div>
        <button type="button" data-action="toggle-mode">${editing ? 'Listo' : 'Editar'}</button>
      </div>
      <p class="save-status" id="save-status"></p>
      <div class="notebook">${this.renderLines(editing)}</div>`;
    this.panel.querySelectorAll('.line-input').forEach((input) => this.autosize(input));
  }

  renderLines(editing) {
    const lines = this.note.lines;
    return lines
      .map((line, index) => {
        const needsSpacer = line.kind === 'title' && lines[index + 1]?.kind === 'text';
        const spacer = needsSpacer ? '<div class="line spacer"></div>' : '';
        return this.renderLine(line, index, editing) + spacer;
      })
      .join('');
  }

  renderLine(line, index, editing) {
    const text = Utils.escapeHtml(line.content);
    if (!editing) {
      return `<div class="line" data-index="${index}"><span class="dot" data-kind="${line.kind}"></span><p class="line-text ${line.kind}">${text}</p></div>`;
    }
    return `<div class="line" data-index="${index}"><button type="button" class="dot" data-kind="${line.kind}" data-action="toggle-kind" tabindex="-1" title="Cambiar entre título y texto"></button><textarea class="line-input ${line.kind}" rows="1" spellcheck="false">${text}</textarea></div>`;
  }

  lineIndex(element) {
    const line = element.closest('.line[data-index]');
    return line ? Number(line.dataset.index) : -1;
  }

  async handleClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    switch (button.dataset.action) {
      case 'back':
        await this.close();
        break;
      case 'toggle-mode':
        await this.flush();
        this.setMode(this.mode === 'edit' ? 'view' : 'edit');
        break;
      case 'toggle-kind':
        this.toggleKind(this.lineIndex(button));
        break;
    }
  }

  handleInput(event) {
    if (!event.target.matches('.line-input')) return;
    const index = this.lineIndex(event.target);
    this.note.lines[index].content = event.target.value;
    this.autosize(event.target);
    this.scheduleSave();
  }

  handleKeydown(event) {
    if (!event.target.matches('.line-input')) return;
    const index = this.lineIndex(event.target);
    const { selectionStart, selectionEnd, value } = event.target;
    const collapsed = selectionStart === selectionEnd;
    const lines = this.note.lines;

    if (event.key === 'Enter') {
      event.preventDefault();
      this.splitLine(index, selectionStart);
    } else if (event.key === 'Backspace' && collapsed && selectionStart === 0 && index > 0) {
      event.preventDefault();
      this.mergeWithPrevious(index);
    } else if (event.key === 'ArrowUp' && collapsed && selectionStart === 0 && index > 0) {
      event.preventDefault();
      this.focusLine(index - 1, lines[index - 1].content.length);
    } else if (event.key === 'ArrowDown' && collapsed && selectionStart === value.length && index < lines.length - 1) {
      event.preventDefault();
      this.focusLine(index + 1, 0);
    }
  }

  handlePaste(event) {
    if (!event.target.matches('.line-input')) return;
    const text = event.clipboardData.getData('text').replace(/\r/g, '');
    if (!text.includes('\n')) return;
    event.preventDefault();

    const index = this.lineIndex(event.target);
    const { value, selectionStart, selectionEnd } = event.target;
    const parts = text.split('\n');
    const after = value.slice(selectionEnd);

    this.note.lines[index].content = value.slice(0, selectionStart) + parts[0];
    const newLines = parts.slice(1).map((content) => ({ kind: 'text', content }));
    const lastLine = newLines[newLines.length - 1];
    const caret = lastLine.content.length;
    lastLine.content += after;

    this.note.lines.splice(index + 1, 0, ...newLines);
    this.render();
    this.focusLine(index + newLines.length, caret);
    this.scheduleSave();
  }

  toggleKind(index) {
    const line = this.note.lines[index];
    line.kind = line.kind === 'title' ? 'text' : 'title';
    this.render();
    this.focusLine(index, line.content.length);
    this.scheduleSave();
  }

  splitLine(index, caret) {
    const line = this.note.lines[index];
    const rest = line.content.slice(caret);
    line.content = line.content.slice(0, caret);
    this.note.lines.splice(index + 1, 0, { kind: 'text', content: rest });
    this.render();
    this.focusLine(index + 1, 0);
    this.scheduleSave();
  }

  mergeWithPrevious(index) {
    const lines = this.note.lines;
    const previous = lines[index - 1];
    const caret = previous.content.length;
    previous.content += lines[index].content;
    lines.splice(index, 1);
    this.render();
    this.focusLine(index - 1, caret);
    this.scheduleSave();
  }

  focusLine(index, caret) {
    const input = this.panel.querySelector(`.line[data-index="${index}"] .line-input`);
    if (!input) return;
    input.focus();
    input.setSelectionRange(caret, caret);
  }

  autosize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  scheduleSave() {
    this.setStatus('Guardando...');
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 400);
  }

  async save() {
    this.saveTimer = null;
    await this.noteRepository.save(this.note);
    this.setStatus('Guardado');
  }

  async flush() {
    if (this.saveTimer === null) return;
    clearTimeout(this.saveTimer);
    await this.save();
  }

  setStatus(text) {
    const status = document.getElementById('save-status');
    if (status) status.textContent = text;
  }
}
