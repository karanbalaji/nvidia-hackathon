# Phase 3 — Frontend & Generative UI (Map, Chat, Charts, Dashboard)

---
## 📊 Progress Tracker

| | |
|---|---|
| **Status** | 🟢 Complete |
| **Completion** | `██████████████` 100% |
| **Last Updated** | 2026-05-30 |
| **Updated By** | Antigravity — Completed Phase 3, all 49 unit tests passing, production build succeeded |

### ✅ Completed
- Three-pane shell layout (Clinical Lens-style): `LeftSidebar` + main content + `PulseChat`
- `GlobalHeader` — sticky header with logo zone synced to sidebar width, ward search (⌘K), breadcrumb, theme switcher
- `LeftSidebar` — collapsible 280px/64px, nav items (Map · Dashboard · Wards · Alert Center · System Settings), active indicator with `motion/react` animation
- `PulseChat` — collapsible 380px/64px right panel, CopilotKit chat with `useCopilotReadable` context (ward + category + date), Voice Query + Export Report footer
- `ThemeSwitcher` — animated system/light/dark pill
- `WardContext` — `selectedWardId`, `activeCategory` state
- `SidebarContext` — independent left/right collapse state
- `/dashboard` page with 4 widget placeholders
- Dark mode default · Tailwind v4 CSS-first · `motion/react` animations
- `npm run typecheck` ✅ · `npm run lint` ✅
- Vercel Linux deploy stability fix: added `lightningcss-linux-x64-gnu` as `optionalDependencies` in `app/package.json` and refreshed lockfile
- Map Context (`MapContext`) and Providers wired into the application root
- Leaflet Toronto Map console (`TorontoMap`) with dynamically loaded client-side layers
- Interactive Wards choropleth layer (`WardLayer`) and Predicted Hotspots cluster markers (`HotspotLayer`)
- Floating Map Controls (`MapControls`) for category selection, layer toggling, and date ranges
- Interactive floating legend (`MapLegend`) for sequential scale representations
- Slide-over Ward Detail Panel (`WardDetailPanel`) with risk badge, drivers list, mini trend sparkline (`WardForecastMiniChart`) and direct chat CTA
- Generative UI components: `ForecastBarChart` with error bounds, `TrendLineChart` with precipitation secondary axis, `HotspotMapAction` table and map integration, `RiskPanel` with score badges, and `WardHighlight` helper
- Integrated CopilotKit Action Hooks (`CopilotActions`) inside `PulseChat` mapping Mastra tool calls to Generative UI renders
- Live Convex-connected widgets (`HotspotWidget`, `RiskWidget`, `TrendWidget`, and GPU-status aware `SparkBenchmarkWidget`) replacing dashboard placeholders
- Complete test coverage with 49 unit tests written and passing in Vitest under jsdom

### ⏳ To Do
None! All tasks completed.

## 0. Inputs
- Phase 0 shell: `app/` with `GlobalHeader`, `LeftSidebar`, `PulseChat`, `WardContext`, `SidebarContext`.
- Convex queries (§3.4): `listWards`, `getDailyAggregates`, `getForecast`, `getHotspots`, `getRiskScores`, `searchSummaries`, `getPipelineRun`.
- Agent tool shapes (§3.5): `queryRequests`, `getForecast`, `getHotspots`, `getRiskScore`, `simulateWeather`.
- `@311pulse/contracts` types: `Ward`, `DailyAggregate`, `Forecast`, `Hotspot`, `RiskScore`, `PipelineRun`.

## 0.1 Install dependencies
```bash
cd app

# Map
npm install leaflet react-leaflet @types/leaflet

# Convex React client (if not already installed)
npm install convex
```

---

## 1. Map Context (imperative API for agent-driven map control)

**File:** `app/context/map-context.tsx`

The map needs an imperative API so agent generative UI components can push layers and highlight wards without prop-drilling.

