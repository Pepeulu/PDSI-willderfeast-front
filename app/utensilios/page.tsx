"use client";

import DashboardShell from "@/components/DashboardShell";
import ItensEncontrados from "@/components/ItensEncontrados";
import { ConsultarUtensilio } from "@/components/UtensilioPreview";
import {
  GameError,
  useCatalogoUtensilios,
  useGameData,
} from "@/components/GameData";
import { request, type Feral, type ItemInventario } from "@/lib/api";
import { correspondeABusca } from "@/lib/utensilios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

function BuscaUtensilio({
  valor,
  alterar,
}: {
  valor: string;
  alterar: (termo: string) => void;
}) {
  return (
    <label className="hub-search">
      <span aria-hidden="true">⌕</span>
      <input
        type="search"
        aria-label="Buscar utensílios"
        placeholder="Buscar utensílio por nome, estilo ou técnica..."
        value={valor}
        onChange={(e) => alterar(e.target.value)}
      />
    </label>
  );
}

function CabecalhoLista({
  titulo,
  quantidade,
  total,
}: {
  titulo: string;
  quantidade: number;
  total: number;
}) {
  return (
    <div className="equipped-utensil-heading">
      <p>{titulo}</p>
      <span aria-label={`${quantidade} de ${total} utensílios`}>
        {String(quantidade).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}

function Inventario({ feralId }: { feralId: number }) {
  const url = `/api/jogo/feral/${feralId}/inventario`;
  const { data: itens, setData, error } = useGameData<ItemInventario[]>(url);
  const [falha, setFalha] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  const filaEstilos = useRef(new Map<number, string>());
  const [estilosPendentes, setEstilosPendentes] = useState(
    () => new Map<number, string>(),
  );
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  if (error) return <GameError error={error} />;
  if (!itens) return <p role="status">Carregando inventário…</p>;
  const visiveis = itens.filter(({ utensilio, tecnicas }) =>
    correspondeABusca(utensilio, busca, tecnicas),
  );

  async function salvarDurabilidade(id: number, durabilidade_atual: number) {
    setOcupado(true);
    setFalha(null);
    setMensagem("");
    try {
      const salvo = await request<ItemInventario>(`${url}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ durabilidade_atual }),
      });
      setData(
        (atuais) =>
          atuais?.map((item) =>
            item.id === id
              ? {
                  ...item,
                  durabilidade_atual: salvo.durabilidade_atual,
                  se_quebrado: salvo.se_quebrado,
                }
              : item,
          ) ?? null,
      );
      setMensagem("Durabilidade salva.");
    } catch (erro) {
      setFalha(erro);
    } finally {
      setOcupado(false);
    }
  }

  async function escolherEstilo(id: number, estilo: string) {
    const fila = filaEstilos.current;
    const enviando = fila.has(id);
    fila.set(id, estilo);
    setEstilosPendentes(new Map(fila));
    setFalha(null);
    if (enviando) return;

    // A escolha mais recente aguarda a gravação em andamento.
    let escolha = estilo;
    for (;;) {
      try {
        const salvo = await request<ItemInventario>(`${url}/${id}/estilo`, {
          method: "PUT",
          body: JSON.stringify({ estilo_escolhido: escolha }),
        });
        setData(
          (atuais) =>
            atuais?.map((item) =>
              item.id === id
                ? { ...item, estilo_escolhido: salvo.estilo_escolhido }
                : item,
            ) ?? null,
        );
      } catch (erro) {
        if (fila.get(id) === escolha) setFalha(erro);
      }
      const proxima = fila.get(id);
      if (!proxima || proxima === escolha) break;
      escolha = proxima;
    }
    fila.delete(id);
    setEstilosPendentes(new Map(fila));
  }

  return (
    <fieldset className="game-editor equipped-utensil-section">
      <BuscaUtensilio valor={busca} alterar={setBusca} />
      <CabecalhoLista
        titulo="Utensílio equipado"
        quantidade={visiveis.length}
        total={itens.length}
      />
      {falha ? <GameError error={falha} /> : null}
      {mensagem && <p role="status">{mensagem}</p>}
      {!visiveis.length && (
        <p>
          {itens.length
            ? "Nenhum utensílio encontrado."
            : "Este Feral ainda não possui utensílios."}
        </p>
      )}
      {visiveis.map((item) => (
        <ConsultarUtensilio
          key={item.id}
          utensilio={item.utensilio}
          item={
            estilosPendentes.has(item.id)
              ? { ...item, estilo_escolhido: estilosPendentes.get(item.id) }
              : item
          }
          onEscolherEstilo={(estilo) => void escolherEstilo(item.id, estilo)}
        >
          <details className="managed-utensil-adjustment">
            <summary>Ajustar durabilidade</summary>
            <form
              className="game-controls"
              onSubmit={(event) => {
                event.preventDefault();
                const durabilidade_atual = Number(
                  new FormData(event.currentTarget).get("durabilidade"),
                );
                if (!ocupado)
                  void salvarDurabilidade(item.id, durabilidade_atual);
              }}
            >
              <label>
                Durabilidade atual
                <input
                  name="durabilidade"
                  type="number"
                  min={0}
                  max={item.utensilio.durabilidade_max}
                  defaultValue={item.durabilidade_atual}
                  disabled={ocupado}
                  required
                />
              </label>
              <button disabled={ocupado}>Salvar durabilidade</button>
            </form>
          </details>
        </ConsultarUtensilio>
      ))}
    </fieldset>
  );
}

function Catalogo() {
  const catalogo = useCatalogoUtensilios();
  const [busca, setBusca] = useState("");
  const itens = catalogo.data ?? [];
  const visiveis = itens
    .filter((utensilio) => correspondeABusca(utensilio, busca))
    .sort((a, b) => a.id - b.id);
  return (
    <section
      className="equipped-utensil-section utensil-catalog"
      aria-label="Catálogo de utensílios"
    >
      <BuscaUtensilio valor={busca} alterar={setBusca} />
      {catalogo.error ? (
        <GameError error={catalogo.error} />
      ) : !catalogo.data ? (
        <p role="status">Carregando catálogo…</p>
      ) : (
        <>
          <CabecalhoLista
            titulo="Catálogo de utensílios"
            quantidade={visiveis.length}
            total={itens.length}
          />
          {visiveis.length ? (
            <div className="managed-utensil-list">
              {visiveis.map((utensilio) => (
                <ConsultarUtensilio key={utensilio.id} utensilio={utensilio} />
              ))}
            </div>
          ) : (
            <p>
              {itens.length
                ? "Nenhum utensílio encontrado."
                : "Nenhum utensílio cadastrado."}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function InventarioDaFicha({ feralId }: { feralId: number }) {
  const { data: ferais, error } = useGameData<Feral[]>(
    "/api/session?resource=ferais",
  );
  return (
    <section aria-label="Inventário do Feral">
      {error ? (
        <GameError error={error} />
      ) : !ferais ? (
        <p role="status">Carregando fichas…</p>
      ) : ferais.some((feral) => feral.id === feralId) ? (
        <>
          <div className="profile-selector-row inventory-sheet-link">
            <Link href={`/fichas/${feralId}`}>Ver ficha</Link>
          </div>
          <ItensEncontrados feralId={feralId} />
          <Inventario feralId={feralId} />
        </>
      ) : ferais.length ? (
        <p className="tool-empty">
          Ficha não encontrada. <Link href="/fichas">Ver minhas fichas</Link>
        </p>
      ) : (
        <p className="tool-empty">
          Você ainda não possui um Feral.{" "}
          <Link href="/fichas/novo">Criar ficha</Link>
        </p>
      )}
    </section>
  );
}

function ConteudoUtensilios() {
  const feralId = Number(useSearchParams().get("feral"));
  const verInventario = Number.isSafeInteger(feralId) && feralId > 0;
  return (
    <DashboardShell active="utensilios" contentClassName="utensils-content">
      <section className="hub-page utensils-management-page">
        <header className="hub-page-heading">
          <h1>
            {verInventario ? "Inventário do Feral" : "Gestão de Utensílios"}
          </h1>
        </header>
        {verInventario ? (
          <InventarioDaFicha key={feralId} feralId={feralId} />
        ) : (
          <Catalogo />
        )}
      </section>
    </DashboardShell>
  );
}

export default function Utensilios() {
  return (
    <Suspense fallback={<p role="status">Carregando utensílios…</p>}>
      <ConteudoUtensilios />
    </Suspense>
  );
}
