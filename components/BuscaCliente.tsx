"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { classeCampo } from "@/components/ui";

type Opcao = { id: number; razao_social: string; cnpj: string | null; cpf: string | null; cidade: string | null; uf: string | null };

/** Campo de busca de cliente. Só aparecem clientes que o perfil do usuário pode ver. */
export function BuscaCliente({ name, inicial }: { name: string; inicial?: Opcao | null }) {
  const [termo, setTermo] = useState(inicial?.razao_social ?? "");
  const [escolhido, setEscolhido] = useState<Opcao | null>(inicial ?? null);
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [aberto, setAberto] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (escolhido && termo === escolhido.razao_social) return;
    if (temporizador.current) clearTimeout(temporizador.current);
    const t = termo.replace(/[,()*%\\]/g, " ").trim();
    if (t.length < 2) {
      setOpcoes([]);
      return;
    }
    temporizador.current = setTimeout(async () => {
      const supabase = createClient();
      const q = supabase
        .from("clientes")
        .select("id, razao_social, cnpj, cpf, cidade, uf")
        .or(`razao_social.ilike.%${t}%,nome_fantasia.ilike.%${t}%,cnpj.ilike.%${t}%,cpf.ilike.%${t}%`)
        .order("razao_social")
        .limit(8);
      const { data } = await q;
      setOpcoes((data ?? []) as Opcao[]);
      setAberto(true);
    }, 250);
  }, [termo, escolhido]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={escolhido?.id ?? ""} />
      <Search className="pointer-events-none absolute left-3 top-[20px] size-4 -translate-y-1/2 text-apagado" />
      <input
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value);
          setEscolhido(null);
        }}
        onFocus={() => opcoes.length && setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="Digite o nome do cliente"
        className={`${classeCampo} pl-9`}
        role="combobox"
        aria-expanded={aberto}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {escolhido && (
        <p className="mt-1 text-[13px] text-apagado">
          {escolhido.cnpj ?? escolhido.cpf ?? "Sem documento"} · {[escolhido.cidade, escolhido.uf].filter(Boolean).join(" / ") || "Sem cidade"}
        </p>
      )}
      {aberto && !escolhido && termo.trim().length >= 2 && (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-linha bg-white py-1 shadow-lg">
          {opcoes.length === 0 && <li className="px-3 py-2 text-sm text-apagado">Nenhum cliente encontrado na sua carteira.</li>}
          {opcoes.map((o) => (
            <li key={o.id} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setEscolhido(o);
                  setTermo(o.razao_social);
                  setAberto(false);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-nevoa"
              >
                <span className="block text-[15px] text-tinta">{o.razao_social}</span>
                <span className="block text-[13px] text-apagado">
                  {o.cnpj ?? o.cpf ?? "Sem documento"} · {[o.cidade, o.uf].filter(Boolean).join(" / ") || "Sem cidade"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