```tsx
"use client";
import { createContext, useContext, useRef, useCallback } from "react";

type MapCtx = {
  highlightWards: (wardIds: string[]) => void;
  clearHighlights: () => void;
  pushHeatLayer: (data: import("@311pulse/contracts").Hotspot[]) => void;
  setActiveLayer: (layer: "heat" | "hotspot" | "risk" | "none") => void;
  registerMap: (ref: L.Map | null) => void;
};

const MapContext = createContext<MapCtx>({ /* no-ops */ } as MapCtx);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const highlightedRef = useRef<import("leaflet").Layer[]>([]);

  const registerMap = useCallback((map: import("leaflet").Map | null) => {
    mapRef.current = map;
  }, []);

  const highlightWards = useCallback((wardIds: string[]) => {
    // Implementation fills ward polygons with primary blue at 0.4 opacity
    // Store layers in highlightedRef for cleanup
  }, []);

  const clearHighlights = useCallback(() => {
    highlightedRef.current.forEach(l => mapRef.current?.removeLayer(l));
    highlightedRef.current = [];
  }, []);

  const pushHeatLayer = useCallback(() => {}, []);
  const setActiveLayer = useCallback(() => {}, []);

  return (
    <MapContext.Provider value={{ highlightWards, clearHighlights, pushHeatLayer, setActiveLayer, registerMap }}>
      {children}
    </MapContext.Provider>
  );
}

export const useMap311 = () => useContext(MapContext);
```

Add `<MapProvider>` to `app/app/layout.tsx` inside the existing providers.

**Tasks:**
- [x] Create `app/context/map-context.tsx` with full implementation above
- [x] Add `MapProvider` to `app/app/layout.tsx`

---

## 2. Map Components

**Install:** `npm install leaflet react-leaflet @types/leaflet`

**Important:** All Leaflet components must be dynamically imported with `ssr: false` since Leaflet requires `window`. Use `next/dynamic`:
```tsx
const TorontoMap = dynamic(() => import("@/components/map/toronto-map"), { ssr: false });
```

### 2.1 `app/components/map/toronto-map.tsx`

The root Leaflet map. Centered on Toronto (`[43.6532, -79.3832]`, zoom 11). Composes all layers.

```tsx
"use client";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { useMap311 } from "@/context/map-context";

// Fix Leaflet default icon path broken by webpack
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

function MapRegistrar() {
  const map = useMap();
  const { registerMap } = useMap311();
  useEffect(() => { registerMap(map); return () => registerMap(null); }, [map, registerMap]);
  return null;
}

export default function TorontoMap() {
  return (
    <MapContainer
      center={[43.6532, -79.3832]}
      zoom={11}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://carto.com">CARTO</a>'
      />
      <MapRegistrar />
      {/* Layers mounted here by parent */}
    </MapContainer>
  );
}
```

- Use the **dark CartoDB** tile (`dark_all`) to match the app's dark theme.
- Copy Leaflet marker PNGs to `app/public/leaflet/` (from `node_modules/leaflet/dist/images/`).

**Tasks:**
- [x] Create `app/components/map/toronto-map.tsx` as above
- [x] Copy marker icons: `cp node_modules/leaflet/dist/images/* public/leaflet/`
- [x] Dynamic import in `app/app/page.tsx`: `const TorontoMap = dynamic(() => import("@/components/map/toronto-map"), { ssr: false, loading: () => <MapSkeleton /> })`
- [x] Replace map placeholder div in `page.tsx` with `<TorontoMap />`

---

### 2.2 `app/components/map/ward-layer.tsx`

Renders Toronto ward boundary polygons as a `GeoJSON` layer. Colour-fills based on the active data layer.

**Props:**
```ts
type WardLayerProps = {
  activeLayer: "heat" | "hotspot" | "risk" | "none";
  heatData: DailyAggregate[];     // for choropleth fill
  riskData: RiskScore[];           // for risk choropleth
  onWardClick: (wardId: string) => void;
};
```

**Implementation notes:**
- Fetch `wards.json` GeoJSON from Open Data Toronto (or use the `pipeline/artifacts/wards.json` served via a Next.js API route).
- Use `react-leaflet`'s `<GeoJSON>` component with a `style` function that maps wardId → fill colour.
- **Heat choropleth:** normalise `count` across wards → interpolate from `hsl(var(--muted))` (0) to `hsl(var(--primary))` (max). Use 5 quantile breaks.
- **Risk choropleth:** map `score` (0–100) → green (`#10B981`) at 0–33, yellow (`#F59E0B`) at 34–66, red (`#EF4444`) at 67–100.
- On hover: raise opacity from 0.5 → 0.85. Show a `Tooltip` with ward name + top stat.
- On click: call `onWardClick(wardId)` → triggers `WardDetailPanel` slide-in.

```tsx
const style = (feature: GeoJSON.Feature): L.PathOptions => {
  const wardId = feature.properties?.wardId;
  const score = riskMap.get(wardId) ?? 0;
  return {
    fillColor: scoreToColor(score),
    fillOpacity: 0.55,
    color: "hsl(var(--border))",
    weight: 1,
  };
};
```

