"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  atualizarIdentidadeLateral,
  feralAtivoAlterado,
  identidadeLateralVisivel,
  lerIdentidadeLateral,
} from "@/lib/feral-ativo";

function Foto({ src }: { src: string | null }) {
  const [falhou, setFalhou] = useState(false);
  return src && !falhou ? (
    <img alt="" src={src} onError={() => setFalhou(true)} />
  ) : (
    <span className="home-avatar-placeholder" aria-hidden="true">
      ◇
    </span>
  );
}

function observarIdentidade(mudou: () => void) {
  let timer: number | undefined;
  function atualizar() {
    window.clearTimeout(timer);
    mudou();
    const identidade = lerIdentidadeLateral();
    if (identidade?.nomeFicha !== undefined) {
      timer = window.setTimeout(
        atualizar,
        Math.max(1, identidade.expiraEm - Date.now()),
      );
    } else {
      atualizarIdentidadeLateral();
    }
  }

  atualizar();
  window.addEventListener(feralAtivoAlterado, atualizar);
  window.addEventListener("storage", atualizar);
  window.addEventListener("focus", atualizar);
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener(feralAtivoAlterado, atualizar);
    window.removeEventListener("storage", atualizar);
    window.removeEventListener("focus", atualizar);
  };
}

function identidadeInicial() {
  return null;
}

export default function SidebarIdentity({
  nomePadrao = "FERAL",
}: {
  nomePadrao?: string;
}) {
  const identidade = useSyncExternalStore(
    observarIdentidade,
    identidadeLateralVisivel,
    identidadeInicial,
  );
  const [nomeFicha, usuario, foto] = identidade
    ? (JSON.parse(identidade) as [string | null, string, string | null])
    : [null, "", null];
  const perfil = usuario ? `@${usuario.replace(/^@+/, "")}` : "";
  return (
    <div
      className="home-user"
      style={identidade === null ? { visibility: "hidden" } : undefined}
    >
      <Link
        className="home-avatar"
        href="/perfil"
        aria-label="Alterar imagem do Feral ativo"
      >
        <Foto key={foto} src={foto} />
      </Link>
      <strong title={nomeFicha ?? undefined}>{nomeFicha || nomePadrao}</strong>
      {perfil && <small title={perfil}>{perfil}</small>}
    </div>
  );
}
