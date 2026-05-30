# 311 Pulse Design System

This document outlines the design standards, component guidelines, and technical implementation details for the **311 Pulse** project — a predictive & agentic 311 intelligence console for the City of Toronto. All agents building frontend components (see `docs/03-frontend-and-generative-ui.md`) MUST adhere to these rules. Data tokens map to the contracts in `docs/README.md` §3.

## 1. Technical Stack
- **Framework**: Next.js 16+ (App Router, RSC) + React 19
- **Styling**: Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config.js`)
- **Components**: Shadcn UI (Radix UI primitives)
- **Charts**: Recharts
- **Maps**: Leaflet (→ Mapbox GL if time)
- **AI / Generative UI**: CopilotKit (AG-UI ↔ Mastra)
- **Icons**: Lucide React
- **Theming**: `next-themes` (Dark/Light/System) — **app ships Dark by default**
- **Animations**: `motion/react` (formerly Framer Motion)
- **Toasts**: Sonner
- **Font**: Lexend (Primary Sans-serif) / JetBrains Mono (Monospace)

## 2. Color Palette
A clean, high-contrast palette optimized for operations environments — most of the UI is neutral so a single critical ward or live signal stands out. Dark mode is primary.

### Light Mode (:root)
- **Primary Blue**: `#0D3BA5` — Main actions, branding, key data points.
- **Success Green**: `#10B981` — Positive states, stable / low-risk wards.
- **Warning Yellow**: `#F59E0B` — Cautionary alerts, missing data.
- **Critical Red**: `#EF4444` — Errors, severe service risk.
- **Info Blue**: `#3B82F6` — Informational highlights.
- **Background**: `#F8FAFC` (Neutral 50)
- **Surface/Card**: `#FFFFFF`
- **Text (Main)**: `#1E293B` (Neutral 800)
- **Text (Muted)**: `#64748B` (Neutral 500)
- **Border**: `#E2E8F0` (Neutral 200)

### Dark Mode (.dark) — default
- **Primary Blue**: `#1E5EFF` — Vibrant blue for high contrast on dark backgrounds.
- **Success Green**: `#10B981`
- **Warning Yellow**: `#F59E0B`
- **Critical Red**: `#EF4444`
- **Info Blue**: `#60A5FA`
- **Background Deep**: `#030712`
- **Surface/Card**: `#111827`
- **Text (Main)**: `#F3F4F6`
- **Text (Muted)**: `#9CA3AF`
- **Border Subtle**: `#1F2937`

### Color Usage Ratio
~70% neutral / ~20% data hues (categories §8, choropleth §9) / ~8% primary blue (live & interactive) / ~2% critical red (real risk only). Never use semantic or data colors decoratively.

## 3. Typography
- **Primary Font**: **Lexend** (Google Font)
  - Used for all reading content, headings, and descriptions.
- **Mono Font**: **JetBrains Mono** (Google Font)
  - Used for ALL precise data display (ward IDs, counts, forecasts, deltas, timestamps, coordinates) with `font-variant-numeric: tabular-nums`.

```ts
// app/app/fonts.ts
import { Lexend, JetBrains_Mono } from "next/font/google";
export const sans = Lexend({ subsets: ["latin"], variable: "--font-sans" });
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
// apply `${sans.variable} ${mono.variable}` on <html>
```

### Scale
| Token | Size / Line | Font |
|---|---|---|
| `h1` | 1.75rem / 1.15 | Lexend 600 |
| `h2` | 1.375rem / 1.2 | Lexend 600 |
| `h3` | 1.125rem / 1.3 | Lexend 600 |
| `body` | 0.9375rem / 1.55 | Lexend 400 |
| `label` | 0.6875rem / 1.2, 0.06em tracking, uppercase | Lexend 600 |
| `metric-xl` | 2.25rem / 1 | JetBrains Mono 600 |
| `metric` | 1.25rem / 1 | JetBrains Mono 500 |
| `mono-xs` | 0.75rem / 1.4 | JetBrains Mono 400 |