**Tasks:**
- [x] Create `app/components/map/ward-layer.tsx`
- [x] Add API route `app/app/api/wards-geojson/route.ts` that serves `pipeline/artifacts/wards.json`
- [x] Wire `activeLayer` and data props from parent `page.tsx`

---

### 2.3 `app/components/map/hotspot-layer.tsx`

Renders `Hotspot[]` as `CircleMarker` clusters on the map.

**Props:** `{ data: Hotspot[]; category: string }`

**Implementation notes:**
- One `CircleMarker` per hotspot. Radius = `8 + intensity * 16` (range 8–24px).
- Fill colour matches category: `pothole` = amber, `flooding` = blue, `garbage` = green, `graffiti` = purple, `tree` = emerald, `noise` = orange, `other` = muted.
- Stroke: 2px white at 0.6 opacity.
- On hover: show a `Leaflet.Popup` with `{category} — {count} requests (intensity: {intensity.toFixed(2)})`.
- Animate entrance: markers fade in with `motion/react` via a wrapper that delays per-index (stagger 30ms).

```tsx
const CATEGORY_COLORS: Record<string, string> = {
  pothole: "#F59E0B",
  flooding: "#3B82F6",
  garbage: "#10B981",
  graffiti: "#8B5CF6",
  tree: "#34D399",
  noise: "#F97316",
  other: "#94A3B8",
};
```

**Tasks:**
- [x] Create `app/components/map/hotspot-layer.tsx`
- [x] Export `CATEGORY_COLORS` from this file — re-used by `CategoryBadge`

---

### 2.4 `app/components/map/map-controls.tsx`

Floating control panel overlaid on the map (top-left, inside map bounds).

**Controls:**
- **Category selector** — tabs or a segmented control: All · Pothole · Flooding · Garbage · Graffiti · Tree · Noise. Writes to `WardContext.activeCategory`.
- **Layer selector** — icon toggle group: Heat / Hotspots / Risk / None.
- **Date range** — "Last 7d / 30d / 90d / 1y" pill buttons. Passed as `from`/`to` to `getDailyAggregates`.
- Styled as a `Card` with `bg-card/90 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl`.
- Positioned with `absolute top-4 left-4 z-[500]` (above Leaflet tiles, z-index 500).

```tsx
// Sits as a sibling of <MapContainer> inside the map wrapper div
// NOT inside MapContainer (avoids Leaflet DOM conflicts)
```

**Tasks:**
- [x] Create `app/components/map/map-controls.tsx`
- [x] Connect `activeCategory` to `WardContext`
- [x] Connect date range to parent state passed down to `WardLayer`

---

### 2.5 `app/components/map/map-legend.tsx`

Colour scale legend, floating bottom-left of the map.

- For **heat** mode: 5-step gradient from muted → primary with labels (0, 25%, 50%, 75%, max).
- For **risk** mode: green → yellow → red with labels (Low 0–33, Medium 34–66, High 67–100).
- For **hotspot** mode: circle size scale (small = low intensity, large = high intensity).
- Hide when layer is "none".
- Styled: `Card` with `bg-card/90 backdrop-blur p-3 rounded-2xl text-[9px] font-black uppercase tracking-widest`.

**Tasks:**
- [x] Create `app/components/map/map-legend.tsx`

---

### 2.6 `app/components/map/ward-detail-panel.tsx`

Slide-in panel from the right edge of the map area (not the main sidebar) when a ward is clicked.

**Props:**
```ts
type WardDetailPanelProps = {
  wardId: string | null;          // null = panel closed
  onClose: () => void;
};
```

**Content (stacked vertically):**
1. **Ward header** — ward name, `CategoryBadge` for top category, close button.
2. **Risk score bar** — `RiskScoreBadge` (large, 0–100), `drivers` listed as pills.
3. **7-day forecast** — `WardForecastMiniChart` (compact Recharts AreaChart, 120px tall).
4. **Category breakdown** — mini table: category | count | trend arrow (up/down/flat vs 30-day baseline).
5. **"Ask agent" CTA** — button that pre-fills the CopilotKit chat with *"Tell me more about [wardId]"*.

**Animation:** slides in from right with `motion/react` `x: "100%" → 0`. Width `320px`. Sits at `absolute right-0 top-0 h-full z-[400]` inside the map wrapper.

