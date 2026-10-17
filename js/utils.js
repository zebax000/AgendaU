'use strict';

class Utils {
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  static formatDeadline(isoString) {
    return new Date(isoString).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  static isOverdue(isoString) {
    return new Date(isoString) < new Date();
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