## 4. Animation Standards (Mild Professional Enterprise)
To maintain a professional, trustworthy aesthetic, animations must be subtle, purposeful, and non-distracting.

### 4.1 Transition Rules
- **Duration**: Use short durations (0.2s to 0.4s). Avoid long, sluggish transitions.
- **Physics**: Prefer `type: "spring"` with high stiffness and damping for a snappy, responsive feel.
- **Distance**: Keep movement distances small (e.g., `y: 10` or `y: 20` instead of `y: 100`).
- **Reduced motion**: Honor `prefers-reduced-motion` — fall back to opacity-only fades.

### 4.2 Common Patterns
- **Entry Fades**: Subtle `opacity` + small `y` offset (10-20px) on page or section load.
- **Staggering**: Apply a slight `staggerChildren` (0.05s - 0.1s) for lists, metric tiles, or card grids to guide the eye.
- **Hover States**:
  - **Cards**: Gentle lift (`y: -4` to `-8`) with a subtle increase in border intensity or shadow (e.g. `card-glow`).
  - **Buttons**: Scale up slightly (`scale: 1.02`) or adjust background-color.
- **Active States**: Immediate feedback with `scale: 0.98`.
- **Map highlight**: when the agent answers, target wards get one gentle pulse ring (single 600ms expand) — not a loop.

## 5. Component Standards
- **Shadcn UI**: MANDATORY for all standard UI elements.
- **Radius**: Medium corners (`--radius: 0.5rem` / `8px`).
- **Cards**: Use subtle shadows in light mode, and a soft glow (`box-shadow: 0 0 15px rgba(30, 94, 255, 0.1)`) in dark mode.
- **MetricTile**: Card with uppercase Lexend label, `metric-xl` mono value, and a ▲/▼ delta in success/critical. Numbers count up on first paint.
- **Badge**: variants for `severity` (§7), `category` (§8), `status`, and `live` (primary dot). Always pair color with text/icon — never color alone.
- **Table**: dense, mono numeric columns right-aligned + tabular-nums, sticky header, row hover with primary left-border.

## 6. Generative UI (CopilotKit)
- Chat cards MUST use the `primary` and `card` variables and follow the "Mild Professional" animation standard.
- **Copilot chat**: right rail. User bubbles use `secondary`; agent bubbles use `card` with a `primary` left-edge accent + spark icon. Inline numbers in mono.
- **Tool-call breadcrumbs**: small mono chips (e.g. `→ getForecast · pothole`) so the agentic steps are visible to judges; animate in as each tool fires.
- **Tool → component mapping** (output shapes from `docs/README.md` §3.5):

  | Tool | Renders |
  |---|---|
  | `getForecast` | `ForecastBarChart` (ranked wards) + map `WardHighlight` |
  | `queryRequests` | `TrendLineChart` (category trend, optional precip overlay) |
  | `getHotspots` | map heat layer |
  | `getRiskScore` | `RiskPanel` (severity tiles + `drivers[]`) |

- **Insight card (hero)**: a card containing a `primary` "Generated by 311 Pulse" eyebrow, the rendered chart/map action, and a **recommendation callout** listing `RiskScore.drivers`. Staggered reveal (eyebrow → title → chart → recommendation). This is the demo's money shot.
- **Streaming/thinking**: a skeleton matching the eventual card shape (no layout shift) + a subtle pulse — calm, not spinny.
- **Suggested prompts**: seed with the three golden-path questions (`prd.md` §3). **Cmd+K** opens the copilot anywhere.

## 7. Risk Severity Scale
The most important data-color decision. Maps directly to `RiskScore.score` (0–100). Sequential, extends the §2 semantic colors. Always render color **and** label.