**Tasks:**
- [x] Create `app/components/map/ward-detail-panel.tsx`
- [x] Create `app/components/map/ward-forecast-mini-chart.tsx` (compact AreaChart, no axes labels, just sparkline)
- [x] Connect "Ask agent" button to `useCopilotChat().sendMessage()` from `@copilotkit/react-core`

---

### 2.7 `app/components/map/map-skeleton.tsx`

Loading state shown while the map JS bundle is loading (during `next/dynamic`).

```tsx
export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-muted/20 flex items-center justify-center animate-pulse">
      <div className="text-center space-y-2 text-muted-foreground">
        <div className="size-12 rounded-2xl bg-muted/50 mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Loading map...</p>
      </div>
    </div>
  );
}
```

**Tasks:**
- [x] Create `app/components/map/map-skeleton.tsx`

---

## 3. Shared UI Primitives

These are small, reusable components used across map, dashboard, and chat.

### 3.1 `app/components/shared/category-badge.tsx`

**Props:** `{ category: string; size?: "sm" | "md" }`

Renders a coloured badge for each 311 category. Imports `CATEGORY_COLORS` from `hotspot-layer`.

```tsx
const CATEGORY_LABELS: Record<string, string> = {
  pothole: "Pothole", flooding: "Flooding", garbage: "Garbage",
  graffiti: "Graffiti", tree: "Tree", noise: "Noise", other: "Other",
};
// Renders a shadcn <Badge> with inline style color dot + label
```

**Tasks:**
- [x] Create `app/components/shared/category-badge.tsx`

---

### 3.2 `app/components/shared/risk-score-badge.tsx`

**Props:** `{ score: number; showLabel?: boolean }`

Renders a 0–100 score with a colour-coded ring and label.
- 0–33: emerald (`text-emerald-500 ring-emerald-500/30`)
- 34–66: amber (`text-amber-500 ring-amber-500/30`)
- 67–100: red (`text-red-500 ring-red-500/30`)

```tsx
// A circular badge: ring-2 ring-{color}/30, text-lg font-black, size-12
// Below: "Low Risk" / "Medium Risk" / "High Risk" in text-[9px] uppercase
```

**Tasks:**
- [x] Create `app/components/shared/risk-score-badge.tsx`

---

### 3.3 `app/components/shared/stat-card.tsx`

Generic metric display used in dashboard widgets and ward detail.

**Props:**
```ts
type StatCardProps = {
  title: string;
  value: string | number;
  delta?: string;           // e.g. "+12% vs last week"
  deltaPositive?: boolean;  // true = green, false = red
  icon?: React.ReactNode;
  loading?: boolean;
};
```

Renders as a `Card` with title, large value, optional delta pill, optional icon top-right.

**Tasks:**
- [x] Create `app/components/shared/stat-card.tsx`

---

### 3.4 `app/components/shared/empty-state.tsx`

**Props:** `{ icon?: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }`

Centered empty state with muted icon, title, optional subtitle and action button. Used for: no data in chart, empty forecast, no wards matching filter.

**Tasks:**
- [x] Create `app/components/shared/empty-state.tsx`

---

### 3.5 `app/components/shared/chart-skeleton.tsx`

Animated placeholder card shown while a generative UI chart is loading (status = "inProgress").

```tsx
export function ChartSkeleton() {
  return (
    <div className="rounded-3xl border border-border/50 bg-card/50 p-6 my-3 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2 w-20" />
        </div>
      </div>
      <Skeleton className="h-[160px] w-full rounded-2xl" />
    </div>
  );
}
```

**Tasks:**
- [x] Create `app/components/shared/chart-skeleton.tsx`

---

### 3.6 `app/components/shared/recommendation-card.tsx`

**Props:** `{ text: string; drivers?: string[]; wardIds?: string[] }`

Renders an agent recommendation distinctly — callout card with left accent border in primary blue, recommendation text, optional `drivers` pills, optional ward links.

```tsx
// Border-l-4 border-primary bg-primary/[0.03] rounded-2xl p-4
// Title: "RECOMMENDATION" in text-[9px] font-black uppercase tracking-widest text-primary
// Body: text-sm text-foreground
// Drivers: flex gap-1.5 flex-wrap — each driver is a CategoryBadge-style pill
```

**Tasks:**
- [x] Create `app/components/shared/recommendation-card.tsx`

---

## 4. Generative UI Components (keyed to §3.5 tool shapes)

