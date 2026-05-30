# Phase 3 — Frontend & Generative UI (Map, Chat, Charts, Dashboard)

> **Goal:** Build the polished, demo-winning interface — an interactive Toronto map, a CopilotKit chat that renders **generative UI** (charts + map highlights) from agent tool calls, and an operations dashboard. This is the visible half of "both predictions and agent must land."

**Owner agent scope:** Read this file + `docs/README.md` §3 (contracts §3.2, §3.4, §3.5). Build against **Phase 0 mock data in Convex** and the **tool output shapes in §3.5** — you do not need Phase 1/2 fully finished, only their frozen signatures. Use the Convex React client for direct reads and CopilotKit for agent-driven rendering.

**Outcome:** The golden path (`prd.md` §9) is fully visible: ask a question → chart + map update → recommendation shown.

---

## 0. Inputs
- Next.js shell + shadcn/ui + CopilotKit chat (Phase 0).
- Convex queries (§3.4) and agent tools (§3.5).
- Contracts package for all types.

## 1. Map (Leaflet first)
- [ ] Install `leaflet react-leaflet`. Center on Toronto.
- [ ] Load ward boundaries GeoJSON (from `wards.json` / a public Toronto wards GeoJSON) and render ward polygons.
- [ ] **Heat layer:** render 311 density per ward from `getDailyAggregates` (choropleth by count) with a category + date-range selector.
- [ ] **Hotspot layer:** plot `getHotspots` clusters (sized/colored by intensity).
- [ ] **Risk overlay:** choropleth from `getRiskScores` (0–100) with a legend.
- [ ] Expose an imperative API (context/store) so the agent can **highlight specific wards** (used by generative UI in §3).
- [ ] Click a ward → side panel with that ward's stats + forecast.

> If time allows, upgrade to Mapbox GL for smoother heatmaps — Leaflet ships first.

## 2. Generative UI components (keyed to tools §3.5)
Build presentational components that take a tool's output shape and render it. They must work both as dashboard widgets and as agent-rendered chat cards.

- [ ] `ForecastBarChart({ data: Forecast[] })` — ranked wards bar chart (Recharts). Triggered by `getForecast`.
- [ ] `TrendLineChart({ data: DailyAggregate[] })` — time series with optional precip overlay. Triggered by `queryRequests`.
- [ ] `HotspotMapAction({ data: Hotspot[] })` — pushes a heat layer onto the map. Triggered by `getHotspots`.
- [ ] `RiskPanel({ data: RiskScore[] })` — risk cards with `drivers` listed. Triggered by `getRiskScore`.
- [ ] `WardHighlight({ wardIds })` — tells the map to highlight wards (used alongside forecast answers).

## 3. Wire generative UI to the agent (CopilotKit)
- [ ] For each tool in §3.5, register a `useCopilotAction` (or render hook) that intercepts the tool result and renders the matching component **inline in the chat** AND updates the map where relevant.
- [ ] Example: `getForecast` result → render `<ForecastBarChart>` in chat + call `WardHighlight` for the top wards on the map.
- [ ] Stream-friendly: show a skeleton/loading card while the tool runs.

```tsx
// app/components/copilot/useForecastAction.tsx (excerpt)
useCopilotAction({
  name: "getForecast",
  available: "frontend",            // render result from backend tool
  render: ({ status, result }) => {
    if (status !== "complete") return <ChartSkeleton />;
    const data = result as Forecast[];
    highlightWards(data.slice(0, 3).map(d => d.wardId));   // map side-effect
    return <ForecastBarChart data={data} />;
  },
});
```

## 4. Chat experience
- [ ] Style `<CopilotChat />` to match the app (shadcn). Add a header, suggested prompts seeded with the **three golden-path questions** from `prd.md` §3.
- [ ] Show tool-call breadcrumbs ("→ queried forecasts for pothole") so judges see the agentic steps.
- [ ] Render recommendations distinctly (callout card with the `drivers`).

## 5. Dashboard view (`/dashboard`)
- [ ] A non-chat overview for the "predictions" half: top predicted hotspots next week, highest-risk wards, a city-wide trend chart, and the **Spark benchmark** stat from `getPipelineRun` ("processed N rows in Ms on <engine>").
- [ ] Reuse the generative components as static widgets.

## 6. Polish
- [ ] Loading/empty/error states everywhere (skeletons, Sonner toasts).
- [ ] Responsive two-pane → stacks on narrow screens.
- [ ] Dark, clean, "city ops console" aesthetic. Consistent spacing, legible legends.
- [ ] Accessibility basics: labels, keyboard focus on chat input.

## 7. Acceptance Criteria
- [ ] Map renders Toronto wards with a working heat layer + category/date controls.
- [ ] Asking the golden-path forecast question renders a `ForecastBarChart` **in chat** and highlights the top wards **on the map**.
- [ ] Each of the 4 core tools (§3.5) renders its matching generative component.
- [ ] `/dashboard` shows hotspots, risk, trend, and the Spark benchmark stat.
- [ ] No unhandled errors; empty data shows friendly states.
- [ ] Suggested prompts run the three §3 user stories end-to-end.

## 8. Self-Test (capture output)
```bash
npm run dev
# Manual checklist:
# 1. Map loads + heat layer toggles by category
# 2. Ask "Which wards will see the most pothole complaints next week?" → chart in chat + map highlight
# 3. Ask "Show garbage complaints vs heavy rain in Scarborough last year" → trend chart
# 4. Ask "Is my neighbourhood at risk for flooding this weekend?" → risk panel
# 5. /dashboard shows all widgets + benchmark stat
npm run typecheck && npm run lint
```

## 9. Handoff
- The golden path is now demoable. Phase 4 hardens reliability, records the video, and writes the README/Spark story.
