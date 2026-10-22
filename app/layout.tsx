import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CRM Eltech", template: "%s · CRM Eltech" },
  description: "Gestão comercial e marketing da Eltech Química",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