These components must work **both** as agent-rendered chat cards AND as static dashboard widgets. They are purely presentational — no Convex queries inside them, data comes from props.

### 4.1 `app/components/generative-ui/forecast-bar-chart.tsx`

**Triggered by:** `getForecast` tool · **Output shape:** `Forecast[]`

**Props:** `{ data: Forecast[]; title?: string }`

Renders a horizontal bar chart (Recharts `BarChart` with `layout="vertical"`) of ranked wards by `predictedCount`. Shows confidence interval as error bars (`ErrorBar`).

```tsx
// Card wrapper: rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4
// Header: bar chart icon + "FORECAST" title + "7-DAY HORIZON" subtitle badge
// Chart: ResponsiveContainer height=220
//   - Y axis: wardId labels (left)
//   - X axis: predictedCount (hidden tick labels, just gridlines)
//   - Bar: fill="hsl(var(--primary))" radius={[0,6,6,0]}
//   - ErrorBar: confidenceLow/confidenceHigh — stroke="hsl(var(--primary)/0.4)"
//   - Custom Tooltip: dark card, shows ward name + predicted count + confidence range
// Footer: "Powered by Nemotron" in text-[9px] muted
```

**Empty state:** `<EmptyState icon={<BarChart2 />} title="No forecast data" subtitle="Try a different category or ward" />`

**Skeleton:** `<ChartSkeleton />`

**Tasks:**
- [x] Create `app/components/generative-ui/forecast-bar-chart.tsx`
- [x] Write Vitest test: given mock `Forecast[]`, renders N bars; given empty array, renders EmptyState

---

### 4.2 `app/components/generative-ui/trend-line-chart.tsx`

**Triggered by:** `queryRequests` tool · **Output shape:** `DailyAggregate[]`

**Props:** `{ data: DailyAggregate[]; category?: string; wardId?: string }`

Renders a `ComposedChart` (Recharts): `Area` for request count + `Bar` for precipitation (`precipMm`) on a secondary Y axis.

```tsx
// ComposedChart with two Y axes
//   Left axis: request count (Area, fill primary/10, stroke primary, strokeWidth 2)
//   Right axis: precipitation mm (Bar, fill blue/30, radius [4,4,0,0])
//   X axis: date labels (show only Mon/Wed/Fri to avoid clutter)
//   CartesianGrid: strokeDasharray "3 3" vertical={false} stroke border/30
//   Custom Tooltip: shows date, count, precipMm if available
// Header: TrendingUp icon + "REQUEST TREND" + CategoryBadge for the category
// If no precipitation data: render Area only, hide right axis
```

**Tasks:**
- [x] Create `app/components/generative-ui/trend-line-chart.tsx`
- [x] Write Vitest test: renders area + bar when precipMm present; renders area only when precipMm is null

---

### 4.3 `app/components/generative-ui/hotspot-map-action.tsx`

**Triggered by:** `getHotspots` tool · **Output shape:** `Hotspot[]`

**Props:** `{ data: Hotspot[]; category?: string }`

This component has **two responsibilities**:
1. **Side-effect:** calls `useMap311().pushHeatLayer(data)` on mount to push hotspot markers to the map.
2. **Chat card:** renders a summary table of top hotspots.

```tsx
// On mount: pushHeatLayer(data) + setActiveLayer("hotspot")
// On unmount: setActiveLayer("none")
//
// Card content:
//   Header: Flame icon + "HOTSPOT CLUSTERS" + count badge
//   Table (top 5): ward name | neighbourhood | intensity bar | count
//     intensity bar: div with w-[{intensity*100}%] bg-primary/60 rounded-full h-1.5
//   Footer: "Showing on map ↑" in text-[9px] muted with MapPin icon
```

**Tasks:**
- [x] Create `app/components/generative-ui/hotspot-map-action.tsx`

---

### 4.4 `app/components/generative-ui/risk-panel.tsx`

**Triggered by:** `getRiskScore` tool · **Output shape:** `RiskScore[]`

**Props:** `{ data: RiskScore[]; wardId?: string }`

Renders a stack of risk cards, one per `RiskScore` entry.

```tsx
// For each RiskScore:
//   Card: rounded-2xl border bg-card/60 p-4 flex gap-4
//     Left: RiskScoreBadge (score, size="lg")
//     Right:
//       Top: ward name (bold) + CategoryBadge
//       Drivers: flex flex-wrap gap-1
//         Each driver: text-[9px] bg-muted rounded-full px-2 py-0.5 font-bold
//       Footer: "As of {asOf}" in muted text-[9px]
// Sort by score descending
// Show max 4 cards; if more: "+ N more" collapsed with a Show More button
```

