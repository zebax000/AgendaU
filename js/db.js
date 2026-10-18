'use strict';

class Database {
  static NAME = 'AgendaU';
  static VERSION = 2;

  constructor() {
    this.connection = null;
  }

  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(Database.NAME, Database.VERSION);
      request.onupgradeneeded = () => this.createStores(request.result);
      request.onblocked = () => {
        console.warn('Cierra las otras pestañas de AgendaU para actualizar la base de datos.');
      };
      request.onsuccess = () => {
        this.connection = request.result;
        this.connection.onversionchange = () => this.connection.close();
        resolve(this);
      };
      request.onerror = () => reject(request.error);
    });
  }

  createStores(db) {
    if (!db.objectStoreNames.contains('classes')) {
      db.createObjectStore('classes', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('notes')) {
      db.createObjectStore('notes', { keyPath: 'id' }).createIndex('classId', 'classId');
    }
    if (!db.objectStoreNames.contains('tasks')) {
      db.createObjectStore('tasks', { keyPath: 'id' }).createIndex('classId', 'classId');
    }
    if (!db.objectStoreNames.contains('grades')) {
      db.createObjectStore('grades', { keyPath: 'id' }).createIndex('classId', 'classId');
    }
  }

  run(storeName, mode, action) {
    return new Promise((resolve, reject) => {
      const transaction = this.connection.transaction(storeName, mode);
      const request = action(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
}

class Repository {
  constructor(database, storeName) {
    this.database = database;
    this.storeName = storeName;
  }

  save(item) {
    return this.database.run(this.storeName, 'readwrite', (store) => store.put(item));
  }

  getAll() {
    return this.database.run(this.storeName, 'readonly', (store) => store.getAll());
  }

  getById(id) {
    return this.database.run(this.storeName, 'readonly', (store) => store.get(id));
  }

  remove(id) {
    return this.database.run(this.storeName, 'readwrite', (store) => store.delete(id));
  }

  getByClass(classId) {
    return this.database.run(this.storeName, 'readonly', (store) =>
      store.index('classId').getAll(IDBKeyRange.only(classId))
    );
  }
}

class NoteRepository extends Repository {
  constructor(database) {
    super(database, 'notes');
  }

  async getGeneral() {
    const notes = await this.getAll();
    return notes.filter((note) => note.classId === null);
  }
}

class TaskRepository extends Repository {
  constructor(database) {
    super(database, 'tasks');
  }
}

class GradeRepository extends Repository {
  constructor(database) {
    super(database, 'grades');
  }
}

class ClassRepository extends Repository {
  constructor(database) {
    super(database, 'classes');
  }

  removeWithContent(classId) {
    return new Promise((resolve, reject) => {
      const transaction = this.database.connection.transaction(
        ['classes', 'notes', 'tasks', 'grades'],
        'readwrite'
      );
      transaction.objectStore('classes').delete(classId);

      ['notes', 'tasks', 'grades'].forEach((storeName) => {
        const store = transaction.objectStore(storeName);
        store.index('classId').openKeyCursor(IDBKeyRange.only(classId)).onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
          }
        };
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
