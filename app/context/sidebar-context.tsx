"use client";
import { createContext, useContext, useState } from "react";

type SidebarCtx = {
  isLeftCollapsed: boolean;
  isRightCollapsed: boolean;
  toggleLeft: () => void;
  toggleRight: () => void;
};

const SidebarContext = createContext<SidebarCtx>({
  isLeftCollapsed: false,
  isRightCollapsed: false,
  toggleLeft: () => {},
  toggleRight: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isLeftCollapsed, setLeft] = useState(false);
  const [isRightCollapsed, setRight] = useState(false);
  return (
    <SidebarContext.Provider value={{
      isLeftCollapsed,
      isRightCollapsed,
      toggleLeft: () => setLeft(v => !v),
      toggleRight: () => setRight(v => !v),
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
