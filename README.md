# Comercial Kenpaku S.A.C. - Frontend Web & Panel Admin

Aplicación web de comercio electrónico desarrollada con **React, Vite y TailwindCSS** para **Comercial Kenpaku S.A.C.** (Puente Piedra, Lima), comercializadora de tubos, perfiles, fierros y planchas de acero.

---

## 🚀 Características
- **Catálogo de Productos de Acero**: Búsqueda por texto, filtrado por categorías (`tubos`, `planchas`, `perfiles`, `fierros`, `accesorios`), acabado (`negro`, `galvanizado`), precio y disponibilidad de stock.
- **Carrito de Compras y Checkout**: Cálculo automático en Soles (PEN) con IGV incluido y formulario de pedido con aceptación obligatoria de política de privacidad.
- **Asesor Virtual de IA (RAG)**: Chatbot flotante interactivo conectado con la API de RAG en tiempo real. Soporta derivación directa a WhatsApp con mensaje prellenado cuando la consulta lo requiera.
- **Libro de Reclamaciones Virtual**: Formulario de reclamaciones y quejas acorde a la Ley 29571 (Perú) con generación de código de seguimiento.
- **Seguimiento público del pedido** (`/seguimiento`): el cliente consulta su pedido con el enlace del correo o con código + teléfono, y ve el estado, la línea de tiempo, los productos y los totales.
- **Flete y pago dentro del sistema**: el cliente acepta o rechaza el flete cotizado, ve los datos de pago (Yape, Plin o transferencia) y sube el voucher (imagen o PDF).
- **Panel Administrativo Protegido (JWT)**:
  - Dashboard con métricas clave y el bloque **Acciones de hoy** (flete por cotizar, vouchers por validar, pedidos por vencer y reclamos pendientes).
  - Gestión de pedidos con filtro por estado, búsqueda por código o teléfono, historial de eventos y actualización de estados (reserva y descuento de stock según el flujo).
  - Botón para avisar al cliente por WhatsApp con un mensaje listo según el estado.
  - Ejecución manual del cron y simulación de +48 h para demostración.
  - CRUD de productos, baja lógica y actualización rápida de stock y precio.
  - Reindexación de la base de conocimiento de IA.
  - Auditoría de logs de chat y reclamaciones.

### Flujo de estados del pedido
- **Despacho**: `pendiente` → `flete_cotizado` → `confirmado` → `despachado` → `entregado`.
- **Recojo en tienda**: `pendiente` → `confirmado` → `listo_para_recojo` → `entregado`.
- `cancelado` puede ocurrir antes de `entregado`. Los estados `entregado` y `cancelado` no admiten cambios.

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


5. **Modo de pruebas sin backend (opcional)**:
   Crea un archivo `.env.local` con `VITE_USE_MOCKS="true"`. Los datos viven en memoria y las credenciales del panel admin de prueba están definidas en `src/api/auth.js`. Reinicia `npm run dev` después de cambiarlo.

6. **Ejecutar las pruebas automatizadas**:
```bash
   npm test
```
---

## ⚙️ Variables de Entorno

| Variable | Descripción | Valor Predeterminado |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL de la API del Backend (FastAPI) | `"http://localhost:8000/api"` |
| `VITE_USE_MOCKS` | `'true'` para usar datos en memoria sin backend, `'false'` para conectar con la API real | `"false"` |
| `VITE_WHATSAPP_NUMBER` | Número de WhatsApp corporativo de Comercial Kenpaku | `"51987654321"` |

---

## 🌐 Despliegue en Vercel

El proyecto incluye la configuración [vercel.json](./vercel.json) para soportar el enrutamiento de la SPA sin errores 404.

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


---

## 🔐 Seguridad

- Las variables `VITE_*` quedan visibles en el navegador: nunca coloques claves ni secretos en ellas.
- El token del admin se guarda en `localStorage` y se envía en cada petición al panel.
- Las claves de Brevo, Telegram, Supabase y el cron viven solo en el backend (Render).