/**
 * Rota de detalhes de um registro do bestiário.
 * @module app/bestiario/[id]
 */
"use client";

import DashboardShell from "@/components/DashboardShell";
import BeastIllustration from "@/components/BeastIllustration";
import { getApiErrorMessage, getMonstro, MonstroDetalhado } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function percentual(atual: number, maximo: number) {
  return maximo > 0 ? Math.max(0, Math.min(100, (atual / maximo) * 100)) : 0;
}

/** Apresenta um atributo e informa quando a API deixou o campo vazio. */
function BeastInformation({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="beast-information-row">
      <span>{label}</span>
      <p>{value || "Não informado pela API."}</p>
    </div>
  );
}

/** Consulta o monstro pelo identificador da rota e apresenta seu vigor e comportamento. */
export default function BeastSheet() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [monster, setMonster] = useState<MonstroDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setMonster(null);
    if (!Number.isInteger(id) || id < 1) {
      setError("O identificador desse monstro é inválido.");
      setLoading(false);
      return;
    }

    getMonstro(id)
      .then((data) => {
        if (active) setMonster(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            getApiErrorMessage(
              requestError,
              "Não foi possível carregar o monstro.",
            ),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <DashboardShell active="bestiario" contentClassName="beast-detail-content">
      <section className="hub-page beast-api-sheet">
        <header className="profile-brand-heading">
          <span aria-hidden="true">✦</span>
          <b>WILDERFEAST · BESTIÁRIO</b>
          <i />
        </header>

        {loading ? (
          <div className="profile-loading" aria-label="Carregando monstro">
            <span />
            <span />
            <span />
          </div>
        ) : error ? (
          <div className="hub-empty-state api-sheet-error">
            <span aria-hidden="true">!</span>
            <h2>Registro indisponível</h2>
            <p>{error}</p>
            <Link href="/bestiario">VOLTAR AO BESTIÁRIO</Link>
          </div>
        ) : monster ? (
          <>
            <div className="beast-api-hero">
              <div className="beast-api-image">
                <BeastIllustration
                  nome={monster.nome}
                  imagemUrl={monster.imagem_url}
                  destaque
                />
              </div>
              <div className="beast-api-heading">
                <p>REGISTRO DE FERA · #{String(monster.id).padStart(3, "0")}</p>
                <h1>{monster.nome}</h1>
                <span>{monster.categoria}</span>
                <div className="beast-api-vigor">
                  <div>
                    <b>VIGOR ATUAL</b>
                    <strong>
                      {monster.vigor_atual} / {monster.vigor_base}
                    </strong>
                  </div>
                  <span>
                    <i
                      style={{
                        width: `${percentual(monster.vigor_atual, monster.vigor_base)}%`,
                      }}
                    />
                  </span>
                </div>
                <Link href="/bestiario">← VOLTAR AO BESTIÁRIO</Link>
              </div>
            </div>

            <div className="profile-section-title">
              <span>01</span>
              <h2>Comportamento</h2>
            </div>
            <div className="beast-information-list">
              <BeastInformation label="História" value={monster.historia} />
              <BeastInformation
                label="Comportamento de caça"
                value={monster.comportamento ?? monster.alvos}
              />
              <BeastInformation label="Dieta" value={monster.dieta} />
              <BeastInformation label="Habitat" value={monster.habitat} />
            </div>

            <div className="beast-stat-groups">
              {(
                [
                  ["Estilos", monster.estilos],
                  ["Habilidades", monster.habilidades],
                ] as const
              ).map(([titulo, pontos]) =>
                pontos?.length ? (
                  <section key={titulo} className="beast-detail-panel">
                    <h2>{titulo}</h2>
                    <dl className="beast-stat-grid">
                      {pontos.map((p) => (
                        <div key={p.nome}>
                          <dt>{p.nome}</dt>
                          <dd>{p.pontos ?? 0}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ) : null,
              )}
            </div>
            {monster.tracos?.length ? (
              <section className="beast-detail-panel">
                <h2>Traços</h2>
                <dl className="beast-trait-grid">
                  {monster.tracos.map((t) => (
                    <div key={t.id} className="beast-detail-card">
                      <dt>{t.nome}</dt>
                      <dd>{t.descricao}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
            {monster.partes?.length ? (
              <section className="beast-detail-panel">
                <h2>Partes e técnicas</h2>
                <div className="beast-parts">
                  {monster.partes.map((p) => (
                    <article
                      key={p.id}
                      className="beast-detail-card beast-part-card"
                    >
                      <h3>{p.nome}</h3>
                      <div className="beast-part-durability">
                        <p>
                          <span>Durabilidade</span>
                          <strong>
                            {p.durabilidade_atual} / {p.durabilidade_max}
                          </strong>
                        </p>
                        <div className="bestiary-vigor" aria-hidden="true">
                          <i
                            style={{
                              width: `${percentual(p.durabilidade_atual, p.durabilidade_max)}%`,
                            }}
                          />
                        </div>
                      </div>
                      {p.alcance && (
                        <p className="beast-part-range">
                          <strong>Alcance</strong> · {p.alcance}
                        </p>
                      )}
                      <div className="beast-part-technique">
                        <h4>Técnica · {p.tecnica.nome}</h4>
                        <p>{p.tecnica.descricao}</p>
                      </div>
                      {p.se_quebrado && (
                        <div className="beast-part-broken">
                          <h4>Se quebrada</h4>
                          <p>{p.se_quebrado}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </section>
    </DashboardShell>
  );
}
