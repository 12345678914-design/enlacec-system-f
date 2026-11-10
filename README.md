# 🎓 ENLACEC - Plataforma Integral de Gestión Educativa, Financiera y Facturación Electrónica

**ENLACEC** es un sistema web moderno diseñado para instituciones educativas, academias y colegios. Centraliza la administración escolar, la gestión docente, el control financiero, la facturación electrónica validada con estándares SUNAT y herramientas pedagógicas potenciadas con Inteligencia Artificial.

---

## 📌 Tabla de Contenidos
1. [Arquitectura y Roles](#-arquitectura-y-roles)
2. [Módulos Principales](#-módulos-principales)
3. [Flujos Operativos Clave](#-flujos-operativos-clave)
   - [Flujo 1: Matrícula de Estudiantes](#flujo-1-matrícula-de-estudiantes-con-consulta-dni)
   - [Flujo 2: Asistencia Docente y Facturación Automática](#flujo-2-asistencia-docente-y-facturación-automática)
   - [Flujo 3: Bóveda de Facturas y Emisión SUNAT](#flujo-3-bóveda-de-facturas-y-emisión-sunat)
   - [Flujo 4: Control Financiero y Filtrado](#flujo-4-control-financiero-y-filtrado)
   - [Flujo 5: Asistentes e Inteligencia Artificial (TESLA AI)](#flujo-5-asistentes-e-inteligencia-artificial-tesla-ai)
4. [Estructura de Base de Datos y Seguridad](#-estructura-de-base-de-datos-y-seguridad)
5. [Pila Tecnológica](#-pila-tecnológica)
6. [Instalación y Configuración](#-instalación-y-configuración)

---

## 👥 Arquitectura y Roles

El sistema implementa control de acceso basado en roles (RBAC) con dos perfiles diferenciados:

### 1. 🛡️ Rol Administrador (Directora / Secretaría)
* Control total del centro educativo.
* Registro y matrícula de estudiantes con validación de DNI.
* Gestión de docentes, servicios educativos y cursos.
* **Aprobación de Asistencias Docentes**: Revisa las horas registradas y genera las liquidaciones.
* **Bóveda de Facturas**: Acceso protegido con clave a todos los comprobantes institucionales (boletas, facturas con RUC, liquidaciones, notas y guías de remisión).
* Finanzas globales: flujo de caja, balance de ingresos/egresos y reportes.
* Configuración del sistema, llaves de API, temas y avisos generales.

### 2. 👨‍🏫 Rol Docente
* Entorno enfocado en el aula y labor pedagógica.
* **Mis Asistencias**: Registro de sesiones, horas trabajadas y temas dictados.
* **Notas**: Registro y evaluación de calificaciones por curso y estudiante.
* **Mis Facturas**: Consulta y descarga en PDF de las facturas/liquidaciones personales generadas una vez que administración aprueba sus asistencias. *(Nota: Por seguridad, los profesores no tienen acceso a la bóveda institucional).*
* **Finanzas Personales**: Historial de cobros y honorarios liquidados.
* **Recursos**: Repositorio de compendios, libros y material de clase.
* **Avisos**: Notificaciones institucionales y circulares.

---

## 📦 Módulos Principales

| Módulo | Icono | Descripción |
| :--- | :---: | :--- |
| **Inicio / Dashboard** | 🏠 | Resumen de métricas en tiempo real: estudiantes matriculados, docentes activos, balance financiero y accesos rápidos. |
| **Estudiantes y Matrícula** | 🎓 | Padrón estudiantil, buscador DNI, registro con datos de identidad, asignación a grados, secciones y servicios. |
| **Docentes** | 👥 | Directorio de plana docente, especialidades, tarifas por hora y asignación de cursos. |
| **Cursos y Servicios** | 📚/🗂️ | Catálogo de talleres (Matemática, Lectura, Robótica, Inglés, etc.) y paquetes de servicios educativos. |
| **Mis Asistencias** | 📅 | Marcación y control de sesiones dictadas por los docentes con estado de aprobación. |
| **Notas y Calificaciones** | 📝 | Matriz de notas por competencias, promedios ponderados y control de rendimiento académico. |
| **Finanzas** | 💳 | Libro de ingresos y egresos, clasificación por categorías, filtro mensual/anual y balance contable. |
| **Bóveda de Facturas** | 🧾 | Centro de facturación electrónica con estándares SUNAT (UBL 2.1, QR, Hash CPE, XML, CDR, Bajas RA y GRE). |
| **Laboratorio AI / Pizarra** | ✨ | Pizarra interactiva y generador de material educativo con IA. |
| **TESLA AI** | ⚡ | Asistente inteligente con modelos Groq y Gemini para consultas institucionales y análisis rápido. |
| **Avisos y Noticias** | 📢 | Tablón de anuncios, eventos y comunicados con notificaciones push en tiempo real. |

---

## 🔄 Flujos Operativos Clave

### Flujo 1: Matrícula de Estudiantes con Consulta DNI

```
[Ingresar DNI] ──> [API Consulta Identidad] ──> [Autocompletado de Formulario]
                                                         │
                                                         ▼
[Generar Boleta B001] <── [Asignar Servicio y Turno] <── [Confirmar Datos]
```

1. **Ingreso de Identidad**: El administrador ingresa el DNI (8 dígitos).
2. **Respuesta Estructurada**: El sistema consulta la API de identidad que devuelve:
   ```json
   {
     "first_name": "ROXANA KARINA",
     "first_last_name": "DELGADO",
     "second_last_name": "HUAMANI",
     "full_name": "DELGADO HUAMANI ROXANA KARINA",
     "document_number": "46027897"
   }
   ```
3. **Distribución Correcta de Campos**:
   - `first_name` se asigna a los Nombres.
   - `first_last_name` y `second_last_name` se asignan a los Apellidos.
4. **Asignación Académica**: Se selecciona el servicio escolar, grado, sección y turno.
5. **Comprobante de Pago**: Se registra el pago de matrícula y se emite la Boleta Electrónica (`B001-XXXXXX`) con opción a descarga en PDF.

---

### Flujo 2: Asistencia Docente y Facturación Automática

```
[Docente registra asistencia]
         │
         ▼ (Estado: Pendiente)
[Administración revisa en "Aprobar Asistencias"]
         │
    [¿Aprobado?]
    ├── NO  ──> Se rechaza o solicita corrección
    └── SÍ  ──> [Estado: Aprobado]
                     │
                     ├──> [Se crea Factura/Liquidación E001 en Bóveda General]
                     └──> [Aparece automáticamente en "Mis Facturas" del Docente]
```

1. **Marcación Docente**: El profesor ingresa al módulo **Mis Asistencias**, selecciona el curso/servicio, la fecha, las horas dictadas y el tema desarrollado.
2. **Bandeja de Aprobación**: El administrador abre el panel de aprobación (disponible en la Bóveda y en el módulo de Docentes) para revisar horas y montos acumulados.
3. **Aprobación Oficial**: Al hacer clic en **"Aprobar Asistencia"**:
   - Se actualiza el estado de la asistencia a `aprobada`.
   - Se genera una factura/comprobante de liquidación de honorarios (Serie `E001-XXXXXX`).
   - El comprobante queda registrado en la **Bóveda Institucional** y visible en **Mis Facturas** del profesor.
   - El docente puede descargar su representación impresa en PDF con código QR y detalle de horas.

---

### Flujo 3: Bóveda de Facturas y Emisión SUNAT

```
[Acceso a Bóveda] ──> [Verificación Clave de Seguridad]
                               │
               [Consulta tabla: codigo_acceso_boveda]
                               │
                               ▼
            ┌─────────────────────────────────────────┐
            │   Panel de Control de Comprobantes      │
            ├─────────────────────────────────────────┤
            │ • Boletas B001        • Facturas F001   │
            │ • Honorarios E001     • Guías GRE T001  │
            └─────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
[Validación SUNAT]      [Exportar a PDF]      [Comunicación Baja]
 (CDR, Hash, QR)        (Filtrado Año/Mes)          (RA)
```

1. **Protección de Acceso**:
   - La bóveda requiere un código de acceso de 4 o más dígitos.
   - Cada cambio de código se inserta como una nueva fila en la tabla de Supabase:
     ```sql
     INSERT INTO codigo_acceso_boveda (codigo) VALUES ('mi_nuevo_codigo');
     ```
   - La aplicación consulta en tiempo real el registro más reciente para validar el desbloqueo.
2. **Búsqueda Inteligente por Serie y Correlativo**:
   - **Formato estándar**: `B001-000001`, `F001-000015`, `E001-000003`.
   - **Formato simplificado sin ceros**: `B001-1`, `F001-15`.
   - **Búsqueda por prefijo**: Escribir `B001` lista todas las boletas; escribir `F001` lista facturas RUC.
   - **Búsqueda por DNI/RUC o nombre del receptor**.
3. **Filtros Temporales y Exportación**:
   - Filtro por **Año** y **Mes** (por defecto muestra el mes en curso para máxima velocidad).
   - Botón de **Exportación PDF** que descarga únicamente los comprobantes que cumplen con los filtros aplicados.
4. **Cumplimiento Tributario**:
   - Generación de estructura XML UBL 2.1 estándar.
   - Generación de Hash resumen CPE y código QR de validación.
   - Descarga de CDR simulado/sandbox.
   - Generación de Guías de Remisión Electrónica remitente (`T001`).
   - Módulo de Comunicación de Baja (`RA`) para anulación de comprobantes.

---

### Flujo 4: Control Financiero y Filtrado

```
[Módulo Finanzas] ──> [Seleccionar Mes / Año] ──> [Actualización Dinámica de Métricas]
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                                   [Ingresos vs Egresos]              [Detalle de Movimientos]
                                   (Gráficos Recharts)                (Comboboxes Alto Contraste)
```

1. **Filtro de Período**: Selector para ver movimientos de *Este Mes*, meses individuales o el año completo.
2. **Estilo Dinámico de Comboboxes**:
   - **Modo Oscuro**: Fondo negro con texto blanco (`bg-black text-white`).
   - **Modo Claro**: Fondo blanco con texto negro (`bg-white text-black`).
3. **Registro de Transacciones**: Categorización por Matrículas, Pensiones, Pagos a Docentes, Servicios Básicos, Materiales y Mantenimiento.

---

### Flujo 5: Asistentes e Inteligencia Artificial (TESLA AI)

```
[Usuario / Admin] ──> [TESLA AI (Ctrl+K)] ──> [Proxy Interno Express (/api/chat)]
                                                         │
                                      ┌──────────────────┴──────────────────┐
                                      ▼                                     ▼
                            [Groq SDK (Llama 3)]                 [Google Gemini 2.0]
```

1. **Acceso Global**: Se puede invocar desde el menú lateral o mediante el atajo de teclado global `Ctrl + K` (o `Cmd + K`).
2. **Procesamiento Interno Seguro**:
   - Las solicitudes no exponen las claves en el cliente. Pasan por el backend interno `/api/chat`.
   - Admite `VITE_GROQ_API_KEY` configurada en el entorno (Vercel o servidor Node.js).
3. **Funcionalidades**:
   - Responder preguntas frecuentes del colegio.
   - Consultar resúmenes de alumnos y profesores.
   - Redactar avisos escolares, planes de clase y rúbricas de evaluación.

---

## 🗄️ Estructura de Base de Datos y Seguridad

El sistema utiliza **Supabase (PostgreSQL)** como motor principal con políticas RLS y respaldo offline en `localStorage`:

### Tablas Principales
* **`estudiantes`**: Datos de identidad (DNI, nombres, apellidos), grado, nivel, contacto y servicio asignado.
* **`profesores`**: Información del docente, especialidad, RUC/DNI, teléfono y tarifa horaria.
* **`asistencias`**: Registro de horas dictadas, fecha, curso, tema y estado (`pendiente` / `aprobada`).
* **`facturas` / `comprobantes`**: Registro contable de facturas, boletas, honorarios y guías con metadata SUNAT.
* **`codigo_acceso_boveda`**: Historial de claves de seguridad de la Bóveda:
  - `id`: `uuid` (default `gen_random_uuid()`)
  - `created_at`: `timestamptz` (default `now()`)
  - `codigo`: `text` (código de acceso vigente)
* **`movimientos_financieros`**: Transacciones de ingresos y egresos.
* **`noticias_avisos`**: Comunicados institucionales con fecha y prioridad.

---

## 💻 Pila Tecnológica

* **Frontend**: React 19, TypeScript, Vite.
* **Estilos**: Tailwind CSS con paleta dark/light adaptable y micro-transiciones optimizadas.
* **Iconografía**: Lucide React.
* **Reportes y PDFs**: jsPDF con motor de dibujo vectorial para códigos QR y tablas de comprobantes.
* **Gráficos**: Recharts.
* **Backend y Proxy API**: Express + Node.js (con soporte para deployment en Vercel Serverless).
* **Base de Datos**: Supabase (PostgreSQL) con sincronización en tiempo real.
* **Inteligencia Artificial**: `@google/genai` (Gemini 2.0/Flash) y Groq SDK (Llama 3.3 70B / Mixtral).

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd enlacec
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de Entorno (`.env`)
Crear un archivo `.env` basado en `.env.example`:
```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Inteligencia Artificial (TESLA AI y Laboratorio)
VITE_GROQ_API_KEY=gsk_tu_clave_groq
GEMINI_API_KEY=tu_clave_gemini

# Puerto del servidor
PORT=3000
```

### 4. Modo Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### 5. Limpieza de Datos (Mantenimiento)
Para reiniciar el año escolar o vaciar datos de prueba manteniendo **100% intactas las cuentas de usuarios (profesores y administradores)**:

- **Opción A (Recomendada - Supabase SQL Editor)**:
  1. Abre tu panel de Supabase y ve a **SQL Editor**.
  2. Pega el contenido de `limpiar_datos_excepto_usuarios.sql` y pulsa **Run**.
  3. Esto vaciará estudiantes, notas, asistencias, sesiones, facturas y finanzas con `CASCADE` protegiendo la tabla `usuarios`.

- **Opción B (Línea de comandos Node/TypeScript)**:
  ```bash
  npm run db:clean
  ```

- **Opción C (Interfaz Web)**:
  Ingresa al portal como Administrador > **Ajustes** > **Limpieza y Mantenimiento de Datos** > Clic en **Ejecutar Limpieza en Vivo** (o copiar/descargar el script SQL).

---

### 6. Compilación para Producción
```bash
npm run build
npm run start
```

---

*Desarrollado para ENLACEC - Excelencia en Gestión Educativa y Administrativa.*
