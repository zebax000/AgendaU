# Modelo de datos (IndexedDB)

## classes
- id
- name
- teacherEmail (opcional)
- teacherPhone (opcional)
- officeHours (opcional)

## notes
- id
- title
- deadline (fecha y hora)
- classId (vacio si es nota general)
- lines: lista de `{ kind: "title" | "text", content: string }`
- createdAt

## tasks
- id
- classId
- title
- deadline
- done

## Reglas
- Las notas vencidas se siguen mostrando.
- Una linea de tipo `title` deja una linea de espacio al mostrarse (no se guarda como linea vacia).
- Borrar una clase borra sus notas y tareas, con confirmacion.
