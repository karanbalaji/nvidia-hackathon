/** Pearson correlation coefficient. Returns null when undefined (too few points or no variance). */
export function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;

  const sx = xs.slice(0, n);
  const sy = ys.slice(0, n);
  const mx = sx.reduce((a, b) => a + b, 0) / n;
  const my = sy.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = sx[i] - mx;
    const dy = sy[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }

  const denom = Math.sqrt(dx2 * dy2);
  if (denom === 0) return null;
  return num / denom;
}

/** Human-readable strength label for a correlation coefficient. */
export function correlationLabel(r: number): string {
  const a = Math.abs(r);
  const strength = a >= 0.6 ? "strong" : a >= 0.3 ? "moderate" : "weak";
  const direction = r >= 0 ? "positive" : "negative";
  return `${strength} ${direction}`;
}
