# Registro de Adaptación y Atributos de Docentes

Este documento contiene el log detallado de atributos de la tabla de docentes en español y su alineación en todo el sistema escolar. Garantiza la compatibilidad absoluta e intercambio transparente entre la tabla en español (`usuarios`) y la tabla en inglés (`teachers` o `teacher`), permitiendo que el sistema priorice los atributos en español de forma nativa.

---

## 1. Atributos Principales de Docentes (Esquema en Español)

La tabla `usuarios` (que contiene a los docentes) se ha establecido como la estructura prioritaria de datos con los siguientes atributos:

| Atributo / Columna | Tipo de Dato PostgreSQL | Equivalente en la Aplicación (React) | Descripción / Función |
| :--- | :--- | :--- | :--- |
| **`id`** | `UUID` (PK) | `id: string` | Identificador único universal del docente. |
| **`nombre`** | `TEXT` | `nombre: string` | Nombres del docente. |
| **`apellido`** | `TEXT` | `apellido: string` | Apellidos del docente. |
| **`edad`** | `INTEGER` | `edad: number` | Edad en años. |
| **`dni`** | `TEXT` | `dni: string` | Documento Nacional de Identidad o Documento Único. |
| **`telefono`** | `BIGINT` | `telefono: number` | Número telefónico de contacto directo (9 dígitos). |
| **`codigo`** | `TEXT` | `codigo: string` | Código de empleado o docente (Ej: `DOC-001`). |
| **`foto_url`** | `TEXT` | `foto_url: string` | URL pública de la foto de perfil cargada en Storage. |
| **`fecha_vencimiento`** | `INTEGER` | `fecha_vencimiento: number` | Año de vencimiento del contrato (Ej: `2028`). |
| **`password`** | `TEXT` | `password?: string` | Contraseña de acceso cifrada o temporal (`docente123`). |
| **`si_pass`** | `BOOLEAN` | `si_pass: boolean` | Indica si es primer inicio de sesión y requiere cambiar contraseña. |
| **`activado`** | `BOOLEAN` | `activado: boolean` | Estado de la cuenta (Habilitado/Deshabilitado). |
| **`rol`** | `TEXT` | `rol: string` | Rol del usuario en el sistema (por defecto `'docente'`). |
| **`created_at`** | `TIMESTAMP` | `created_at?: string` | Fecha y hora exacta de registro. |

---

## 2. Compatibilidad Bilingüe Automatizada (Mapeadores Integrados)

El sistema escolar utiliza mappers inteligentes bidireccionales en el archivo del backend y contexto (`src/context/AppContext.tsx`) para asegurar que si un registro se lee de la tabla en español (`usuarios`) o de la tabla en inglés (`teachers`), se extraigan siempre las columnas correctas sin romper la interfaz:

### A. Mapeo de Base de Datos a Aplicación (`mapTeacherFromDb`)
* **Priorización**: Si `row.nombre` existe en la fila obtenida de Supabase, se utiliza como fuente principal. De lo contrario, se divide y limpia el campo alternativo `row.name`.
* **Asignación de Campos**:
  * `nombre` $\leftarrow$ `row.nombre || limpia(row.name)`
  * `apellido` $\leftarrow$ `row.apellido || limpia(row.name)`
  * `foto_url` $\leftarrow$ `row.foto_url || row.avatarUrl`
  * `telefono` $\leftarrow$ `row.telefono || row.phone`
  * `activado` $\leftarrow$ `row.activado || row.activated || true`

### B. Mapeo de Aplicación a Base de Datos (`mapTeacherToDb`)
Cuando un docente es registrado o actualizado, el sistema escribe **ambas versiones** de los atributos en el objeto que se envía a Supabase. Esto permite que el motor de consultas funcione sin importar qué tabla tenga prioridad.

---

## 3. Log de Cambios (Changelog de Estructuras)

1. **Creación del Script de Alteración (`/alter_teachers_with_log.sql`)**: 
   Generado para actualizar la tabla `teachers` (o `teacher` si es singular) con las columnas `nombre`, `apellido`, `edad`, `dni`, `telefono`, `codigo`, `foto_url` y `fecha_vencimiento`.
2. **Creación de la Tabla de Auditoría (`auditoria_docentes`)**: 
   Diseñada para rastrear todas las modificaciones realizadas en los registros de docentes, almacenando la acción ejecutada (`INSERT`, `UPDATE`, `DELETE`), los datos previos (`datos_anteriores`) y los datos resultantes (`datos_nuevos`) en formato `JSONB`.
3. **Trigger de Registro de Actividades**:
   Se implementó una función disparadora en PostgreSQL que audita y registra de manera automática cualquier cambio directamente desde el servidor de base de datos Supabase, manteniendo un historial en tiempo real.

---

## 4. Instrucciones para la Ejecución del Script SQL en Supabase

Para aplicar estos cambios en tu base de datos de producción o desarrollo en Supabase, sigue estos pasos:

1. Abre el archivo `/alter_teachers_with_log.sql` y copia todo su contenido.
2. Inicia sesión en tu panel de **Supabase Console** (https://supabase.com).
3. Selecciona tu proyecto escolar.
4. En el menú lateral izquierdo, haz clic en **SQL Editor**.
5. Haz clic en **New query** (Nueva consulta).
6. Pega el código copiado en el editor.
7. Haz clic en el botón verde **Run** (Ejecutar) en la esquina inferior derecha.

Una vez ejecutado, verás un mensaje de confirmación de que la tabla `teachers` ha sido alterada exitosamente y que los disparadores de auditoría están activos y listos para registrar cada cambio.
