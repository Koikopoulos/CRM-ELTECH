import { ShieldAlert } from "lucide-react";
import { Shell } from "@/components/Shell";
import { obterSessao } from "@/lib/sessao";
import { nomePerfil } from "@/lib/dominio";

export default async function LayoutCRM({ children }: { children: React.ReactNode }) {
  const { user, usuario } = await obterSessao();

  if (!usuario) {
    return (
      <main className="grid min-h-dvh place-items-center bg-nevoa px-4">
        <div className="max-w-md rounded-xl border border-linha bg-white p-8 text-center">
          <ShieldAlert className="mx-auto size-8 text-azul" />
          <h1 className="mt-4 text-lg font-semibold text-marinho">Seu acesso ainda não foi liberado</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-apagado">
            O login {user.email} não está ligado a um usuário ativo do CRM. Peça à Diretoria ou ao Admin para cadastrar
            este e-mail.
          </p>
          <form action="/auth/sair" method="post" className="mt-6">
            <button className="h-10 rounded-lg border border-linha px-4 text-sm font-medium text-marinho hover:bg-nevoa">
              Sair
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <Shell usuario={{ nome: usuario.nome, email: usuario.email ?? "", perfil: nomePerfil(usuario.perfil) }}>
      {children}
    </Shell>
  );
}