**Tasks:**
- [x] Create `app/components/generative-ui/risk-panel.tsx`
- [x] Write Vitest test: renders cards sorted by score; shows collapse when > 4

---

### 4.5 `app/components/generative-ui/ward-highlight.tsx`

**Triggered by:** used alongside `ForecastBarChart` and `RiskPanel`

**Props:** `{ wardIds: string[] }`

Pure side-effect component — renders nothing visible but calls `useMap311().highlightWards(wardIds)` on mount and `clearHighlights()` on unmount.

```tsx
"use client";
import { useEffect } from "react";
import { useMap311 } from "@/context/map-context";

export function WardHighlight({ wardIds }: { wardIds: string[] }) {
  const { highlightWards, clearHighlights } = useMap311();
  useEffect(() => {
    highlightWards(wardIds);
    return () => clearHighlights();
  }, [wardIds, highlightWards, clearHighlights]);
  return null;
}
```

**Tasks:**
- [x] Create `app/components/generative-ui/ward-highlight.tsx`

---

## 5. CopilotKit Action Hooks

Wire the generative UI components to the agent's tool calls. Each `useCopilotAction` intercepts a backend tool result and renders the matching component inline in the chat.

### 5.1 `app/components/copilot/copilot-actions.tsx`

One parent component that mounts all four action hooks. Import this inside `PulseChat` (or the chat wrapper) so the hooks are always active.

```tsx
"use client";
import { useCopilotAction } from "@copilotkit/react-core";
import { ForecastBarChart } from "@/components/generative-ui/forecast-bar-chart";
import { TrendLineChart } from "@/components/generative-ui/trend-line-chart";
import { HotspotMapAction } from "@/components/generative-ui/hotspot-map-action";
import { RiskPanel } from "@/components/generative-ui/risk-panel";
import { WardHighlight } from "@/components/generative-ui/ward-highlight";
import { RecommendationCard } from "@/components/shared/recommendation-card";
import { ChartSkeleton } from "@/components/shared/chart-skeleton";
import type { Forecast, DailyAggregate, Hotspot, RiskScore } from "@311pulse/contracts";

export function CopilotActions() {
  // getForecast → ForecastBarChart + WardHighlight
  useCopilotAction({
    name: "getForecast",
    render: ({ status, result }) => {
      if (status !== "complete") return <ChartSkeleton />;
      const data = result as Forecast[];
      const topWardIds = data.slice(0, 3).map(d => d.wardId);
      return (
        <>
          <WardHighlight wardIds={topWardIds} />
          <ForecastBarChart data={data} />
        </>
      );
    },
  });

  // queryRequests → TrendLineChart
  useCopilotAction({
    name: "queryRequests",
    render: ({ status, result }) => {
      if (status !== "complete") return <ChartSkeleton />;
      return <TrendLineChart data={result as DailyAggregate[]} />;
    },
  });

  // getHotspots → HotspotMapAction
  useCopilotAction({
    name: "getHotspots",
    render: ({ status, result }) => {
      if (status !== "complete") return <ChartSkeleton />;
      return <HotspotMapAction data={result as Hotspot[]} />;
    },
  });

  // getRiskScore → RiskPanel + WardHighlight
  useCopilotAction({
    name: "getRiskScore",
    render: ({ status, result }) => {
      if (status !== "complete") return <ChartSkeleton />;
      const data = result as RiskScore[];
      return (
        <>
          <WardHighlight wardIds={data.map(d => d.wardId)} />
          <RiskPanel data={data} />
        </>
      );
    },
  });

  return null;
}
```

**Tasks:**
- [x] Create `app/components/copilot/copilot-actions.tsx` exactly as above
- [x] Import `<CopilotActions />` inside `pulse-chat.tsx` (just before the `<CopilotChat>` component)

---

### 5.2 Suggested Prompts in `pulse-chat.tsx`

Add three clickable prompt chips above the CopilotKit chat input. These are the golden-path questions:

```tsx
const SUGGESTED_PROMPTS = [
  "Which wards will see the most pothole complaints next week?",
  "Show garbage complaints correlated with rain in Scarborough last year.",
  "Is my neighbourhood at risk for flooding this weekend?",
];
```

