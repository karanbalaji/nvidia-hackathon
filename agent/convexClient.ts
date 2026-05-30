import { ConvexHttpClient } from "convex/browser";

const url =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  process.env.CONVEX_URL ??
  // Graceful placeholder — operations will fail at runtime with a clear 4xx if URL is unset
  "https://placeholder-no-convex-url-set.convex.cloud";

export const convex = new ConvexHttpClient(url);
