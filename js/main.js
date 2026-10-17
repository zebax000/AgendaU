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

    this.notesSection = new NotesSection(
      this.noteRepository,
      (classId) => this.classView.backFor(classId)
    );

    this.classView = new ClassView({
      classRepository: this.classRepository,
      noteRepository: this.noteRepository,
      taskRepository: this.taskRepository,
      onOpenNote: (id, mode, back) => this.notesSection.openNote(id, mode, back),
      onNewNote: (classId) => this.notesSection.startNewNote(classId)
    });

    this.classPanel = new ClassPanel(this.classRepository, {
      onOpen: async (id) => {
        await this.notesSection.panel.dismiss();
        await this.classView.open(id);
      },
      onAddNote: async (id) => {
        await this.notesSection.panel.dismiss();
        this.notesSection.startNewNote(id);
      },
      onAddTask: async (id) => {
        await this.notesSection.panel.dismiss();
        await this.classView.open(id, 'tasks');
        this.classView.newTask();
      },
      onChange: (id) => this.classView.syncClass(id)
    });

    await this.classPanel.start();
    await this.notesSection.start();
  }
}

new App().start().catch((error) => {
  console.error('No se pudo iniciar AgendaU:', error);
});