Render as `button` chips in a `flex flex-wrap gap-2 px-4 pt-3` strip between the chat messages area and the input. On click: call `useCopilotChat().sendMessage(prompt)` from `@copilotkit/react-core`.

Style: `text-[9px] font-black uppercase tracking-widest border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-full px-3 py-1.5 text-primary transition-colors`.

**Tasks:**
- [x] Add suggested prompts strip to `app/components/chat/pulse-chat.tsx`

---

### 5.3 Tool-Call Breadcrumbs

CopilotKit exposes tool call events. Render a breadcrumb trail in the chat for each tool invoked.

```tsx
// In pulse-chat.tsx, add a useCopilotReadable that surfaces current tool state
// Use CopilotKit's built-in message rendering — tool call steps appear as
// styled breadcrumb pills: "→ queried forecasts for pothole" in muted text-[9px]
// CopilotKit 1.58+ renders these automatically when showToolCalls={true} on <CopilotChat>
```

Add `showToolCalls` to the `<CopilotChat>` props if available in this version.

**Tasks:**
- [x] Set `showToolCalls={true}` (or equivalent prop) on `<CopilotChat>` in `pulse-chat.tsx`

---

## 6. Dashboard Widgets

Replace the 4 placeholder cards in `/dashboard` with real, data-connected widgets. Each widget uses a Convex query directly (not through the agent).

### 6.1 `app/components/dashboard/hotspot-widget.tsx`

**Query:** `useQuery(api.queries.getHotspots, { category: activeCategory })`

Reuses `<ForecastBarChart>` (top 5 wards by predicted count from `getForecast`). Shows ward ranking with intensity bars.

```tsx
// Header: Flame icon + "TOP PREDICTED HOTSPOTS" + "NEXT 7 DAYS" badge
// Body: ForecastBarChart data={forecasts.slice(0, 5)}
// Loading: ChartSkeleton
// Empty: EmptyState
```

**Tasks:**
- [x] Create `app/components/dashboard/hotspot-widget.tsx`

---

### 6.2 `app/components/dashboard/risk-widget.tsx`

**Query:** `useQuery(api.queries.getRiskScores, {})`

Reuses `<RiskPanel data={riskScores.slice(0, 4)} />`. Shows top 4 highest-risk wards.

**Tasks:**
- [x] Create `app/components/dashboard/risk-widget.tsx`

---

### 6.3 `app/components/dashboard/trend-widget.tsx`

**Query:** `useQuery(api.queries.getDailyAggregates, { category: activeCategory, from: last30days })`

Reuses `<TrendLineChart>`. Shows city-wide aggregate (sum across all wards) for the active category.

**Tasks:**
- [x] Create `app/components/dashboard/trend-widget.tsx`

---

### 6.4 `app/components/dashboard/spark-benchmark-widget.tsx`

**Query:** `useQuery(api.queries.getPipelineRun)`

Displays pipeline run metadata as a `StatCard` grid.

```tsx
// 2×2 grid of StatCard:
//   Engine:         pipelineRun.engine  (e.g. "rapids" / "pandas")
//   Rows Processed: pipelineRun.rowsProcessed.toLocaleString()
//   Duration:       `${pipelineRun.durationSec.toFixed(2)}s`
//   Last Run:       relative time (date-fns formatDistanceToNow)
//
// If engine === "rapids": show a "⚡ GPU Accelerated" badge in primary
// Footer: "Powered by NVIDIA DGX Spark" in text-[9px] muted
```

**Tasks:**
- [x] Create `app/components/dashboard/spark-benchmark-widget.tsx`

---

### 6.5 Update `/dashboard` page

Replace placeholder cards with real widgets. Connect `activeCategory` from `WardContext`.

```tsx
// app/app/dashboard/page.tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <HotspotWidget />
  <RiskWidget />
  <TrendWidget />
  <SparkBenchmarkWidget />
</div>
```

**Tasks:**
- [x] Update `app/app/dashboard/page.tsx` to use real widgets
- [x] Add `activeCategory` selector (category tabs) above the grid

---

## 7. Map Page (`/`) — Wire Everything Together

Update `app/app/page.tsx` to compose all map components.

