# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server at http://localhost:5173
- `npm run build` — Production build to `dist/`
- `npm run lint` — ESLint across all .js/.jsx files
- `npm run preview` — Preview the production build locally

There is no test framework configured in this project.

## Environment Setup

A FRED API key is required. Copy `.env.example` to `.env` and set `VITE_FRED_API_KEY`. The key is accessed via `import.meta.env.VITE_FRED_API_KEY` (Vite convention — all client-exposed env vars must be prefixed with `VITE_`).

## Architecture

This is a single-page React app (Vite + Tailwind CSS v4) that visualizes U.S. economic data from the FRED API using Recharts.

### Data Flow

1. **Indicator config** (`src/services/fredApi.js`): `ECONOMIC_INDICATORS` is the central data model. Each indicator has a `seriesId` (primary FRED series), an array of `segments` (additional related FRED series), display metadata (`title`, `description`, `unit`, `color`), and segment-level colors.
2. **API layer** (`src/services/fredApi.js`): `fetchFredData(seriesId, limit)` fetches from `/api/fred/series/observations`, which Vite's dev server proxies to `https://api.stlouisfed.org/fred/` to avoid CORS issues (configured in `vite.config.js`). The proxy only works in dev — production would need a different strategy.
3. **Chart component** (`src/components/EconomicChart.jsx`): Receives an `indicator` object as a prop. Fetches all segments in parallel, merges data by date, computes month-over-month percentage change on the primary series. Renders a `ComposedChart` with lines (segments) on the left Y-axis and MoM change bars on the right Y-axis. Supports time range filtering (3M/6M/1Y/2Y/5Y/All) and segment visibility toggling.
4. **App shell** (`src/App.jsx`): Sidebar navigation lists all indicators from `ECONOMIC_INDICATORS`. Selected indicator state is passed to `EconomicChart`. Icons are inline SVG components mapped by indicator ID in `indicatorIcons`.

### Adding a New Indicator

1. Add an entry to `ECONOMIC_INDICATORS` in `src/services/fredApi.js` with the FRED series ID and segment definitions.
2. Add a corresponding SVG icon component and mapping in `indicatorIcons` in `src/App.jsx`.

### Styling

Tailwind CSS v4 via `@tailwindcss/postcss` plugin — styles use utility classes directly, no component library. The color palette for chart lines/bars is defined per-segment in `ECONOMIC_INDICATORS`, not in Tailwind config.
