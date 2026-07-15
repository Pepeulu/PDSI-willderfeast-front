"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    localStorage.removeItem("wilderfeast_user");
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <img
          src="/assets/title.png"
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
