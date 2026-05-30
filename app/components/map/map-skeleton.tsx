export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-muted/20 flex items-center justify-center animate-pulse">
      <div className="text-center space-y-2 text-muted-foreground">
        <div className="size-12 rounded-2xl bg-muted/50 mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
          Loading map...
        </p>
      </div>
    </div>
  );
}
