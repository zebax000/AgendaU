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
- Abrir una clase para ver sus pestañas de Notas, Tareas y Calificaciones. Cada clase tiene botones **+ Nota** y **+ Tarea** en la barra izquierda.
- Marcar tareas como hechas, editar y eliminar notas, tareas y clases (el menú de tres puntos).

## Calificaciones

Cada clase tiene una pestaña **Calificaciones** con tres periodos: primer corte (35%), segundo corte (40%) y final (25%).

- Cada calificación tiene nombre, cuánto vale (% de toda la materia), cuánto sacaste (0 a 5, un decimal) y el periodo.
- Los pesos de un periodo no pueden pasar de su total. No es obligatorio completarlo (por ejemplo 5% + 10% + 20% llena el primer corte).
- El final tiene una sola nota y vale 25%.
- Haz clic en cualquier fila de la tabla para editarla o eliminarla.
- La nota mínima para aprobar es 3.0 y lo que falta por calificar cuenta como 0.
- El análisis muestra la definitiva actual, el máximo posible, qué promedio necesitas en lo que falta de los cortes (75%) para no necesitar nada en el final y qué nota necesitas en el final.

## Calculadora rápida

El botón **¿Cuánto me falta para el final?** (arriba de + Agregar clase) calcula al instante, sin guardar nada: ingresas tus notas con su porcentaje y te dice qué promedio necesitas en el porcentaje que falta para llegar a 3.0.

## Datos y copias de seguridad

Todo se guarda en el navegador (IndexedDB) y sigue ahí aunque cierres el HTML.
La app también pide al navegador que no borre esos datos automáticamente.

Si limpias los datos del sitio o cambias de navegador se pierden. Para evitarlo usa **Exportar copia** (barra izquierda) de vez en cuando y guárdala en la carpeta `backups/`, que Git ignora. **Importar copia** vuelve a cargarla. Las copias incluyen clases, notas, tareas y calificaciones.

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
  - `gradecalc.js`: cálculos de calificaciones (sin interfaz).
  - `grades.js`: formulario y tabla de calificaciones.
  - `quickcalc.js`: calculadora rápida.
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
- [x] Etapa 7: calificaciones por clase
- [x] Etapa 8: calculadora rápida
