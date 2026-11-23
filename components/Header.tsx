"use client";

/**
 * Cabeçalho com atalhos de navegação e saída da sessão.
 * @module
 */

import imagensCloudinary from "@/lib/imagens-cloudinary.json";
import { limparSessaoLocal } from "@/lib/feral-ativo";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Exibe a marca e os links rápidos para as fichas e o bestiário. */
export default function Header() {
  const router = useRouter();

  /** Encerra a sessão, apaga a identidade local e volta ao login. */
  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    limparSessaoLocal();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <img
          src={imagensCloudinary.interface.title}
          alt="Wilderfeast — Você é o que você come"
        />
      </Link>
      <nav>
        <Link href="/fichas">Fichas</Link>
        <Link href="/bestiario">Bestiário</Link>
        <button className="logout-button" onClick={logout} type="button">
          Sair
        </button>
      </nav>
    </header>
  );
}
