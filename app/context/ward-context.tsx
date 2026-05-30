"use client";
import { createContext, useContext, useState } from "react";

type WardCtx = {
  selectedWardId: string | null;
  setSelectedWardId: (id: string | null) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
};

const WardContext = createContext<WardCtx>({
  selectedWardId: null,
  setSelectedWardId: () => {},
  activeCategory: "pothole",
  setActiveCategory: () => {},
});

export function WardProvider({ children }: { children: React.ReactNode }) {
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("pothole");
  return (
    <WardContext.Provider value={{ selectedWardId, setSelectedWardId, activeCategory, setActiveCategory }}>
      {children}
    </WardContext.Provider>
  );
}

export const useWard = () => useContext(WardContext);
