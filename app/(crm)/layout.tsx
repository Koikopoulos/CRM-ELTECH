import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { devBypass } from "@/lib/supabase/env";

export default async function LayoutCRM({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !devBypass) redirect("/login");

  const email = user?.email ?? "visualizacao@eltech.local";
  const nome =
    (user?.user_metadata?.nome as string | undefined) ??
    (user ? email.split("@")[0].replace(/[._]/g, " ") : "Modo de visualização");

  // O perfil de acesso vem da tabela de usuários a partir da Etapa 2.
  const perfil = user ? "Perfil a definir" : "Somente desenvolvimento";

  return <Shell usuario={{ nome, email, perfil }}>{children}</Shell>;
}
