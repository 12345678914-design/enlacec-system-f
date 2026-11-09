# Integración de los 5 Servicios de la API SUNAT en los Módulos Existentes (Modo Híbrido sin RUC Propio)

Este plan actualiza la arquitectura para incorporar las **5 funciones oficiales de la API de SUNAT** directamente dentro de los **módulos que ya existen en el sistema** (**Estudiantes**, **Docentes**, **Finanzas** y **Bóveda de Facturas**), **sin agregar ningún módulo nuevo al menú lateral** y operando en modo híbrido (**Sandbox Beta SUNAT `RUC 20000000001` + Control Interno**).

---

### Revisión del Usuario y Decisiones Confirmadas

> [!IMPORTANT]
> **Integración directa en los módulos actuales (Cero módulos nuevos en el menú):**
> 1. **Consulta de RUC y DNI (Padrón de Contribuyentes)**: Integrada en los formularios de **Estudiantes** (al matricular/editar alumno o consultar apoderado), **Docentes** (al registrar/editar profesor con DNI o RUC 10 para Recibo por Honorarios) y **Bóveda de Facturas** (al emitir comprobante), mostrando **Estado (`ACTIVO` / `BAJA`)**, **Condición (`HABIDO` / `NO HABIDO`)** y **Régimen Tributario** (`Nuevo RUS`, `RER`, `Régimen MYPE Tributario`, `Régimen General`, `Persona Natural sin Negocio`).
> 2. **Consulta de Validez de Comprobantes de Pago (Validador CPE)**: Integrada dentro de **Finanzas** (para validar facturas/boletas de proveedores antes de registrar un gasto) y en la **Bóveda de Facturas** (verificador de autenticidad ingresando RUC emisor, tipo, serie, número, fecha y monto).
> 3. **Emisión de Resúmenes Diarios (`RC`) y Comunicación de Bajas (`RA`)**: Integrada directamente en las acciones de la **Bóveda de Facturas** (botón para agrupar y enviar las Boletas `B001` del día en un **Resumen Diario `RC-YYYYMMDD-001`**, y flujo formal de **Comunicación de Baja `RA-YYYYMMDD-001`** con motivo de anulación cuando se anula una factura/boleta).
> 4. **Consulta y Emisión de Guías de Remisión Electrónica (GRE - Serie `T001`)**: Integrada dentro de la **Bóveda de Facturas / Finanzas** como una pestaña o modal de traslado de materiales educativos, kits de laboratorio o mobiliario entre sedes/almacén, permitiendo emitir y consultar el estado del traslado (`EN TRÁNSITO`, `ENTREGADO`, `ACEPTADO SUNAT`) con ticket QR de fiscalización.
> 5. **Descarga de Reportes Tributarios y Constancias (`PDF` / `XML UBL 2.1` / `CDR`)**: Integrada en cada fila de la **Bóveda de Facturas** y en los reportes de **Finanzas**, almacenando y descargando el archivo XML firmado (`20000000001-01-F001-00001.xml`), la Constancia de Recepción oficial firmada (`R-20000000001-01-F001-00001.xml` con código `0 - Aceptado`) y el PDF con QR y Hash CPE.

---

### 1. Dónde se Integra Cada Servicio de la API SUNAT (Sin Crear Nuevos Módulos)

| Servicio API SUNAT | Módulo Existente donde se Integra | Qué Hace Exactamente en ese Módulo |
| :--- | :--- | :--- |
| **1. Padrón RUC y DNI** | **Estudiantes**, **Docentes** y **Bóveda de Facturas** | Botón `"Consultar SUNAT/RENIEC"` junto al campo DNI/RUC. Valida dígito verificador (Módulo 11), retorna Nombre/Razón Social, Dirección Fiscal, Estado (`ACTIVO`), Condición (`HABIDO` — bloquea o alerta si es `NO HABIDO`) y Régimen (`MYPE`, `RER`, `General`, `RUS`). |
| **2. Validez de Comprobantes** | **Finanzas** (Registro de Gastos/Ingresos) y **Bóveda de Facturas** | Modal/Panel `"Validar Comprobante SUNAT"`: ingresa RUC emisor, Tipo (`01 Factura`, `03 Boleta`, `02 RHE`), Serie, Número, Fecha y Monto; responde si el comprobante es **VÁLIDO / ACEPTADO**, **ANULADO** o **NO EXISTE** antes de contabilizarlo. |
| **3. Resúmenes Diarios y Bajas** | **Bóveda de Facturas** (Barra de herramientas y botón Anular) | • **Resumen Diario (`RC`)**: Agrupa todas las Boletas `B001` emitidas en la fecha seleccionada, genera el XML `<SummaryDocuments>`, ticket SUNAT y CDR de aceptación masiva.<br>• **Comunicación de Baja (`RA`)**: Al anular un comprobante en la Bóveda, solicita el motivo tributario, genera el XML `<VoidedDocuments>` y registra el ticket de baja oficial. |
| **4. Guías de Remisión (GRE)** | **Bóveda de Facturas** (Sub-pestaña / Modal `Guías de Remisión T001`) | Permite emitir una GRE (`T001`) para traslado de libros, equipos de laboratorio o materiales (Punto de partida, Punto de llegada, Motivo de traslado, Peso bruto, Placa/Conductor) y consultar una GRE existente por número o QR ante fiscalización. |
| **5. Descarga PDF / XML / CDR** | **Bóveda de Facturas** (Tabla de comprobantes) y **Finanzas** | En cada comprobante (matrícula de estudiante o liquidación de docente por asistencia) agrega los botones **`PDF`**, **`XML`** y **`CDR`**, más un exportador de **Reporte Tributario Consolidado**. |

