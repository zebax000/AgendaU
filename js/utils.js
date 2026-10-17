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

  static toLocalIso(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  static parseTime(text) {
    const match = /^\s*(\d{1,2})(?::?(\d{2}))?\s*([ap]\.?\s?m\.?)?\s*$/i.exec(text);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = match[2] ? Number(match[2]) : 0;
    const meridiem = match[3] ? match[3][0].toLowerCase() : null;

    if (meridiem) {
      if (hours < 1 || hours > 12) return null;
      hours = (hours % 12) + (meridiem === 'p' ? 12 : 0);
    }
    if (minutes > 59 || hours > 24 || (hours === 24 && minutes > 0)) return null;
    return { hours, minutes };
  }

  static describeTime({ hours, minutes }) {
    if (hours === 24) return '12:00 a. m. (fin del día)';
    const suffix = hours < 12 ? 'a. m.' : 'p. m.';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
  }

  static buildDeadline(dateText, timeText) {
    const time = Utils.parseTime(timeText);
    if (!dateText || !time) return null;
    const [year, month, day] = dateText.split('-').map(Number);
    return Utils.toLocalIso(new Date(year, month - 1, day, time.hours, time.minutes));
  }

  static splitDeadline(isoString) {
    const [date, time] = isoString.split('T');
    return { date, time };
  }

  static bindTimeHint(input, hint) {
    const update = () => {
      const text = input.value.trim();
      const time = Utils.parseTime(text);
      if (!text) {
        hint.textContent = '';
        input.setCustomValidity('');
      } else if (!time) {
        hint.textContent = 'Usa el formato de 0 a 24, por ejemplo 14:30';
        input.setCustomValidity('Escribe la hora de 0 a 24, por ejemplo 14:30');
      } else {
        hint.textContent = `= ${Utils.describeTime(time)}`;
        input.setCustomValidity('');
      }
    };
    input.addEventListener('input', update);
    update();
    return update;
  }
}
