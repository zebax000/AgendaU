# AgendaU

Agenda local de notas y clases universitarias. Funciona sin internet, sin instalar nada y sin servidor.

## Cómo usarla

1. Descarga o clona el repositorio.
2. Abre `index.html` con doble clic en tu navegador.

## Qué puedes hacer

- Crear notas generales: al entrar aparece un chat que pide el título y la fecha límite con hora.
- La hora se escribe de 0 a 24 (por ejemplo `14:30`) y la app muestra su equivalente en AM/PM.
- Escribir cada nota por líneas, como un cuaderno. El punto de la izquierda alterna entre título (rosa) y texto (gris). Los puntos solo aparecen al editar.
- Agregar clases con nombre del curso y, de forma opcional, nombre, correo y celular del profesor y horarios de asesoría.
- Abrir una clase para ver sus pestañas de Notas y Tareas. Cada clase tiene botones **+ Nota** y **+ Tarea** en la barra izquierda.
- Marcar tareas como hechas, editar y eliminar notas, tareas y clases (el menú de tres puntos).

## Datos y copias de seguridad

Todo se guarda en el navegador (IndexedDB) y sigue ahí aunque cierres el HTML.
La app también pide al navegador que no borre esos datos automáticamente.

Si limpias los datos del sitio o cambias de navegador se pierden. Para evitarlo usa **Exportar copia** (barra izquierda) de vez en cuando y guárdala en la carpeta `backups/`, que Git ignora. **Importar copia** vuelve a cargarla.

## Estructura

- `index.html`: página principal.
- `css/`: estilos (`base.css`, `notes.css`, `classes.css`).
- `js/`: lógica separada por responsabilidad, con clases.
  - `utils.js`: ids, fechas y hora de 0 a 24.
  - `db.js`: acceso a IndexedDB (repositorios).
  - `editor.js`: nota abierta, lectura y edición por líneas.
  - `notes.js`: chat de nueva nota y lista de notas.
  - `classes.js`: panel de clases y su formulario.
  - `tasks.js`: tareas de cada clase.
  - `classview.js`: vista de una clase con sus pestañas.
  - `backup.js`: exportar e importar copias.
  - `main.js`: arranque y conexión de las piezas.
- `docs/`: modelo de datos.
- `backups/`: copias de seguridad (ignoradas por Git).

## Paleta

Tres colores pastel: azul `#8FBCE6`, rosa `#F4A7B9` y lavanda `#B9A7E0`, con blanco y gris oscuro para el texto.

## Estado

- [x] Etapa 1: base y estilos
- [x] Etapa 2: datos (IndexedDB)
- [x] Etapa 3: notas (chat de nueva nota, lista, eliminar)
- [x] Etapa 4: editor por líneas
- [x] Etapa 5: clases, notas y tareas
- [x] Etapa 6: respaldo y pulido
