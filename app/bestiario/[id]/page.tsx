"use client";

import DashboardShell from "@/components/DashboardShell";
import { getApiErrorMessage, getMonstro, Monstro } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function BeastInformation({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="beast-information-row">
      <span>{label}</span>
      <p>{value || "Não informado pela API."}</p>
    </div>
  );
}

export default function BeastSheet() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [monster, setMonster] = useState<Monstro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
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
            getApiErrorMessage(requestError, "Não foi possível carregar o monstro."),
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
            <span /><span /><span />
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
              <div className="beast-api-image" aria-label={`Ilustração de ${monster.nome}`} role="img" />
              <div className="beast-api-heading">
                <p>REGISTRO DE FERA · #{String(monster.id).padStart(3, "0")}</p>
                <h1>{monster.nome}</h1>
                <span>{monster.categoria}</span>
                <div className="beast-api-vigor">
                  <div><b>VIGOR ATUAL</b><strong>{monster.vigor_atual} / {monster.vigor_base}</strong></div>
                  <span><i style={{ width: `${Math.max(0, Math.min(100, (monster.vigor_atual / monster.vigor_base) * 100))}%` }} /></span>
                </div>
                <Link href="/bestiario">← VOLTAR AO BESTIÁRIO</Link>
              </div>
            </div>

            <div className="profile-section-title"><span>01</span><h2>Comportamento</h2></div>
            <div className="beast-information-list">
              <BeastInformation label="História" value={monster.historia} />
              <BeastInformation label="Alvos" value={monster.alvos} />
              <BeastInformation label="Dieta" value={monster.dieta} />
              <BeastInformation label="Habitat" value={monster.habitat} />
            </div>

            <div className="beast-api-footnote">
              <span aria-hidden="true">◇</span>
              <p>
                Partes, condições e técnicas não fazem parte da resposta atual do
                endpoint de monstros e, por isso, não são exibidas com dados fictícios.
              </p>
            </div>
          </>
        ) : null}
      </section>
    </DashboardShell>
  );
}
