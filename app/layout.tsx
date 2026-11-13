/**
 * Documento base e estilos globais compartilhados pelas rotas do App Router.
 * @module app/layout
 */
import type { Metadata } from "next";
import "./globals.css";

/** Título e descrição padrão usados pelo Next.js para montar o cabeçalho. */
export const metadata: Metadata = {
  title: "Wilderfeast",
  description: "Aventure-se, cace e festeje.",
};

/** Envolve o conteúdo da rota no documento HTML em português brasileiro. */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