---

### 2. Experiencia de Usuario y Flujos Interactivos en los Módulos Actuales

#### A. En Estudiantes y Docentes (Padrón RUC / DNI)
- En el modal **Matricular Estudiante** y **Registrar/Editar Docente**, al escribir los 8 dígitos del DNI o los 11 dígitos del RUC y presionar **Consultar Padrón SUNAT**:
  - Se consulta la ruta `/api/sunat/padron` (con conexión a APIs públicas peruanas y motor de respaldo determinista con validación Módulo 11 de SUNAT).
  - Muestra en línea la ficha del contribuyente: `ESTADO: ACTIVO · CONDICIÓN: HABIDO · RÉGIMEN: RMT / PERSONA NATURAL`, autocompletando nombres y apellidos de inmediato.

#### B. En Finanzas (Validador de Comprobantes de Proveedores y Reporte Tributario)
- En la barra superior del módulo **Finanzas**, junto a `"Registrar Transacción"`, se incorpora el botón **"Validar CPE en SUNAT"**.
- Permite que antes de registrar una compra o pago de servicio externo, el administrador ingrese `RUC Emisor`, `Tipo (Factura/Boleta/RHE)`, `Serie-Número`, `Fecha` e `Importe`.
- La API verifica la estructura criptográfica, el estado del RUC emisor (`ACTIVO` y `HABIDO`) y si el comprobante se encuentra vigente o dado de baja, permitiendo con un clic autocompletar el formulario de gasto en Finanzas.

#### C. En Bóveda de Facturas (Emisión, Resúmenes Diarios, Comunicación de Bajas, GRE y Descargas XML/CDR)
- **Emisión para Matrícula de Estudiantes y Salario de Docentes por Asistencia**:
  - Consulta de RUC/DNI del padre o docente con validación `ACTIVO / HABIDO`.
  - Cálculo de operación **Exonerada de IGV (Educación)**, **Gravada (18% IGV)** o **RHE 4ta Categoría**, código QR oficial de SUNAT y Hash CPE.
- **Barra de Operaciones Tributarias SUNAT (integrada dentro de la Bóveda)**:
  1. **Emitir Resumen Diario de Boletas (`RC`)**: Agrupa las boletas emitidas del día, genera el ticket `RC-YYYYMMDD-001` y descarga su XML y CDR firmado.
  2. **Comunicación de Baja (`RA`)**: Al hacer clic en dar de baja/anular un comprobante en la tabla, abre el diálogo de **Comunicación de Baja SUNAT**, solicita el motivo (ej. *"Error en RUC/DNI"*, *"Operación cancelada"*), cambia el estado a `anulada` y permite descargar el XML `<VoidedDocuments>` y su CDR.
  3. **Guías de Remisión Electrónica (`GRE - T001`)**: Permite registrar y consultar traslados de material educativo o kits de laboratorio entre sedes o entregas a domicilio, generando el XML `<DespatchAdvice>`, el CDR y el PDF con QR para control en ruta.
  4. **Validador CPE**: Consulta rápida de validez de cualquier comprobante emitido o recibido.
- **Acciones por Fila (`PDF` · `XML` · `CDR`)**:
  - Cada registro en la tabla de la Bóveda cuenta con botones directos para descargar el **PDF con QR**, el **XML UBL 2.1** y la **Constancia de Recepción CDR (`R-*.xml`)**.

---

### 3. Arquitectura Técnica y Endpoints de la API SUNAT

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       MÓDULOS EXISTENTES DEL FRONTEND                            │
├──────────────────────┬──────────────────────────┬────────────────────────────────┤
│  Módulo Estudiantes  │     Módulo Finanzas      │    Módulo Bóveda de Facturas   │
│  y Módulo Docentes   │  • Validador CPE SUNAT   │  • Emisión Matrícula / Docente │
│  • Consulta DNI/RUC  │    antes de registrar    │  • Resumen Diario (RC)         │
│  • Valida ACTIVO /   │    gasto de proveedor    │  • Comunicación de Baja (RA)   │
│    HABIDO / Régimen  │  • Reporte Tributario    │  • Guías de Remisión (GRE T001)│
│                      │                          │  • Descarga PDF / XML / CDR    │
└──────────┬───────────┴─────────────┬────────────┴───────────────┬────────────────┘
           │                         │                            │
           ▼                         ▼                            ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                SERVICIO & API SUNAT (sunatService.ts + /api/sunat/*)             │
│  1. GET  /api/sunat/padron?numero=...    -> Consulta RUC/DNI (Activo/Habido/Rég) │
│  2. POST /api/sunat/validar-cpe          -> Valida autenticidad de Factura/Boleta│
│  3. POST /api/sunat/emitir-cpe           -> Genera XML UBL 2.1, Hash CPE y CDR   │
│  4. POST /api/sunat/resumen-baja         -> Genera Resumen Diario (RC) y Baja(RA)│
│  5. POST /api/sunat/guia-remision        -> Emite y consulta Guía Remisión (GRE) │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### Persistencia y Compatibilidad Total
- Todos los metadatos tributarios (`rucEmisor`, `serieCorrelativo`, `hashCpe`, `qrChain`, `estadoSunat`, `condicionContribuyente`, `regimenTributario`, `ticketResumen`, `motivoBaja`, `guiasRemision`) se almacenan dentro de la estructura `detalles` de `facturas` en Supabase y en el almacenamiento sincronizado del contexto, **sin requerir migraciones destructivas ni crear nuevas vistas en el menú**.
