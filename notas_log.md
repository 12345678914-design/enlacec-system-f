# Registro de Implementación del Sistema de Calificaciones (Notas)

Este documento contiene el log detallado del diseño de base de datos, mapeo de datos, persistencia segura y la interfaz interactiva implementada para la gestión escolar de **Calificaciones** (`notas`) en Supabase y el panel de administración.

---

## 1. Estructura de la Tabla `notas` (Esquema Supabase)

La tabla `notas` se ha configurado para soportar múltiples calificaciones flexibles para los estudiantes matriculados en los distintos cursos que ofrece la institución escolar:

| Atributo / Columna | Tipo de Dato PostgreSQL | Valor por Defecto / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **`id`** | `UUID` (PK) | `gen_random_uuid()` | Identificador único del registro de calificación. |
| **`created_at`** | `TIMESTAMP WITH TIME ZONE` | `timezone('utc'::text, now())` | Marca de tiempo dd/mm/aaaa --:--:-- de creación del registro. |
| **`id_estudiante`** | `UUID` (FK) | `gen_random_uuid()`, ON DELETE CASCADE | Estudiante que recibe la calificación (tabla `estudiantes`). |
| **`id_profesor`** | `UUID` (FK) | `gen_random_uuid()`, ON DELETE CASCADE | Docente/profesor evaluador (tabla `usuarios`). |
| **`id_curso`** | `UUID` (FK) | `REFERENCES cursos(id)` ON DELETE CASCADE | Curso calificado (tabla `cursos`). |
| **`nota_numerica`** | `INTEGER` (int2) | `NULL` | Calificación cuantitativa entera en el rango del 1 al 20. |
| **`nota_cuantitativa`** | `TEXT` | `DEFAULT NULL` | Calificación cualitativa o comentarios (ej. "BAJO", "MAL", "MAS O MENOS", "BIEN", "EXCELENTE"). |

---

## 2. Definición del Modelo de Datos (`src/types.ts`)

Se ha formalizado la interfaz `Nota` para garantizar la consistencia de tipos en toda la aplicación de React y TypeScript:

```typescript
export interface Nota {
  id: string;
  created_at?: string;
  id_estudiante: string;
  id_profesor: string;
  id_curso: string;
  nota_numerica?: number | null;
  nota_cuantitativa: string;
}
```

---

## 3. Lógica de Negocio y Persistencia (`src/context/AppContext.tsx`)

El gestor de estado global (`AppContext`) se actualizó con soporte completo para la tabla `notas` en Supabase:

- **Carga de Datos Inicial**:
  Sincroniza y almacena en caché de `localStorage` para un funcionamiento offline óptimo con cargador seguro:
  ```typescript
  const { data, error } = await supabase.from('notas').select('*');
  if (data) {
    const mappedNotas = data.map((item: any) => ({
      id: item.id,
      created_at: item.created_at,
      id_estudiante: item.id_estudiante,
      id_profesor: item.id_profesor,
      id_curso: item.id_curso,
      nota_numerica: item.nota_numerica !== undefined && item.nota_numerica !== null ? Number(item.nota_numerica) : null,
      nota_cuantitativa: item.nota_cuantitativa || ''
    }));
    setNotas(mappedNotas);
  }
  ```

- **Operaciones CRUD (Create/Update/Delete)**:
  - `addNota(notaData)`: Genera un UUID local e inserta el registro en Supabase.
  - `updateNota(updatedNota)`: Modifica las calificaciones cuantitativas y cualitativas de forma segura.
  - `deleteNota(id)`: Remueve la nota por su ID de manera inmediata.

---

## 4. Diseño de la Interfaz de Usuario (`src/components/views/AdminDashboard.tsx`)

Se ha transformado la sección "Boletín de Notas" dentro de la ficha de detalle de cada alumno en una experiencia administrativa premium:

- **Estructuración por Curso**: Si el estudiante tiene un servicio asignado, se cargan los cursos específicos pertenecientes a dicho servicio. En caso contrario, se listan los cursos de la institución como fallback seguro.
- **Lista de Historial por Curso**: Bajo cada materia se despliega de forma ordenada la lista de calificaciones recibidas, acompañadas de:
  - Puntaje cuantitativo en una insignia con color semántico (Verde `>=15`, Azul `>=12`, Rojo `<12`).
  - La calificación cualitativa, comentario o etiqueta del docente.
  - El nombre del profesor evaluador.
  - Fecha y hora formateada de manera amigable.
  - Opción de eliminación de notas con confirmación de seguridad.
- **Formulario de Registro Inline**: Desplegable por curso, el cual incluye:
  - Selector de Docente de la base de datos real.
  - Selector de Nota Numérica del 1 al 20.
  - Entrada de Texto libre para la Nota Cualitativa.
  - Botones de atajo rápido (`EXCELENTE`, `BIEN`, `MAS O MENOS`, `MAL`, `BAJO`) que configuran dinámicamente tanto la etiqueta como el puntaje cuantitativo correspondiente en un solo clic.
- **Tarjetas de Rendimiento de Ficha**: Las tarjetas de "Promedio General" y la "Observación Pedagógica" calculan en tiempo real el promedio de todas las notas asignadas en el sistema para dicho estudiante, cayendo de forma limpia a datos históricos o fallbacks en su defecto.

---

## 5. Instrucciones para Sincronizar en Supabase

Aplica las sentencias SQL contenidas en el bloque `TABLA: notas` del archivo `supabase_schema.sql` en tu consola de Supabase. El sistema de base de datos manejará de manera automática la vinculación relacional y la eliminación en cascada si un estudiante, profesor o curso es removido.
