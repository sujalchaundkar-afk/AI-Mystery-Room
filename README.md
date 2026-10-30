# AI Mystery Room
Full-stack React + Express mystery game.

## Local setup
1. Install Node.js 20+.
2. In this folder run `npm install` then `npm run install:all`.
3. Copy `server/.env.example` to `server/.env` and add your Gemini API key.
4. Run `npm run dev`; open http://localhost:5173.

MongoDB is optional. Without `MONGODB_URI`, cases are stored in memory and reset when the backend restarts.

## Render backend
Create a Web Service. Root Directory: `server`; Build Command: `npm install`; Start Command: `npm start`.
Set `GEMINI_API_KEY` and `CLIENT_URL` (your deployed frontend URL). Optionally set `MONGODB_URI`.

## Vercel frontend
Root Directory: `client`; Build Command: `npm run build`; Output Directory: `dist`.
Set `VITE_API_URL` to your Render URL followed by `/api`.
