# Deployment checklist (evaluation)

## Backend (Render / Railway)

1. Create a MongoDB Atlas cluster and copy the connection string.
2. Deploy the `backend` folder.
3. Set environment variables:
   - `MONGODB_URI` — Atlas connection string
   - `CLIENT_ORIGIN` — your live frontend URL, e.g. `https://deskflow-ui.onrender.com` (no trailing slash)
4. Note the public API URL, e.g. `https://deskflow-api.onrender.com`

## Frontend (Vercel / Netlify / Render static)

1. Set **build-time** env: `VITE_API_URL=https://deskflow-api.onrender.com` (your real backend URL — not localhost).
2. Build command: `npm run build` (inside `frontend`).
3. Publish the `frontend/dist` folder.

## Same-origin option (single Render service)

1. Build the frontend locally: `npm run build --prefix frontend`
2. Set `STATIC_DIR=../frontend/dist` on the backend service.
3. Set `CLIENT_ORIGIN` to the same backend URL if you still open the UI from that host.

## Verify before submit

- Open browser devtools → Network: API calls go to your deployed backend, not `localhost`.
- No CORS errors in the console.
- `GET /tickets?priority=high&breached=true` returns only matching rows.
- Invalid transition `open → resolved` returns HTTP 400 with a readable message.
