# Deploy DeskFlow on Render

Your API: **https://bajaj-finserv-unne.onrender.com** (already live)

## Option A — One service (recommended, fixes CORS)

1. Push latest code to GitHub.
2. On Render → your web service → **Settings**:
   - **Build command:**  
     `npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend`
   - **Start command:**  
     `npm start --prefix backend`
   - **Environment variables:**
     - `MONGODB_URI` = your Atlas connection string
     - `STATIC_DIR` = `../frontend/dist`
3. **Redeploy** and open: `https://bajaj-finserv-unne.onrender.com`  
   (UI + API same origin — no CORS)

For this option, build frontend with **empty** API URL (uses same host):

```env
# frontend/.env.production — leave empty for same-origin
VITE_API_URL=
```

## Option B — Separate frontend (GitHub Pages / second Render site)

**Backend** (Render) env:

```env
MONGODB_URI=mongodb+srv://...
CLIENT_ORIGIN=https://YOUR-FRONTEND-URL
```

**Frontend** build env (must set before `npm run build`):

```env
VITE_API_URL=https://bajaj-finserv-unne.onrender.com
```

After changing CORS code, **redeploy the backend** on Render.

## Render dashboard checklist

| Variable | Value |
|----------|--------|
| `MONGODB_URI` | MongoDB Atlas URI |
| `STATIC_DIR` | `../frontend/dist` (Option A only) |
| `CLIENT_ORIGIN` | Your frontend URL if separate (Option B) |

## Local vs production

| | `frontend/.env` | `backend/.env` |
|--|-----------------|----------------|
| Local | `VITE_API_URL=http://localhost:5001` | `PORT=5001` |
| Production build | `frontend/.env.production` | set on Render |