| Band | Score | Hex | Label |
|---|---|---|---|
| Low | 0–20 | `#10B981` (Success) | **Low** |
| Guarded | 21–40 | `#84CC16` (Lime) | **Guarded** |
| Elevated | 41–60 | `#F59E0B` (Warning) | **Elevated** |
| High | 61–80 | `#F97316` (Orange) | **High** |
| Severe | 81–100 | `#EF4444` (Critical) | **Severe** |

```ts
// app/lib/severity.ts — single source for score → band
export function severityBand(score: number) {
  if (score <= 20) return { key: "low",      label: "Low",      hex: "#10B981" };
  if (score <= 40) return { key: "guarded",  label: "Guarded",  hex: "#84CC16" };
  if (score <= 60) return { key: "elevated", label: "Elevated", hex: "#F59E0B" };
  if (score <= 80) return { key: "high",     label: "High",     hex: "#F97316" };
  return            { key: "severe",   label: "Severe",   hex: "#EF4444" };
}
```

## 8. Service Category Colors
One hue per canonical 311 category (pipeline `categories` contract). Distinguishable on dark and colorblind-safe in pairs. Used in charts, map markers, filter chips.

| Category | Hex |
|---|---|
| `pothole` | `#D97706` (amber) |
| `garbage` | `#65A30D` (olive) |
| `flooding` | `#2563EB` (blue) |
| `graffiti` | `#DB2777` (pink) |
| `tree` | `#059669` (emerald) |
| `noise` | `#7C3AED` (violet) |
| `other` | `#64748B` (slate) |

```ts
// app/lib/categories.ts
export const CATEGORY_COLOR: Record<string, string> = {
  pothole: "#D97706", garbage: "#65A30D", flooding: "#2563EB",
  graffiti: "#DB2777", tree: "#059669", noise: "#7C3AED", other: "#64748B",
};
```

## 9. Map Theming (Leaflet)
The map is the centerpiece — the data layers, not the streets, carry the color.
- **Base tiles**: dark, low-saturation basemap (CARTO Dark Matter / Mapbox dark).
- **Ward polygons**: default stroke `Border Subtle`, transparent fill. Hover → `Primary` stroke + 6% primary fill. Selected → primary stroke + card glow.
- **Choropleth (count)**: sequential primary-blue ramp `#0B1B3A → #14306B → #1E5EFF → #5B8BFF → #A9C4FF`.
- **Risk choropleth**: the §7 severity scale.
- **Hotspot heat**: radial gradient from the category hue → transparent; `Hotspot.intensity` (0–1) drives radius + alpha.
- **Agent highlight (`WardHighlight`)**: target wards get a single primary pulse ring + raised z, anchoring the agent's answer on the map.
- **Legend**: always visible, bottom-left, mono labels, active ramp + category key. Non-negotiable.
- **Controls**: restyle Leaflet zoom/attribution to surface tokens — never leave default blue Leaflet chrome.

## 10. Data Visualization (Recharts)
Charts are quiet: thin grid, no chart-junk, mono axis labels, subtle entrance on data load (follow §4).
- Axis/grid use `Text (Muted)` / `Border`; series use `Primary` or the relevant `category`/`severity` color.
- **ForecastBarChart**: horizontal ranked bars; top bar tinted `Primary` ("the answer"), rest neutral; confidence band as a lighter overlay.
- **TrendLineChart**: single category-colored line, optional precip as faint area on a secondary axis.
- Tooltips are `card` surfaces with mono values; always show forecast confidence ranges, never bare point estimates.

## 11. Accessibility & Data Integrity
- WCAG AA contrast for all text; verify severity/category hues against `card`.
- Never encode meaning in color alone — always add a label or icon.
- `focus-visible` ring uses `Primary` at 2px offset, including map controls.
- Keyboard: Cmd+K copilot, full tab order, chat input always reachable.
- Numbers locale-formatted (`Intl.NumberFormat("en-CA")`), tabular, with units. Show data freshness ("as of …") and source.
