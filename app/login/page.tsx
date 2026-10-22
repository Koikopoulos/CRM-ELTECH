import type { Metadata } from "next";
import { Suspense } from "react";
import { Orbitas } from "@/components/Orbitas";
import { FormLogin } from "./FormLogin";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaLogin() {
  return (
    <main className="relative grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ceu text-marinho lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Orbitas className="pointer-events-none absolute -right-40 top-1/2 w-[760px] -translate-y-1/2 text-azul/20" />
        <p className="relative text-[15px] font-semibold text-marinho">Eltech Química</p>
        <div className="relative max-w-md">
          <h1 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.01em]">
            Clientes, propostas e preços no mesmo lugar.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-apagado">
            O CRM comercial da Eltech: acompanhe cada proposta do primeiro contato ao fechamento.
          </p>
        </div>
        <p className="relative text-sm text-apagado">A química certa para sua construção</p>
      </section>

      <section className="flex items-center justify-center bg-white px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/eltech-logo.png" alt="Eltech Química" width={480} height={457} className="mb-8 h-28 w-auto" />
          <h2 className="text-2xl font-semibold text-marinho">Entrar no CRM</h2>
          <p className="mt-1.5 text-[15px] text-apagado">Use o e-mail cadastrado pela Eltech.</p>
          <Suspense>
            <FormLogin />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
