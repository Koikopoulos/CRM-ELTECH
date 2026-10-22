import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { devBypass } from "@/lib/supabase/env";
import { PERFIS } from "@/lib/dominio";

export default async function LayoutCRM({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !devBypass) redirect("/login");

  const email = user?.email ?? "visualizacao@eltech.local";
  let nome = user ? email.split("@")[0].replace(/[._]/g, " ") : "Modo de visualização";
  let perfil = user ? "Sem perfil cadastrado" : "Somente desenvolvimento";

  if (user) {
    const { data } = await supabase
      .from("usuarios")
      .select("nome, perfil")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (data) {
      nome = data.nome;
      perfil = PERFIS.find((p) => p.id === data.perfil)?.nome ?? data.perfil;
    }
  }

  return <Shell usuario={{ nome, email, perfil }}>{children}</Shell>;
}
