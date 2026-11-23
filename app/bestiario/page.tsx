/**
 * Catálogo de monstros da API com pesquisa pelos atributos disponíveis.
 * @module app/bestiario
 */
"use client";

import DashboardShell from "@/components/DashboardShell";
import { getApiErrorMessage, getMonstros, Monstro } from "@/lib/api";
import { MonsterApiCard, MonsterSkeleton } from "@/components/MonsterApiCard";
import { useEffect, useMemo, useState } from "react";

/** Consulta o catálogo e apresenta os registros que correspondem à busca. */
export default function Bestiario() {
  const [monsters, setMonsters] = useState<Monstro[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getMonstros()
      .then((data) => {
        if (active) setMonsters(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            getApiErrorMessage(
              requestError,
              "Não foi possível carregar o bestiário.",
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
  }, []);

  /** Permite buscar por nome, categoria, habitat ou dieta sem distinguir maiúsculas. */
  const visibleMonsters = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return monsters;
    return monsters.filter((monster) =>
      [monster.nome, monster.categoria, monster.habitat, monster.dieta]
        .filter(Boolean)
        .some((value) =>
          value!.toLocaleLowerCase("pt-BR").includes(normalized),
        ),
    );
  }, [monsters, query]);

  return (
    <DashboardShell active="bestiario" contentClassName="bestiary-content">
      <section className="hub-page bestiary-page">
        <header className="hub-page-heading">
          <div>
            <p>ARQUIVO DE FERAS</p>
            <h1>Bestiário</h1>
          </div>
          <span>
            {loading ? "—" : String(monsters.length).padStart(2, "0")} REGISTROS
          </span>
        </header>

        <label className="hub-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Buscar no bestiário"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, categoria, habitat ou dieta..."
            type="search"
            value={query}
          />
        </label>

        {error && (
          <p className="hub-feedback error" role="alert">
            {error}
          </p>
        )}

        <div className="bestiary-api-grid">
          {loading
            ? Array.from({ length: 6 }, (_, index) => (
                <MonsterSkeleton key={index} />
              ))
            : visibleMonsters.map((monster) => (
                <MonsterApiCard key={monster.id} monster={monster} />
              ))}
        </div>

        {!loading && !error && visibleMonsters.length === 0 && (
          <div className="hub-empty-state">
            <span aria-hidden="true">✦</span>
            <h2>
              {monsters.length ? "Nenhuma fera encontrada" : "Bestiário vazio"}
            </h2>
            <p>
              {monsters.length
                ? "Tente buscar usando outro nome ou característica."
                : "Os monstros aparecerão aqui quando forem cadastrados na API."}
            </p>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
