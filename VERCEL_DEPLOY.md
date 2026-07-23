# 🚀 Guía Definitiva de Despliegue y Variables de Entorno en Vercel - ENLACEC

Esta guía explica detalladamente cómo desplegar la plataforma **ENLACEC** en **Vercel** y cómo configurar **todas las variables de entorno** para que funcionen al 100% en producción.

---

## 🔍 Diagnóstico Rápido de Variables de Entorno en Vivo

Una vez desplegada tu aplicación en Vercel, puedes comprobar en tiempo real qué servicios están activos abriendo en tu navegador:

👉 **`https://tu-app.vercel.app/api/health`**

Este endpoint devolverá un JSON con el estado exacto de cada servicio (Groq AI, Cloudinary, RENIEC Decolecta y Supabase) sin revelar tus claves secretas.

---

## ⚙️ Lista Completa de Variables de Entorno para Vercel

En Vercel Dashboard -> **Settings** -> **Environment Variables**, debes agregar las siguientes variables. 

*Nota: La plataforma es compatible tanto con nombres estándar (`GROQ_API_KEY`) como con el prefijo `VITE_` (`VITE_GROQ_API_KEY`).*

| Variable Recomendada | Nombre Alternativo (VITE_) | Descripción | Ejemplo / Uso |
| :--- | :--- | :--- | :--- |
| **`GROQ_API_KEY`** | `VITE_GROQ_API_KEY` | **Principal** - Clave API para Inteligencia Artificial (EnlaceC-Bot y Resúmenes Diarios) | `tu_groq_api_key` |
| **`VITE_SUPABASE_URL`** | `SUPABASE_URL` | URL de conexión de la base de datos Supabase | `https://tu-proyecto.supabase.co` |
| **`VITE_SUPABASE_ANON_KEY`** | `SUPABASE_ANON_KEY` | Clave pública / Anon Key de Supabase | `tu_anon_key` |
| **`CLOUDINARY_CLOUD_NAME`** | `VITE_CLOUDINARY_CLOUD_NAME` | Nombre de cuenta en Cloudinary (Bóveda de Facturas y PDFs) | *Tu Cloud Name* |
| **`CLOUDINARY_API_KEY`** | `VITE_CLOUDINARY_API_KEY` | API Key de Cloudinary | *Tu API Key* |
| **`CLOUDINARY_API_SECRET`** | `VITE_CLOUDINARY_API_SECRET` | API Secret de Cloudinary | *Tu API Secret* |
| **`DECOLECTA_RENIEC_TOKEN`** | `VITE_DECOLECTA_RENIEC_TOKEN` | Token de consulta de DNI en tiempo real (API Decolecta) | *Tu Token Decolecta* |
| **`GROK_API_KEY`** | `XAI_API_KEY` | (Opcional) Respaldo xAI Grok-2 | `xai-...` |
| **`GEMINI_API_KEY`** | `VITE_GEMINI_API_KEY` | (Opcional) Respaldo Google Gemini 3.5 Flash | `AIzaSy...` |

---

## ⚡ Pasos para Desplegar en Vercel

1. **Subir el Proyecto a GitHub**:
   - Crea un repositorio en GitHub y sube tu código.

2. **Importar Proyecto en Vercel**:
   - Ve a [vercel.com](https://vercel.com) -> **Add New...** -> **Project**.
   - Selecciona tu repositorio de GitHub `ENLACEC`.

3. **Cargar las Variables de Entorno**:
   - Copia las variables de la tabla anterior y pégalas en la sección **Environment Variables**.
   - Asegúrate de seleccionar todos los entornos (**Production**, **Preview**, **Development**).

4. **Desplegar**:
   - Presiona **"Deploy"**.
   - ¡Listo! Tendrás tu aplicación en vivo con frontend en CDN global y backend Serverless en `/api/*`.

---

## 💡 ¿Por qué no cargaban algunas variables antes?

1. **Soporte Flexible de Nombres**: Anteriormente el servidor buscaba únicamente el formato exacto `GROQ_API_KEY`. Ahora el servidor detecta tanto `GROQ_API_KEY` como `VITE_GROQ_API_KEY`.
2. **Precedencia de Vercel**: Se deshabilitó la sobreescritura del archivo `.env` local en producción para que las variables configuradas en el panel de Vercel tengan prioridad absoluta.
3. **Limpieza de Valores Vacíos**: Se agregó un sanitizador que descarta valores como `""`, `"undefined"` o espacios en blanco para evitar falsos negativos.
