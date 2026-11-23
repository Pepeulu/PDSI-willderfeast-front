"use client";

import imagensCloudinary from "@/lib/imagens-cloudinary.json";
import { useId, useState, type ReactNode } from "react";
import type { ItemInventario, Utensilio } from "@/lib/api";
import { alcanceAtual, estilosIniciais } from "@/lib/utensilios";

const ilustracoes = new Map([
  [
    "Barbante",
    { src: imagensCloudinary.utensilios.barbante, width: 444, height: 760 },
  ],
  [
    "Cutelo",
    { src: imagensCloudinary.utensilios.cutelo, width: 596, height: 832 },
  ],
  [
    "Espeto",
    { src: imagensCloudinary.utensilios.espeto, width: 265, height: 373 },
  ],
  [
    "Luvas",
    { src: imagensCloudinary.utensilios.luvas, width: 272, height: 381 },
  ],
  [
    "Maçarico",
    { src: imagensCloudinary.utensilios.macarico, width: 562, height: 791 },
  ],
  [
    "Panela",
    { src: imagensCloudinary.utensilios.panela, width: 258, height: 364 },
  ],
]);

function IlustracaoUtensilio({
  utensilio: { nome, imagem_url },
  miniatura = false,
}: {
  utensilio: Pick<Utensilio, "nome" | "imagem_url">;
  miniatura?: boolean;
}) {
  const arquivo = ilustracoes.get(nome);
  const imagem = imagem_url?.trim() || arquivo?.src;
  if (!imagem)
    return miniatura ? null : (
      <span className="tool-art-missing">Sem ilustração</span>
    );
  return (
    <img
      className="tool-art"
      alt={miniatura ? "" : `Ilustração de ${nome}`}
      src={imagem}
      width={arquivo?.src === imagem ? arquivo.width : undefined}
      height={arquivo?.src === imagem ? arquivo.height : undefined}
    />
  );
}