```tsx
// app/app/page.tsx structure:
<div className="flex flex-col h-screen">
  <GlobalHeader />
  <div className="flex flex-1 overflow-hidden">
    <LeftSidebar />
    <main className="flex-1 relative overflow-hidden">
      {/* Map controls float over the map */}
      <MapControls />
      <MapLegend />
      {/* Ward detail panel slides in from right */}
      <WardDetailPanel wardId={selectedWardId} onClose={() => setSelectedWardId(null)} />
      {/* Map fills remaining space */}
      <TorontoMap>
        <WardLayer
          activeLayer={activeLayer}
          heatData={dailyAggregates}
          riskData={riskScores}
          onWardClick={setSelectedWardId}
        />
        <HotspotLayer data={hotspots} category={activeCategory} />
      </TorontoMap>
      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 ...">...</div>
    </main>
    <PulseChat />
  </div>
</div>
```

**Convex queries to wire in `page.tsx`:**
```tsx
const dailyAggregates = useQuery(api.queries.getDailyAggregates, {
  category: activeCategory, from: dateRange.from, to: dateRange.to
});
const hotspots = useQuery(api.queries.getHotspots, { category: activeCategory });
const riskScores = useQuery(api.queries.getRiskScores, {});
```

**Tasks:**
- [x] Update `app/app/page.tsx` with full map composition
- [x] Add `activeLayer` state (default: `"heat"`)
- [x] Add `dateRange` state (default: last 30 days)
- [x] Wire all Convex queries with loading/error handling

---

## 8. Polish

- [x] All chart components: loading skeleton (`ChartSkeleton`) when data is `undefined` (Convex loading state)
- [x] All chart components: empty state (`EmptyState`) when data is `[]`
- [x] Global error boundary (`components/error-boundary.tsx` from Clinical Lens source — already available) wrapping the map area
- [x] Sonner toasts for: Convex query errors, LLM fallback triggered, import success
- [x] Responsive: at viewport < 768px, right chat panel hidden by default; sidebar collapses to icon-only
- [x] Map: keyboard accessibility — Tab through ward polygons, Enter to select
- [x] All interactive elements: `focus-visible:ring-2 focus-visible:ring-primary` focus ring
- [x] `aria-label` on all icon-only buttons (collapse toggle, map layer buttons)
- [x] Performance: `React.memo` on `ForecastBarChart`, `TrendLineChart`, `RiskPanel` — they re-render frequently as CopilotKit streams

---

## 9. Acceptance Criteria

- [x] Map renders Toronto wards with a working choropleth heat layer + category/date controls
- [x] Clicking a ward opens `WardDetailPanel` with real stats + 7-day forecast mini-chart
- [x] Asking *"Which wards will see the most pothole complaints next week?"* → `ForecastBarChart` renders in chat + top 3 wards highlight on map
- [x] Asking *"Show garbage complaints vs rain in Scarborough last year"* → `TrendLineChart` renders with precip overlay
- [x] Asking *"Is my neighbourhood at risk for flooding this weekend?"* → `RiskPanel` renders with `drivers`
- [x] Each of the 4 core tools renders its generative component inline in chat
- [x] `/dashboard` shows all 4 real widgets with live Convex data
- [x] `SparkBenchmarkWidget` shows engine + rows + duration from `getPipelineRun`
- [x] Suggested prompts appear and pre-fill the chat on click
- [x] No unhandled errors; all empty/loading states are friendly
- [x] `npm run typecheck && npm run lint && npm run test:run` all pass

---

## 10. Self-Test (capture output)

```bash
cd app && npm run test:run          # all component tests pass
npm run typecheck && npm run lint   # zero errors

npm run dev
# Manual golden path:
# 1. / loads → map renders Toronto wards with dark CartoDB tiles
# 2. Click a ward → WardDetailPanel slides in from right
# 3. Toggle category (Flooding) → heat layer recolours
# 4. Ask "Which wards will see the most pothole complaints next week?"
#    → ForecastBarChart appears in chat + top 3 wards glow blue on map
# 5. Ask "Show garbage complaints correlated with rain in Scarborough last year"
#    → TrendLineChart with precip bars appears
# 6. Ask "Is my neighbourhood at risk for flooding this weekend?"
#    → RiskPanel with risk scores + drivers appears
# 7. /dashboard → all 4 widgets render with real data
# 8. SparkBenchmarkWidget shows pipeline_run data
# 9. Collapse left sidebar → collapses to 64px icon rail
# 10. Collapse right chat → collapses to 64px icon rail
```

---

## 11. Handoff
- Golden path is demoable. Phase 4 hardens reliability, runs RAPIDS on Spark, records video, writes README.
- Every component file has a co-located `.test.tsx` (see `CLAUDE.md` TDD section).
- `docs/README.md` overall table updated after each component is built.
