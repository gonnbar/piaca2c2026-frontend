# PIACA - Frontend (piaca2c2026-frontend)

Webapp responsive para seguimiento integral de pacientes de nutrición deportiva/culturismo.

## Stack
- React 19 + TypeScript + Vite 8
- Tailwind CSS 4 (@tailwindcss/vite)
- React Router 7
- Recharts

## Identidad visual (AGENTS.md)
```
Primary: #4CAF50 / Dark #388E3C / Light #8BC34A
Background: #F5F7FA / Surface: #FFFFFF
Text: #263238 / Text Light: #616161
Border: #E0E0E0 / Error: #E53935
```

## Estructura
```
src/
├── components/      # Button, Input, Modal, Card, Table, Badge, Navbar, Sidebar, ChartCard, FormField
│   └── ui/
├── pages/           # Dashboard, Login (resto por implementar)
├── layouts/         # MainLayout
├── hooks/           # useEditWindow (regla 10 min)
├── services/        # api.ts (fetch con JWT)
├── contexts/        # AuthContext
└── utils/           # constants.ts, calculations.ts (IMC, macros, canEdit)
```

## Scripts
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Variables de entorno
Copiar `.env.example` a `.env`:
```
VITE_API_URL=http://localhost:3000/api
```

## Flujo API (AGENTS.md)
`route → middleware → controller → service → model → MongoDB` — el frontend solo consume `/api/*` con JWT.

## Regla 10 minutos
`createdAt + 10min > now` validada en backend; `utils/calculations.ts:canEdit` y `hooks/useEditWindow.ts` solo reflejan visualmente.
