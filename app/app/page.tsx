"use client";

import dynamic from "next/dynamic";
import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { PulseChat } from "@/components/chat/pulse-chat";
import { MapSkeleton } from "@/components/map/map-skeleton";

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        <main className="flex-1 relative overflow-hidden">
          <MapView />
        </main>

        <PulseChat />
      </div>
    </div>
  );
}
