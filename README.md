# AgendaU

Agenda local de notas y clases universitarias. Funciona sin internet y sin instalar nada.

## Como usarla

1. Descarga o clona el repositorio.
2. Abre `index.html` con doble clic en tu navegador.

## Datos

Las notas se guardan en el navegador (IndexedDB). Usa los botones de exportar e importar para hacer copias `.json` en la carpeta `backups/`.

## Estructura

- `index.html`: pagina principal.
- `css/`: estilos (base, notas, clases).
- `js/`: logica separada por responsabilidad (POO con clases).
- `docs/`: documentacion del modelo de datos.
- `backups/`: copias de seguridad (ignoradas por Git).

## Estado

- [x] Etapa 1: base y estilos
- [x] Etapa 2: datos (IndexedDB)
- [x] Etapa 3: notas (chat de nueva nota, lista, eliminar)
- [ ] Etapa 4: editor por lineas
- [ ] Etapa 5: clases, notas y tareas
- [ ] Etapa 6: respaldo y pulido
