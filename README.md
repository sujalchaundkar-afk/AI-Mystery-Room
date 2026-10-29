# AI Mystery Room

AI-generated whodunits: describe a setting, Gemini writes the case, you investigate and accuse. See [SPEC.md](SPEC.md).

## Prerequisites
- Node.js 20+
- A MongoDB Atlas connection string (free M0 cluster)
- A Gemini API key from https://aistudio.google.com/apikey

## Run locally
```bash
# Terminal 1 — backend
cd server
cp .env.example .env      # then fill in MONGODB_URI and GEMINI_API_KEY
npm install
npm run dev               # http://localhost:5000  (check /api/health)

# Terminal 2 — frontend
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

## Deploy
**Database:** MongoDB Atlas → Network Access → allow `0.0.0.0/0` → create a DB user.

**Backend (Render):** New Web Service → root directory `server` → build `npm install` → start `npm start`. Env vars: `MONGODB_URI`, `GEMINI_API_KEY`, `GEMINI_MODEL` (optional), `CLIENT_URL` = your Vercel URL (no trailing slash; comma-separate for several).

**Frontend (Vercel):** import the repo → root directory `client` → framework Vite. Env var: `VITE_API_URL` = your Render URL. `vercel.json` handles page refreshes on sub-routes.

Open `<render-url>/api/health` first to wake a sleeping free instance, then play a full case on the live site.

## Security notes
- Never commit `.env`. `.gitignore` already excludes it.
- The culprit and solution stay in the database until `/result` is called after an accusation.
