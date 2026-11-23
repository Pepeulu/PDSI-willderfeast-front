"use client";

import { useId, useState, type FormEvent } from "react";
import { GameError, useGameData } from "@/components/GameData";
import { request } from "@/lib/api";

type ItemEncontrado = {
  id: number;
  nome: string;
  quantidade: number;
  descricao: string | null;
};

type DadosItem = Omit<ItemEncontrado, "id">;
const quantidadeMaxima = 2_147_483_647;

function FormularioItem({
  item,
  desabilitado,
  onSalvar,
  onCancelar,
}: {
  item?: ItemEncontrado;
  desabilitado: boolean;
  onSalvar: (dados: DadosItem) => Promise<void>;
  onCancelar: () => void;
}) {
  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const campos = new FormData(event.currentTarget);
    void onSalvar({
      nome: String(campos.get("nome")).trim(),
      quantidade: Number(campos.get("quantidade")),
      descricao: String(campos.get("descricao")).trim() || null,
    });
  }

  return (
    <form
      aria-label={item ? `Editar ${item.nome}` : "Adicionar item encontrado"}
      onSubmit={enviar}
    >
      <fieldset
        className="game-controls found-item-form"
        disabled={desabilitado}
      >
        <label>
          Nome do item
          <input
            name="nome"
            required
            maxLength={100}
            pattern={".*\\S.*"}
            defaultValue={item?.nome}
          />
        </label>
        <label>
          Quantidade
          <input
            name="quantidade"
            type="number"
            defaultValue={item?.quantidade ?? 1}
            min={item ? 0 : 1}
            max={quantidadeMaxima}
            step={1}
            required
          />
        </label>
        <label className="found-item-description">
          Descrição (opcional)
          <textarea
            name="descricao"
            rows={2}
            maxLength={1000}
            defaultValue={item?.descricao ?? ""}
          />
        </label>
        <div className="found-item-buttons">
          <button type="submit" className="found-item-action">
            {item ? "Salvar alterações" : "Salvar item"}
          </button>
          <button type="button" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </fieldset>
    </form>
  );
}

export default function ItensEncontrados({ feralId }: { feralId: number }) {
  const tituloId = useId();
  const url = `/api/jogo/feral/${feralId}/itens-encontrados`;
  const {
    data: itens,
    setData,
    error,
    retry,
  } = useGameData<ItemEncontrado[]>(url);
  const [salvando, setSalvando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [falha, setFalha] = useState<unknown>(null);
  const [mensagem, setMensagem] = useState("");

  async function salvar(
    method: "POST" | "PUT" | "PATCH",
    dados: DadosItem | { variacao: -1 | 1 },
    id?: number,
  ) {
    if (salvando || !itens) return;
    setSalvando(true);
    setFalha(null);
    setMensagem("");
    try {
      const salvo = await request<ItemEncontrado | null>(
        id === undefined ? url : `${url}/${id}`,
        {
          method,
          body: JSON.stringify(dados),
        },
      );
      setData((lista) => {
        const atuais = lista ?? [];
        if (!salvo) return atuais.filter((item) => item.id !== id);
        return method === "POST"
          ? [...atuais, salvo]
          : atuais.map((item) => (item.id === salvo.id ? salvo : item));
      });
      if (method === "PUT") setEditando(null);
      if (method === "POST") setAdicionando(false);
      const acao =
        method === "POST" ? "adicionado ao inventário" : "atualizado";
      setMensagem(
        salvo ? `${salvo.nome} foi ${acao}.` : "Item removido do inventário.",
      );
    } catch (erro) {
      setFalha(erro);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="game-item found-items" aria-labelledby={tituloId}>
      <h2 id={tituloId}>Itens encontrados</h2>
      {error ? (
        <>
          <GameError error={error} />
          <button type="button" className="found-item-action" onClick={retry}>
            Tentar novamente
          </button>
        </>
      ) : !itens ? (
        <p role="status">Carregando itens encontrados…</p>
      ) : (
        <>
          {itens.length ? (
            <ul className="found-item-list">
              {itens.map((item) => (
                <li key={item.id}>
                  <strong>{item.nome}</strong>
                  {editando === item.id ? (
                    <FormularioItem
                      item={item}
                      desabilitado={salvando}
                      onSalvar={(dados) => salvar("PUT", dados, item.id)}
                      onCancelar={() => setEditando(null)}
                    />
                  ) : (
                    <>
                      <div className="found-item-buttons">
                        <button
                          type="button"
                          aria-label={
                            item.quantidade === 1
                              ? `Remover ${item.nome} do inventário`
                              : `Diminuir quantidade de ${item.nome}`
                          }
                          disabled={salvando}
                          onClick={() =>
                            void salvar("PATCH", { variacao: -1 }, item.id)
                          }
                        >
                          −
                        </button>
                        <span aria-label={`Quantidade: ${item.quantidade}`}>
                          ×{item.quantidade}
                        </span>
                        <button
                          type="button"
                          aria-label={`Aumentar quantidade de ${item.nome}`}
                          disabled={
                            salvando || item.quantidade >= quantidadeMaxima
                          }
                          onClick={() =>
                            void salvar("PATCH", { variacao: 1 }, item.id)
                          }
                        >
                          +
                        </button>
                        <button
                          type="button"
                          aria-label={`Editar ${item.nome}`}
                          disabled={salvando}
                          onClick={() => setEditando(item.id)}
                        >
                          Editar
                        </button>
                      </div>
                      {item.descricao && <p>{item.descricao}</p>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="found-items-empty">Nenhum item no inventário.</p>
          )}
          {adicionando ? (
            <FormularioItem
              desabilitado={salvando}
              onSalvar={(dados) => salvar("POST", dados)}
              onCancelar={() => {
                setAdicionando(false);
                setFalha(null);
              }}
            />
          ) : (
            <button
              type="button"
              className="found-item-action"
              disabled={salvando}
              onClick={() => {
                setAdicionando(true);
                setFalha(null);
                setMensagem("");
              }}
            >
              Adicionar item
            </button>
          )}
          {falha ? <GameError error={falha} /> : null}
          {mensagem && <p role="status">{mensagem}</p>}
        </>
      )}
    </section>
  );
}
