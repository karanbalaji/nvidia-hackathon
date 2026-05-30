export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 px-6 py-2 shrink-0">
      <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
        <span className="text-primary mr-1">311 Pulse</span> — Powered by{" "}
        <span className="text-foreground">NVIDIA Nemotron</span> via NIM ·{" "}
        <span className="text-foreground">RAPIDS</span> on DGX Spark ·{" "}
        <span className="text-foreground">Mastra</span> + CopilotKit
      </p>
    </footer>
  );
}
