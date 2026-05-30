/**
 * Concrete color values for SVG-based contexts (Recharts, Leaflet) where CSS
 * custom properties cannot resolve — SVG presentation attributes do not support
 * `var(--token)`. Values track the dark-mode brand palette in designsystem.md §2,
 * which reads correctly on both the dark app surface and the always-dark basemap.
 */
export const CHART = {
  primary: "#1E5EFF",
  primarySoft: "rgba(30, 94, 255, 0.4)",
  primaryFill: "rgba(30, 94, 255, 0.18)",
  muted: "#9CA3AF",
  mutedBar: "#374151",
  grid: "rgba(255, 255, 255, 0.08)",
  card: "#111827",
  border: "#1F2937",
  info: "#60A5FA",
  infoSoft: "rgba(96, 165, 250, 0.3)",
} as const;

/** Sequential primary-blue choropleth ramp (designsystem.md §9). */
export const HEAT_RAMP = ["#0B1B3A", "#14306B", "#1E5EFF", "#5B8BFF", "#A9C4FF"] as const;

/** Subtle light stroke for ward polygons over the dark basemap. */
export const MAP_STROKE = "rgba(255, 255, 255, 0.18)";
