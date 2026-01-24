# MifFuturo
ProyectoCanchas: plataforma web para buscar, visualizar en mapa y contactar canchas sintéticas con panel de gestión para propietarios. Frontend en Next.js (app router SSR) y backend en FastAPI + PostgreSQL.

## Repo layout

- `backend/` – FastAPI, modelos SQLAlchemy, la carpeta `uploads/`, y toda la lógica Python. Allí viven `app/main.py`, las rutas, y la carpeta con las migraciones/semillas.
- `frontend/` – aplicación Next.js: `src/`, `public/`, `package.json`, la configuración de `next.config.mjs` y las muestras de `.env` distintas a las del backend.
- `render.yaml` – Blueprint de Render que define los dos servicios (`miffuturo-backend` y `miffuturo`) y sus dependencias.

## Local development

### Backend

- Copia `backend/.env.example` a `backend/.env` y adapta las variables sensibles (DB, JWT, SMTP, OAuth, etc.).
- Instala dependencias con `pip install -r backend/requirements.txt` y arranca la API con `uvicorn app.main:app --reload` desde `backend/`.
- El evento de arranque ejecuta `init_db()` y crea todas las tablas (incluido `ubigeo_*`) más el plan `free`, así que con el `DATABASE_URL` correcto no necesitas correr migraciones manuales.

### Frontend

- `cd frontend`
- `npm install` (esto también mantiene el `package-lock.json` alineado con las dependencias de SWC que Next.js requiere; si ves el warning `Found lockfile missing swc dependencies` vuelve a correr este paso antes de desplegar).
- `npm run dev`
- Usa `frontend/.env` o `.env.local` para ajustar `API_ORIGIN`, `GOOGLE_CLIENT_ID` y otras variables locales; en desarrollo puedes seguir apuntando a `http://127.0.0.1:8000`.
- La UI siempre llama a `/api/...` gracias a `src/lib/api.ts`, el middleware de Next y la reescritura definida en `next.config.mjs` (mira la constante `API_HOSTPORT` para la ejecución en Render).
- En Render el frontend debe recibir solo `API_ORIGIN=https://miffuturo-backend.onrender.com`; evitar definir `NEXT_PUBLIC_API_ORIGIN`/`NEXT_PUBLIC_API_URL` en producción para que no se hagan peticiones cruzadas (la UI ya usa `/api` y el rewrite apunta a `API_ORIGIN`).

## Deploying to Render

El repositorio carga `render.yaml` y un Blueprint con dos servicios:

1. **`miffuturo-backend`** (Python) – Raíz `backend/`; instala `requirements.txt`, expone `/healthz`, sirve `/uploads` y crea las tablas/planes al arrancar.
2. **`miffuturo`** (Node) – Raíz `frontend/`; ejecuta `npm ci && npm run build`, arranca con `npm run start` y reescribe `/api/*` hacia el backend usando `API_HOSTPORT`/`API_ORIGIN`.

Render va a publicar:
```
https://miffuturo-backend.onrender.com
https://miffuturo.onrender.com
```

### Services & environment variables

#### Backend (`miffuturo-backend`)
- `DATABASE_URL` – Usa la conexión interna de Render (por ejemplo `postgresql://.../db_marconi_lateralverde`) y déjalo en Render; no lo commitees.
- `JWT_SECRET_KEY` – Genera un valor seguro (Render puede generarlo automáticamente).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` – debe apuntar a la ruta pública que Google redirige después del login: `https://miffuturo.onrender.com/api/auth/callback/google`.
- `FRONTEND_ORIGIN` – fija en `https://miffuturo.onrender.com` para que el backend redirija al sitio correcto después del login.
- `CORS_ORIGINS` – incluye `https://miffuturo.onrender.com,https://miffuturo-backend.onrender.com,http://localhost:3000` para permitir la UI y el desarrollo local.
- `UBIGEO_SOURCE_URL` (opcional) – URL alternativa para descargar el catálogo ubigeo si no deseas mantenerlo en el repo. Si no está definida, se usa `https://raw.githubusercontent.com/pe-datos/ubigeo/master/ubigeo.csv`.
- `SMTP_*` (HOST, PORT, USER, PASS) según tu proveedor si necesitas enviar correos.
- El backend ejecuta `python -m app.scripts.bootstrap_db` antes de arrancar (`render.yaml` lo define como pre-deploy) y `init_db()` crea tablas `ubigeo_peru_*` + `Plan free` y reusa los datos si ya existen. Si necesitas recargar el catálogo, corre `python -m app.scripts.bootstrap_db` o usa el endpoint protegido `POST /admin/ubigeo/import` con `replace=true`.

#### Frontend (`miffuturo`)
- `API_HOSTPORT` – Render llena esto automáticamente con el `hostport` del backend (`miffuturo-backend:10000`).
- `API_ORIGIN` – debe ser `https://miffuturo-backend.onrender.com`; Next.js usa esta URL en `next.config` para reescribir `/api/:path*` hacia el backend y así evitar CORS.
- `NEXTAUTH_URL` – fija en `https://miffuturo.onrender.com` (puedes usar `SITE_URL` o `FRONTEND_ORIGIN` como respaldo) para que el OAuth construya `redirect_uri` correctos.
- `GOOGLE_CLIENT_ID` – el mismo ID del backend; el login lo usa dentro de `frontend/src/app/api/auth/google/login/route.ts`.
- NO definas `NEXT_PUBLIC_API_ORIGIN` o `NEXT_PUBLIC_API_URL` en producción; el UI ya hace fetch a `/api/...` y confía en el rewrite.

### Google OAuth

- Registra los redirect URIs y Authorized JS origins en la consola de Google Cloud:
  - Authorized JS origins: `https://miffuturo.onrender.com` y `http://localhost:3000`
  - Redirect URIs: `https://miffuturo.onrender.com/api/auth/callback/google` (y `http://localhost:3000/api/auth/callback/google` para desarrollo)
- Tanto el frontend como el backend guardan `GOOGLE_CLIENT_ID` (para iniciar el flujo) y el backend usa `GOOGLE_CLIENT_SECRET` para intercambiar el código. El backend exige `GOOGLE_REDIRECT_URI` para mantenerse coherente con lo que recibió Google.

### Ubigeo & seeds

- Las tablas `ubigeo_peru_departments`, `ubigeo_peru_provinces` y `ubigeo_peru_districts` se crean automáticamente cuando arranca el backend. El script `python -m app.scripts.bootstrap_db`:
  1. Busca primero `backend/data/Lista_Ubigeos_INEI.csv` si lo mantienes en el repo (puedes descargar el CSV oficial y colocarlo allí).
  2. Si no hay archivo local, descarga el catálogo desde `UBIGEO_SOURCE_URL` o, por defecto, `https://raw.githubusercontent.com/pe-datos/ubigeo/master/ubigeo.csv`.
  3. Inserta/actualiza departamentos/provincias/distritos sin duplicar registros. Si ocurre un fallo HTTP (404 u otro), solo se loggea y el deploy continúa.
- Si necesitas recargarlo a mano, usa el endpoint admin `POST /admin/ubigeo/import` (multipart/JSON) con `replace=true`.

### Build notes

- El frontend depende de `/api` sin CORS, por eso el proxy (`next.config.mjs`) y los helpers en `src/lib/api.ts` son la forma recomendada de hacer peticiones.
- Si ves `Found lockfile missing swc dependencies`, ve a `frontend`, ejecuta `npm install`, y vuelve a correr `npm run build` para regenerar `package-lock.json` antes de desplegar.
