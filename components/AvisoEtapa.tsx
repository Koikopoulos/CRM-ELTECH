import { Info } from "lucide-react";

export function AvisoEtapa({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-ciano/30 bg-ceu/60 px-4 py-3 text-[14px] leading-relaxed text-marinho">
      <Info className="mt-0.5 size-4 shrink-0 text-azul" />
      <p>{children}</p>
    </div>
  );
}
