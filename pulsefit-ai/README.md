# PulseFit AI v4 — MERN Fitness Portfolio

React 18 + Vite 5, Express 4 + Mongoose 8, MongoDB, Socket.io, Recharts. White/green responsive UI. This project is a portfolio prototype, **not** a production-hardened fitness or payments platform.

## Start locally (Node 18+, MongoDB)

```bash
cd backend
npm install
cp .env.example .env   # On Windows CMD: copy .env.example .env
# Replace JWT_SECRET with a random 32+ character value
npm run seed
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 or http://127.0.0.1:5173. API health: http://localhost:5000/api/health.

Demo: `demo@example.com` / `demo1234`; admin: `admin@pulsefit.in` / `admin1234`; buddies: `buddy.rohan@example.com` / `buddy1234` (and other names). **Seed deletes existing collections**: run only against a disposable database. Change all demo credentials before any public deployment.

## AI honesty
- Coach: keyword rules informed by user stats; **not an LLM**.
- Diet plan: Mifflin-St Jeor BMR/TDEE, deterministic macros and illustrative Indian meals; **not ML**. Not medical advice.
- Food database: 70+ **illustrative** per-serving macro estimates, not independently verified nutrition facts.
- Transformation filters: plain CSS; **no AI photo analysis**.
- Form Check: MediaPipe Pose from CDN + angle thresholds; heuristic reps, not a medically validated form assessment.
- Python FastAPI: optional skeleton only; both endpoints explicitly return `not_implemented`.
- Checkout: **DUMMY** 30-day premium activation; no payment gateway or actual ₹199 charge. Never expose this bypass on a real paid product.

## Diet contract
POST `/api/diet/plan` (premium JWT): `{ "age":23,"gender":"male","weightKg":76,"heightCm":178,"activity":"moderate","goal":"fat-loss","dietType":"veg" }`. Returns `bmr`, `tdee`, `targetCalories`, `macros`, `meals`. BMR = 1763, TDEE ≈ 2733, target ≈ 2186, protein ≈ 137 g, fats ≈ 61 g, carbs ≈ 272 g (rounding may vary by 1). GET returns saved plan. Free users get HTTP 403 `{ "code":"premium_required" }`.

## Optional Python skeleton
`cd ai-engine && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`. POST `/form-check` and `/macro-scan` with `{ "image_url":"..." }` return explicit unimplemented responses.

## Deployment
Create free MongoDB Atlas cluster, deploy `backend` to Render with `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL=https://your-app.vercel.app`; deploy `frontend` to Vercel with root `frontend` and `VITE_API_URL=https://your-render-url/api`. Vercel SPA rewrite is configured. Render's ephemeral filesystem means **local Multer uploads are not durable**; use persistent object storage before production. Free-tier availability and limits may change.

## Known prototype limitations
Socket message delivery works with authenticated buddy checks, but read receipts/unread counters and reconnect recovery are basic. Location matching is approximate from user-entered coordinates; no browser geolocation is requested. Photo storage is local and food macros are estimates. Challenge leaderboards count check-ins, including for volume-type challenges. Admin and seed data are demonstration-only. Validate all user-supplied data more thoroughly, add CSRF/XSS defenses, tests, moderation, upload scanning, stronger pagination, and transaction-safe workflows before production.


## Free edition changes
All features are free. The premium badge, plans UI, dummy checkout API, and diet-plan premium middleware have been removed. The Diet Plan Generator remains rule-based and is accessible to all authenticated users. Legacy plan fields may remain in the User model and auth payload for backward compatibility with existing databases.
