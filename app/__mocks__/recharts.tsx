// Test mock for recharts — returns simple div containers that don't call
// React.useContext (which breaks with multiple React instances in tests).
import React from "react";

const passthrough = ({ children }: { children?: React.ReactNode }) => (
  <div className="recharts-wrapper">{children}</div>
);

export const ResponsiveContainer = ({ children }: { children?: React.ReactNode }) => (
  <div style={{ width: "100%", height: "100%" }}>{children}</div>
);
export const BarChart = passthrough;
export const ComposedChart = passthrough;
export const AreaChart = passthrough;
export const LineChart = passthrough;
export const PieChart = passthrough;
export const RadarChart = passthrough;
export const ScatterChart = passthrough;

export const Bar = () => <g data-testid="recharts-bar" />;
export const Area = () => <g data-testid="recharts-area" />;
export const Line = () => <g data-testid="recharts-line" />;
export const Pie = () => <g data-testid="recharts-pie" />;
export const Radar = () => <g data-testid="recharts-radar" />;
export const Scatter = () => <g data-testid="recharts-scatter" />;
export const XAxis = () => <g data-testid="recharts-xaxis" />;
export const YAxis = () => <g data-testid="recharts-yaxis" />;
export const ZAxis = () => <g data-testid="recharts-zaxis" />;
export const CartesianGrid = () => <g data-testid="recharts-cartesian-grid" />;
export const Tooltip = () => null;
export const Legend = () => null;
export const Cell = () => null;
export const ReferenceLine = () => null;
export const ReferenceArea = () => null;
export const ReferenceDot = () => null;
export const Brush = () => null;
export const ErrorBar = () => null;
export const LabelList = () => null;
export const Label = () => null;
export const PolarGrid = () => null;
export const PolarAngleAxis = () => null;
export const PolarRadiusAxis = () => null;

const rechartsMock = {};
export default rechartsMock;
