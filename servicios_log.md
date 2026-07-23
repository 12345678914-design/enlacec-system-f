# Registro de Inicialización y Estructura de Servicios

Este documento contiene el log detallado de la inicialización, esquema de base de datos y adaptación en la aplicación para la entidad de **Servicios** (`servicio`) en Supabase y el sistema de archivos de almacenamiento.

---

## 1. Estructura de la Tabla `servicio` (Esquema Supabase)

La tabla `servicio` se ha reestructurado de acuerdo con la especificación exacta requerida, garantizando la persistencia durable de los servicios escolares, actividades complementarias y matrículas financieras:

| Atributo / Columna | Tipo de Dato PostgreSQL | Valor por Defecto / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **`id`** | `UUID` (PK) | `gen_random_uuid()` | Identificador único universal del servicio. |
| **`created_at`** | `TIMESTAMP WITH TIME ZONE` | `timezone('utc'::text, now())` | Fecha de creación del registro, con zona horaria aplicada. |
| **`nombre`** | `TEXT` | `DEFAULT NULL` | Nombre comercial o académico del servicio (ej. "Taller de Robótica", "Refuerzo Matemático"). |
| **`descripcion`** | `TEXT` | `DEFAULT NULL` | Descripción de las actividades contempladas en el servicio. |
| **`duracion`** | `INTEGER` | `DEFAULT NULL` | Duración del servicio expresada en minutos (ej. 60, 90). |
| **`pago`** | `REAL` (float4) | `DEFAULT NULL` | Costo o pago del servicio expresado en Soles (S/.). |

---

## 2. Actualización de Mapeadores en la Aplicación (`src/context/AppContext.tsx`)

El contexto de la aplicación (`AppContext`) se ha actualizado con soporte nativo para leer, escribir y modificar los nuevos atributos opcionales (`duracion`, `pago`):

- **Lectura desde Supabase (`refreshServicios` / Inicialización)**:
  Al consultar los servicios desde Supabase, el sistema mapea correctamente las columnas e **inicializa la lista de servicios directamente desde Supabase sin importar si está vacía (`data` válido)**, evitando falsos fallbacks a datos por defecto si el servidor respondió exitosamente con cero registros:
  ```typescript
  const mappedServicios = data.map((item: any) => ({
    id: item.id,
    nombre: item.nombre || '',
    descripcion: item.descripcion || '',
    duracion: item.duracion !== undefined && item.duracion !== null ? Number(item.duracion) : undefined,
    pago: item.pago !== undefined && item.pago !== null ? Number(item.pago) : undefined,
    created_at: item.created_at
  }));
  ```

- **Inserción en Supabase (`addService`)**:
  Se envían los campos numéricos de duración y pago de forma explícita al insertar nuevos registros:
  ```typescript
  await supabase.from('servicio').insert([{
    id: newService.id,
    nombre: newService.nombre,
    descripcion: newService.descripcion,
    duracion: newService.duracion !== undefined ? Number(newService.duracion) : null,
    pago: newService.pago !== undefined ? Number(newService.pago) : null
  }]);
  ```

- **Actualización en Supabase (`updateService`)**:
  Se actualizan dinámicamente los campos numéricos:
  ```typescript
  await supabase.from('servicio').update({
    nombre: updatedService.nombre,
    descripcion: updatedService.descripcion,
    duracion: updatedService.duracion !== undefined ? Number(updatedService.duracion) : null,
    pago: updatedService.pago !== undefined ? Number(updatedService.pago) : null
  }).eq('id', updatedService.id);
  ```

---

## 3. Integración de Almacenamiento en Supabase Storage (Subida por Teléfono)

Para cumplir con la solicitud de subir los archivos o fotos usando el número telefónico como nombre de archivo en Supabase Storage, se modificó el helper de carga `uploadProfileImage` en `AppContext.tsx`:

### Funcionamiento de la Subida por Teléfono
Cuando un docente o estudiante carga su foto de perfil, el sistema extrae su número de contacto/teléfono, limpia los caracteres no numéricos y lo utiliza para nombrar el archivo en el bucket `perfiles`.

```typescript
const fileIdentifier = telefono ? String(telefono).replace(/\D/g, '') : id;
const filePath = `${type}/${fileIdentifier}.${extension}`;
```

Esto asegura que:
1. Las fotos en el bucket `perfiles` ahora se guarden con nombres semánticos legibles basados en el teléfono del usuario (ej: `/perfiles/teachers/954123456.png` o `/perfiles/students/933666999.png`).
2. Se evite la acumulación de archivos duplicados para el mismo usuario al actualizar su foto, ya que el archivo con su número de teléfono se sobrescribe automáticamente en Supabase Storage.

---

## 4. Mejoras en la Interfaz de Usuario (`src/components/views/AdminDashboard.tsx`)

- **Formularios de Creación y Edición**: Se añadieron campos de tipo numérico para configurar la **Duración (minutos)** y el **Pago / Costo (S/.)** al registrar o editar un servicio.
- **Visualización en Tarjetas**: Las tarjetas de servicios en el panel administrativo ahora muestran de forma elegante los nuevos atributos con insignias visuales de reloj (`🕒`), moneda (`💰`) e indicador de fecha de creación formateada en hora local (`📅`).
- **Formato de Fecha**: Implementación de `formatServiceDate` para transformar la fecha ISO UTC de creación de Supabase a formato local amigable `DD/MM/AAAA HH:MM:SS`.
- **Selección de Matrícula**: Los selectores para matricular estudiantes en servicios ahora muestran el costo (S/.) del servicio al lado del nombre (ej. *"Taller de Robótica (S/. 150.00)"*).

---

## 5. Instrucciones para Sincronizar el Esquema en Supabase

Si estás ejecutando una nueva instancia de base de datos en Supabase, asegúrate de aplicar el script de creación contenido en `supabase_schema.sql` desde el **SQL Editor** para que la tabla `servicio` se configure correctamente con los nuevos campos por defecto.
