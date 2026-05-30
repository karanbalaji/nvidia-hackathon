import type { Metadata } from "next";
import { Lexend, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { CopilotKit } from "@copilotkit/react-core";
import { SidebarProvider } from "@/context/sidebar-context";
import { WardProvider } from "@/context/ward-context";
import { MapProvider } from "@/context/map-context";
import { Toaster } from "@/components/ui/sonner";
import { ConvexClientProvider } from "./convex-client-provider";
import "./globals.css";

const lexend = Lexend({ variable: "--font-lexend", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "311 Pulse — Predictive 311 Intelligence",
  description: "Agentic, GPU-accelerated 311 intelligence for the City of Toronto",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lexend.variable} ${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased font-[family-name:var(--font-lexend)]">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ConvexClientProvider>
            <CopilotKit runtimeUrl={process.env.NEXT_PUBLIC_COPILOTKIT_URL ?? "/api/copilotkit"}>
              <SidebarProvider>
                <WardProvider>
                  <MapProvider>
                    {children}
                  </MapProvider>
                </WardProvider>
              </SidebarProvider>
            </CopilotKit>
            <Toaster />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
