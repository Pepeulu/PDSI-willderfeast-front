/**
 * Inventário local com um utensílio de exemplo enquanto a API não oferece a rota.
 * @module app/utensilios
 */
"use client";

import DashboardShell from "@/components/DashboardShell";
import { useState } from "react";

/** Mostra o utensílio equipado quando corresponde ao termo de busca. */
export default function Utensilios() {
  const [query, setQuery] = useState("");
  /** Correspondência por nome, estilo ou propriedade do item equipado. */
  const matches = "cutelo de ferro cortante potente preciso".includes(
    query.trim().toLocaleLowerCase("pt-BR"),
  );

  return (
    <DashboardShell active="utensilios" contentClassName="utensils-content">
      <section className="hub-page utensils-management-page">
        <header className="hub-page-heading">
          <div>
            <p>INVENTÁRIO DO FERAL</p>
            <h1>Gestão de Utensílios</h1>
          </div>
          <span>ORGANIZADA</span>
        </header>

        <label className="hub-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Buscar utensílios"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar utensílio por nome, estilo ou propriedade..."
            type="search"
            value={query}
          />
        </label>

        <section className="equipped-utensil-section">
          <div className="equipped-utensil-heading">
            <p>UTENSÍLIO EQUIPADO</p>
            <span>01 / 01</span>
          </div>

          {matches ? (
            <article className="managed-utensil-card">
              <div className="managed-utensil-image">
                <span aria-hidden="true">EQUIPADO</span>
                <img alt="Cutelo de ferro" src="/assets/cleaver.png" />
              </div>
              <div className="managed-utensil-copy">
                <small>UTENSÍLIO DE CAÇA</small>
                <h2>
                  <i aria-hidden="true" />
                  CUTELO DE FERRO
                  <i aria-hidden="true" />
                </h2>
                <div className="managed-utensil-stats">
                  <strong>3 POTENTE</strong>
                  <strong>2 PRECISO</strong>
                  <span>⚔ CORTANTE</span>
                </div>
                <div className="managed-utensil-durability">
                  <div>
                    <b>DURABILIDADE</b>
                    <strong>4 / 5</strong>
                  </div>
                  <span>
                    <i />
                  </span>
                </div>
                <p>
                  Ferramenta pesada e confiável, adequada para cortes precisos
                  durante a caça e o preparo do banquete.
                </p>
              </div>
            </article>
          ) : (
            <div className="hub-empty-state">
              <span aria-hidden="true">✦</span>
              <h2>Nenhum utensílio encontrado</h2>
              <p>Tente buscar por “cutelo”, “potente” ou “cortante”.</p>
            </div>
          )}
        </section>
      </section>
    </DashboardShell>
  );
}
