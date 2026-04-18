# Strideon — Frontend

React web client for the Strideon running app.

## Stack

- React 18 + TypeScript
- Vite
- Mantine (UI components)
- Leaflet + react-leaflet + OpenStreetMap (maps)
- TanStack Query (server state)
- React Router
- Axios

## Setup

```bash
cd frontend
npm install
cp .env.example .env
# adjust VITE_API_BASE_URL if the backend is not on http://localhost:8000
```

## Scripts

```bash
npm run dev       # start Vite dev server on http://localhost:5173
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
```

## Project layout

```
frontend/
├── src/
│   ├── api/         # HTTP client + endpoint wrappers
│   ├── pages/       # top-level routed pages
│   ├── components/  # reusable UI (future)
│   ├── App.tsx      # routes
│   ├── main.tsx     # entry point, providers
│   └── theme.ts     # Mantine theme
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Path alias

`@/*` resolves to `src/*` — e.g. `import { apiClient } from "@/api/client"`.
