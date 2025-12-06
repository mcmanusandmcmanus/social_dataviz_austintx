## Austin Traffic Storyboard

Mosaic-style mobile-first Next.js app that tells the story of Austin’s real-time traffic incidents. It blends:

- Live fetch of the City of Austin Open Data set ([Real-Time Traffic Incident Reports](https://data.austintexas.gov/Transportation-and-Mobility/Real-Time-Traffic-Incident-Reports/dx9v-zd7x/about_data))
- Client visuals (Recharts) for cadence + issue mix
- Python analytics (NetworkX graph, scikit-learn clustering, PyTorch CPU risk scoring) saved to `public/data/`

## Quick start (web)
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Data + ML pipeline
```bash
# 1) Optional: create a virtual env
python -m venv .venv
.\\.venv\\Scripts\\activate

# 2) Install Python deps
python -m pip install -r analysis/requirements.txt

# 3) Refresh the analysis snapshot + sample incidents
python analysis/run_analysis.py   # or: npm run analyze:data
```
Outputs land in `public/data/analysis.json` (network + clusters + torch stats) and `public/data/incidents-sample.json` (fresh sample incidents used as fallback).

## Environment
```
AUSTIN_DATA_APP_TOKEN=your_austin_open_data_app_token
```
The app will use this token for the Socrata API if present. You can copy your existing credentials from `C:\Users\mcman\webapp_social_dataviz_key.env` into a local `.env.local`.

## Stack notes
- Next.js 16 + App Router + Tailwind v4 (inline theme tokens)
- Recharts for timeline + distribution charts
- NetworkX / scikit-learn / PyTorch CPU for offline analytics
- Data fallbacks ship in `public/data` so the UI renders without network access

## Scripts
- `npm run dev` — start the Next.js dev server
- `npm run build && npm start` — production build + serve
- `npm run lint` — lint TS/JS
- `npm run analyze:data` — run the Python pipeline to refresh JSON outputs

## Render deploy (render.yaml)
- Repo already has `render.yaml`. On Render, choose “New > Blueprint” and point to the repo/branch.
- Default build: `npm install && npm run build`; start: `npm start`; Node 20.
- Add environment variable `AUSTIN_DATA_APP_TOKEN` for higher API quotas; omit if you want to rely on anonymous access + bundled fallbacks.
