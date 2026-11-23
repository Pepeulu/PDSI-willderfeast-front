"use client";

import DashboardShell from "@/components/DashboardShell";
import { GameError, useGameData } from "@/components/GameData";
import { request, type Atributos, type Grupo } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const grupos: Record<Grupo, string> = {
  estilos: "Estilos",
  habilidades: "Habilidades",
  tracos: "Traços",
  condicoes: "Condições",
};

function normalizarBusca(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function Editor({ id }: { id: string }) {
  const url = `/api/jogo/feral/${id}/atributos`;
  const { data, setData, error } = useGameData<Atributos>(url);
  const [grupo, setGrupo] = useState<Grupo>("estilos");
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [falha, setFalha] = useState<unknown>(null);
  const [mensagem, setMensagem] = useState("");
  if (error) return <GameError error={error} />;
  if (!data) return <p role="status">Carregando atributos…</p>;
  const temPontos = grupo === "estilos" || grupo === "habilidades";
  const atributos = data[grupo];
  const termo = normalizarBusca(busca);
  const visiveis = new Set(
    atributos
      .filter((a) =>
        normalizarBusca(`${a.nome} ${a.descricao ?? ""}`).includes(termo),
      )
      .map((a) => a.id),
  );

  async function salvar(atributos: Atributos, atributo: number, valor: number) {
    setSalvando(true);
    setFalha(null);
    setMensagem("");
    try {
      await request(url, {
        method: "PUT",
        body: JSON.stringify({ grupo, id: atributo, valor }),
      });
      setData({
        ...atributos,
        [grupo]: atributos[grupo].map((a) =>
          a.id === atributo ? { ...a, valor } : a,
        ),
      });
      setMensagem("Atributo salvo.");
    } catch (erro) {
      setFalha(erro);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <fieldset className="game-editor attributes-editor" disabled={salvando}>
      <div className="attributes-toolbar">
        <label className="game-controls attribute-group">
          Grupo
          <select
            value={grupo}
            onChange={(e) => {
              setGrupo(e.target.value as Grupo);
              setMensagem("");
              setFalha(null);
            }}
          >
            {Object.entries(grupos).map(([chave, nome]) => (
              <option key={chave} value={chave}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <label className="hub-search attributes-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Buscar atributos"
            placeholder="Buscar por nome ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
      </div>
      {falha ? <GameError error={falha} /> : null}
      {mensagem && <p role="status">{mensagem}</p>}
      {!atributos.length && <p>Nenhum atributo cadastrado neste grupo.</p>}
      {atributos.length > 0 && visiveis.size === 0 && (
        <p role="status">Nenhum atributo encontrado.</p>
      )}
      <div className="attributes-grid">
        {atributos.map((a) => (
          <form
            key={`${grupo}-${a.id}`}
            className="attribute-card"
            hidden={!visiveis.has(a.id)}
            data-active={!temPontos && a.valor === 1}
            onSubmit={(event) => {
              event.preventDefault();
              const campo = new FormData(event.currentTarget).get("valor");
              void salvar(data, a.id, Number(campo));
            }}
          >
            <h2>{a.nome}</h2>
            {a.descricao && <p>{a.descricao}</p>}
            <div className="game-controls attribute-card-actions">
              <label>
                {temPontos ? "Pontos" : "Estado"}
                {temPontos ? (
                  <input
                    aria-label={a.nome}
                    type="number"
                    name="valor"
                    min="0"
                    max="2147483647"
                    required
                    defaultValue={a.valor}
                  />
                ) : (
                  <select
                    aria-label={a.nome}
                    name="valor"
                    defaultValue={a.valor}
                  >
                    <option value={0}>Inativo</option>
                    <option value={1}>Ativo</option>
                  </select>
                )}
              </label>
              <button type="submit" aria-label={`Salvar ${a.nome}`}>
                Salvar
              </button>
            </div>
          </form>
        ))}
      </div>
    </fieldset>
  );
}

export default function AtributosDaFicha() {
  const { id } = useParams<{ id: string }>();
  return (
    <DashboardShell active="fichas" contentClassName="profile-content">
      <section className="hub-page attributes-page">
        <header className="hub-page-heading">
          <h1>Atributos do Feral</h1>
          <Link href={`/fichas/${id}`}>Voltar à ficha</Link>
        </header>
        <Editor key={id} id={id} />
      </section>
    </DashboardShell>
  );
}
