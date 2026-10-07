# Comercial Kenpaku S.A.C. - Frontend Web & Panel Admin

Aplicación web de comercio electrónico desarrollada con **React, Vite y TailwindCSS** para **Comercial Kenpaku S.A.C.** (Puente Piedra, Lima), comercializadora de tubos, perfiles, fierros y planchas de acero.

---

## 🚀 Características
- **Catálogo de Productos de Acero**: Búsqueda por texto, filtrado por categorías (`tubos`, `planchas`, `perfiles`, `fierros`, `accesorios`), acabado (`negro`, `galvanizado`), precio y disponibilidad de stock.
- **Carrito de Compras y Checkout**: Cálculo automático en Soles (PEN) con IGV incluido y formulario de pedido con aceptación obligatoria de política de privacidad.
- **Asesor Virtual de IA (RAG)**: Chatbot flotante interactivo conectado con la API de RAG en tiempo real. Soporta derivación directa a WhatsApp con mensaje prellenado cuando la consulta lo requiera.
- **Libro de Reclamaciones Virtual**: Formulario de reclamaciones y quejas acorde a la Ley 29571 (Perú) con generación de código de seguimiento.
- **Panel Administrativo Protegido (JWT)**:
  - Dashboard con métricas clave.
  - Gestión de pedidos con actualización de estados (descuento automático de stock en confirmación).
  - CRUD de productos, baja lógica y actualización rápida de stock y precio.
  - Reindexación de la base de conocimiento de IA.
  - Auditoría de logs de chat y reclamaciones.

---

## 🛠️ Instalación y Ejecución Local

1. **Ingresar a la carpeta del frontend**:
   ```bash
   cd FrontKenpaku
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` basado en `.env.example`:
   ```env
   VITE_API_URL="http://localhost:8000/api"
   VITE_USE_MOCKS="false"
   VITE_WHATSAPP_NUMBER="51987654321"
   ```

4. **Iniciar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   Abre tu navegador en `http://localhost:5173`.

---

## ⚙️ Variables de Entorno

| Variable | Descripción | Valor Predeterminado |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL de la API del Backend (FastAPI) | `"http://localhost:8000/api"` |
| `VITE_USE_MOCKS` | `'true'` para usar datos en memoria sin backend, `'false'` para conectar con la API real | `"false"` |
| `VITE_WHATSAPP_NUMBER` | Número de WhatsApp corporativo de Comercial Kenpaku | `"51987654321"` |

---

## 🌐 Despliegue en Vercel

El proyecto incluye la configuración [vercel.json](file:///c:/Users/Diego_oc/BACKENDKENPAKU/FrontKenpaku/vercel.json) para soportar el enrutamiento de la SPA sin errores 404.

1. **Conectar con Vercel**:
   Importa este repositorio en tu cuenta de [Vercel](https://vercel.com).
2. **Configurar Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Configurar Variables de Entorno en Vercel**:
   - `VITE_API_URL`: URL de tu backend desplegado en Render (ejemplo: `https://kenpaku-backend.onrender.com/api`).
   - `VITE_USE_MOCKS`: `false`.
   - `VITE_WHATSAPP_NUMBER`: `51987654321`.
4. Deploy: Haz clic en **Deploy**.