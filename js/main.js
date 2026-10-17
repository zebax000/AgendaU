'use strict';

class App {
  constructor() {
    this.database = new Database();
  }

  async start() {
    await this.database.open();
    this.noteRepository = new NoteRepository(this.database);
    this.classRepository = new ClassRepository(this.database);
    this.taskRepository = new TaskRepository(this.database);

    window.agenda = this;

    const notes = await this.noteRepository.getAll();
    console.log(`AgendaU lista. Notas guardadas: ${notes.length}`);
  }
}

new App().start().catch((error) => {
  console.error('No se pudo iniciar AgendaU:', error);
});
