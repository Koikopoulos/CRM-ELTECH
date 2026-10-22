import type { LucideIcon } from "lucide-react";

export function Vazio({
  icone: Icone,
  titulo,
  texto,
  children,
}: {
  icone: LucideIcon;
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-ceu text-azul">
        <Icone className="size-5" />
      </span>
      <p className="mt-4 text-base font-semibold text-marinho">{titulo}</p>
      <p className="mt-1 max-w-md text-[15px] leading-relaxed text-apagado">{texto}</p>
      {children}
    </div>
  );
}