function Previa({
  utensilio,
  item,
}: {
  utensilio: Utensilio;
  item?: ItemInventario;
}) {
  const durabilidade = item?.durabilidade_atual ?? utensilio.durabilidade_max;
  const tecnicas = utensilio.tecnicas.concat(item?.tecnicas ?? []);
  return (
    <div
      className="tool-preview"
      role="region"
      aria-label={`Prévia de ${utensilio.nome}`}
    >
      <div className="tool-plate">
        <IlustracaoUtensilio utensilio={utensilio} />
      </div>
      <div className="tool-facts">
        <strong className="tool-name">{utensilio.nome}</strong>
        <dl>
          <div>
            <dt>Durabilidade</dt>
            <dd>
              {durabilidade} / {utensilio.durabilidade_max}
            </dd>
          </div>
          <div>
            <dt>Alcance</dt>
            <dd>{alcanceAtual(utensilio, item) || "Não informado"}</dd>
          </div>
          {utensilio.estilos_principais && (
            <div className="tool-starting-styles">
              <dt>Estilos iniciais do Feral</dt>
              <dd>
                {estilosIniciais(
                  utensilio.estilos_principais,
                  item?.estilo_escolhido,
                )}
              </dd>
            </div>
          )}
          {item && (
            <div>
              <dt>Estado</dt>
              <dd>
                {(item.se_quebrado ?? durabilidade === 0)
                  ? "Quebrado"
                  : "Em uso"}
              </dd>
            </div>
          )}
        </dl>
        {tecnicas.length > 0 && (
          <div className="tool-techniques">
            <strong>Técnicas</strong>
            <ul>
              {tecnicas.map((t, i) => (
                <li key={i}>
                  <b>{t.nome}</b>
                  {t.descricao && ` · ${t.descricao}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function EscolhaUtensilio({
  catalogo,
  escolha,
  onChange,
  disabled,
}: {
  catalogo: Utensilio[];
  escolha: string;
  onChange: (id: string) => void;
  disabled: boolean;
}) {
  const selecionado = catalogo.find((u) => String(u.id) === escolha);
  return (
    <fieldset className="tool-selector feral-field-wide" disabled={disabled}>
      <legend>Utensílio inicial *</legend>
      <div className="tool-options">
        {catalogo.map((u) => (
          <label className="tool-option" key={u.id}>
            <IlustracaoUtensilio utensilio={u} miniatura />
            <span>{u.nome}</span>
            <input
              type="radio"
              name="utensilio-inicial"
              value={u.id}
              required
              checked={escolha === String(u.id)}
              onChange={(e) => onChange(e.target.value)}
            />
          </label>
        ))}
      </div>
      {selecionado && <Previa utensilio={selecionado} />}
    </fieldset>
  );
}

export function ConsultarUtensilio({
  utensilio,
  item,
  children,
  onEscolherEstilo,
  heading: Heading = "h2",
  resumo = false,
}: {
  utensilio: Utensilio;
  item?: ItemInventario;
  children?: ReactNode;
  onEscolherEstilo?: (estilo: string) => void;
  heading?: "h2" | "h3";
  resumo?: boolean;
}) {
  const id = useId();
  const [aberta, setAberta] = useState(false);
  const alcance = alcanceAtual(utensilio, item);
  const atual = item?.durabilidade_atual ?? utensilio.durabilidade_max;
  const maximo = utensilio.durabilidade_max;
  const percentual =
    maximo > 0 ? Math.max(0, Math.min(100, (100 * atual) / maximo)) : 0;
  const tecnicas = utensilio.tecnicas.concat(item?.tecnicas ?? []);
  const escolha = item?.estilo_escolhido;
  return (
    <article
      className="managed-utensil-card"
      onKeyDown={(e) => {
        if (e.key === "Escape") setAberta(false);
      }}
    >
      <div className="managed-utensil-image">
        <span className="managed-utensil-label">
          {item ? "Equipado" : "Catálogo"}
        </span>
        <IlustracaoUtensilio utensilio={utensilio} />
        <div className="managed-utensil-preview" id={id} hidden={!aberta}>
          {aberta && <Previa utensilio={utensilio} item={item} />}
        </div>
      </div>
      <div className="managed-utensil-copy">
        <small>Utensílio de caça</small>
        <Heading className="managed-utensil-title">
          <button
            type="button"
            className="tool-trigger"
            aria-expanded={aberta}
            aria-controls={id}
            aria-label={utensilio.nome}
            onClick={() => setAberta((valor) => !valor)}
          >
            <i aria-hidden="true" />
            {utensilio.nome}
            <i aria-hidden="true" />
          </button>
        </Heading>
        <div className="managed-utensil-stats">
          {alcance && <strong>Alcance · {alcance}</strong>}
          {tecnicas.map((tecnica, i) => (
            <span key={i}>{tecnica.nome}</span>
          ))}
          {utensilio.estilos_principais && (
            <div
              className="managed-utensil-styles"
              role="group"
              aria-label={
                onEscolherEstilo ? "Estilo de 3 pontos" : "Estilos principais"
              }
            >
              {onEscolherEstilo && (
                <small className="managed-utensil-style-prompt">
                  Escolha o estilo de 3 pontos
                </small>
              )}
              {utensilio.estilos_principais.map((estilo) => {
                const selecionado = estilo === escolha;
                const pontos = escolha ? (selecionado ? "3" : "2") : "2 ou 3";
                return onEscolherEstilo ? (
                  <button
                    key={estilo}
                    className="managed-utensil-style-option"
                    type="button"
                    aria-pressed={selecionado}
                    onClick={() => {
                      if (!selecionado) onEscolherEstilo(estilo);
                    }}
                  >
                    {estilo} · {pontos}
                  </button>
                ) : (
                  <strong key={estilo}>
                    {estilo} · {pontos}
                  </strong>
                );
              })}
            </div>
          )}
        </div>
        {!resumo && (
          <div className="managed-utensil-durability">
            <div>
              <b>Durabilidade</b>
              <strong>
                {atual} / {maximo}
              </strong>
            </div>
            <span aria-hidden="true">
              <i style={{ width: `${percentual}%` }} />
            </span>
          </div>
        )}
        {item?.se_quebrado && <p>Quebrado</p>}
        {!resumo && utensilio.estilos_principais && (
          <p>
            <b>Estilos iniciais do Feral.</b>{" "}
            {estilosIniciais(utensilio.estilos_principais, escolha)}
          </p>
        )}
        {!resumo && utensilio.estilos_principais && (
          <p>
            Se quebrado, volta ao alcance de 1 pernada para Golpe e causa metade
            do dano.
          </p>
        )}
        {children}
      </div>
    </article>
  );
}
