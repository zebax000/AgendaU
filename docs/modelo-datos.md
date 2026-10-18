# Modelo de datos (IndexedDB)

Base de datos `AgendaU` (version 1) con tres almacenes: `classes`, `notes` y `tasks`.

## classes
- id
- name (obligatorio)
- teacherName, teacherEmail, teacherPhone, officeHours (opcionales)

## notes
- id
- title
- deadline: texto local `AAAA-MM-DDTHH:MM`
- classId: id de la clase, o `null` si es una nota general
- lines: lista de `{ kind: "title" | "text", content: string }`
- createdAt

## tasks
- id
- classId
- title
- deadline
- done (true o false)
- createdAt

## Reglas
- La hora se escribe de 0 a 24 (24 = fin del dia) y la app muestra su equivalente en AM/PM.
- Las notas vencidas siguen visibles; su fecha se muestra en rosa oscuro.
- Las tareas hechas no cuentan como vencidas y pasan al final de la lista.
- Una linea `title` seguida de una linea `text` deja un espacio pequeno (14 px) que se dibuja al mostrar y no se guarda.
- Las notas generales usan `classId: null` y se filtran en JavaScript, porque IndexedDB no indexa valores nulos.
- Borrar una clase borra sus notas y tareas en una sola transaccion.

## Copia de seguridad
Archivo `.json` con esta forma: `{ app, version, exportedAt, classes, notes, tasks }`.
Al importar, los elementos con el mismo id se sobrescriben y los demas se conservan.
