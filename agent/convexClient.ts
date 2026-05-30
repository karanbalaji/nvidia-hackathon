import { ConvexHttpClient } from "convex/browser";

export function getConvexUrl(): string {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error(
      "CONVEX_URL is not set. Add CONVEX_URL=https://your-deployment.convex.cloud to .env.local"
    );
  }
  return url;
}

let _client: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!_client) {
    _client = new ConvexHttpClient(getConvexUrl());
  }
  return _client;
}
