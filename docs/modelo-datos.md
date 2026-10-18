# Modelo de datos (IndexedDB)

Base de datos `AgendaU` (version 2) con cuatro almacenes: `classes`, `notes`, `tasks` y `grades`.

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

## grades (calificaciones)
- id
- classId
- name: por ejemplo "Taller 1"
- weight: lo que vale sobre el total de la materia, en porcentaje
- score: nota de 0 a 5 con un decimal
- block: `corte1` (35%), `corte2` (40%) o `final` (25%)

## Reglas
- La hora se escribe de 0 a 24 (24 = fin del dia) y la app muestra su equivalente en AM/PM.
- Las notas vencidas siguen visibles; su fecha se muestra en rosa oscuro.
- Las tareas hechas no cuentan como vencidas y pasan al final de la lista.
- Una linea `title` seguida de una linea `text` deja un espacio pequeno (14 px) que se dibuja al mostrar y no se guarda.
- Las notas generales usan `classId: null` y se filtran en JavaScript, porque IndexedDB no indexa valores nulos.
- Borrar una clase borra sus notas, tareas y calificaciones en una sola transaccion.
- Los pesos de un bloque no pueden superar el valor del bloque (35, 40 o 25). No es obligatorio completarlo.
- El bloque final tiene una sola calificacion.
- La nota minima para aprobar es 3.0. Lo que falta por calificar cuenta como 0.

## Migracion
La version 2 agrega el almacen `grades` sin tocar los demas, asi que los datos de la version 1 se conservan.

## Copia de seguridad
Archivo `.json` con esta forma: `{ app, version, exportedAt, classes, notes, tasks, grades }`.
Las copias antiguas sin `grades` se pueden importar. Al importar, los elementos con el mismo id se sobrescriben y los demas se conservan.
