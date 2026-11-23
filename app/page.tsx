/**
 * Painel inicial e listagem de fichas que compartilham a mesma navegação.
 * @module app
 */
"use client";

import Link from "next/link";
import SidebarIdentity from "@/components/SidebarIdentity";
import { MonsterApiCard, MonsterSkeleton } from "@/components/MonsterApiCard";
import { useCatalogoUtensilios } from "@/components/GameData";
import { ConsultarUtensilio } from "@/components/UtensilioPreview";
import imagensCloudinary from "@/lib/imagens-cloudinary.json";
import { limparSessaoLocal, urlImagemFeral } from "@/lib/feral-ativo";
import { useSidebar } from "@/lib/useSidebar";
import {
  ApiError,
  Feral,
  getApiErrorMessage,
  getMonstros,
  getMyFerais,
  Monstro,
} from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const icons = imagensCloudinary.iconesPainel;

/** Dados de exibição compartilhados pelos cartões de bestas e de personagens. */
type MonsterCardProps = {
  harvest: string;
  harvestLabel: string;
  harvestIcon: string;
  href: string;
  image: string;
  imageClassName: string;
  name: string;
  tags: Array<{ icon: string; label: string }>;
  threat: string;
  threatLevel: "low" | "high";
  weakness: string;
  weaknessLabel: string;
  weaknessIcon: string;
};

/** Renderiza a ilustração, as etiquetas e os atributos do registro recebido. */
function MonsterCard({
  harvest,
  harvestLabel,
  harvestIcon,
  href,
  image,
  imageClassName,
  name,
  tags,
  threat,
  threatLevel,
  weakness,
  weaknessLabel,
  weaknessIcon,
}: MonsterCardProps) {
  return (
    <Link href={href} className="home-monster-card" aria-label={name}>
      <header>
        <h3>{name}</h3>
        <span className={`threat threat-${threatLevel}`}>{threat}</span>
      </header>

      <div className="monster-illustration">
        <img className={imageClassName} src={image} alt={name} />
      </div>

      <div className="monster-details">
        <div className="monster-tags">
          {tags.map((tag) => (
            <span key={tag.label}>
              <img src={tag.icon} alt="" />
              {tag.label}
            </span>
          ))}
        </div>

        <div className="monster-facts">
          <div>
            <span>{weaknessLabel}</span>
            <strong className="fact-weakness">
              <img src={weaknessIcon} alt="" />
              {weakness}
            </strong>
          </div>
          <div>
            <span>{harvestLabel}</span>
            <strong className="fact-harvest">
              <img src={harvestIcon} alt="" />
              {harvest}
            </strong>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Mantém o espaço do cartão enquanto a consulta à API está em andamento. */
function MonsterCardSkeleton() {
  return (
    <article className="monster-card-skeleton" aria-hidden="true">
      <div className="skeleton-card-header">
        <span />
        <i />
      </div>
      <div className="skeleton-card-image" />
      <div className="skeleton-card-details">
        <div className="skeleton-card-tags">
          <span />
          <span />
        </div>
        <div className="skeleton-card-facts">
          <span />
          <span />
        </div>
      </div>
    </article>
  );
}

/** Alterna entre os destaques do início e as fichas do usuário conforme a rota. */
export default function Home() {
  const pathname = usePathname();
  const router = useRouter();
  const isCharacterSheets = pathname === "/fichas";
  const [ferais, setFerais] = useState<Feral[]>([]);
  const [monstros, setMonstros] = useState<Monstro[]>([]);
  const [apiError, setApiError] = useState("");
  const [loadingApi, setLoadingApi] = useState(true);
  const {
    collapsed: isSidebarCollapsed,
    sidebarClasses,
    toggleSidebar,
  } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingApi(true);
    setApiError("");

    /** Consulta o recurso da rota atual e encaminha sessões expiradas ao login. */
    async function loadPageData() {
      try {
        if (isCharacterSheets) {
          const data = await getMyFerais();
          if (active) {
            setFerais(data);
          }
        } else {
          const data = await getMonstros();
          if (active) {
            setMonstros(data);
          }
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await fetch("/api/session", { method: "DELETE" });
          limparSessaoLocal();
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        if (active) {
          setApiError(
            getApiErrorMessage(error, "Não foi possível carregar os dados."),
          );
        }
      } finally {
        if (active) {
          setLoadingApi(false);
        }
      }
    }

    void loadPageData();

    return () => {
      active = false;
    };
  }, [isCharacterSheets, pathname, router]);

  /** Encerra a sessão, descarta o usuário local e volta à tela de login. */
  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    limparSessaoLocal();
    router.replace("/login");
    router.refresh();
  }

  /** Adapta as fichas aos dados esperados pelo cartão. */
  const apiCards: MonsterCardProps[] = ferais.map((feral, index) => ({
    harvest: feral.especialidade ?? "Não definida",
    harvestIcon: icons.harvestOne,
    harvestLabel: "Especialidade",
    href: `/fichas/${feral.id}`,
    image:
      urlImagemFeral(feral.imagem_url) ||
      imagensCloudinary.interface[index % 2 ? "ember" : "toad"],
    imageClassName: index % 2 ? "ember-image" : "toad-image",
    name: feral.nome.toUpperCase(),
    tags: [
      {
        icon: icons.character,
        label: feral.titulo ?? "Sem título",
      },
      {
        icon: icons.edible,
        label: feral.voce_e ?? "Feral",
      },
    ],
    threat: feral.titulo ?? "Feral",
    threatLevel: index % 2 ? "high" : "low",
    weakness: `${feral.vigor_atual} / ${feral.vigor_max}`,
    weaknessIcon: icons.cold,
    weaknessLabel: "Vigor",
  }));

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase("pt-BR");
  /** A busca compara o termo com os atributos visíveis das fichas. */
  const visibleCards = normalizedSearch
    ? apiCards.filter((card) =>
        [
          card.name,
          card.threat,
          card.harvest,
          card.weakness,
          ...card.tags.map((tag) => tag.label),
        ].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
        ),
      )
    : apiCards;
  /** Prioriza carregamento e erro antes das mensagens de lista vazia ou busca sem resultados. */
  const apiStatus = loadingApi
    ? "Carregando dados da API..."
    : apiError
      ? apiError
      : (isCharacterSheets ? apiCards : monstros).length === 0
        ? isCharacterSheets
          ? "Nenhuma ficha cadastrada."
          : "Nenhum monstro cadastrado na API."
        : isCharacterSheets && visibleCards.length === 0
          ? `Nenhuma ficha encontrada para “${searchQuery.trim()}”.`
          : "";

  return (
    <div
      className={`home-dashboard${
        isCharacterSheets ? " character-sheets-dashboard" : ""
      }${sidebarClasses}`}
    >
      <aside className="home-sidebar">
        <button
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? "Expandir menu" : "Minimizar menu"}
          className="sidebar-toggle"
          onClick={toggleSidebar}
          type="button"
        />

        <SidebarIdentity nomePadrao="NOME DO FERAL" />

        <nav className="home-navigation" aria-label="Navegação principal">
          <Link
            aria-current={isCharacterSheets ? undefined : "page"}
            className={isCharacterSheets ? "" : "active"}
            data-label="Início"
            href="/"
          >
            <img src={icons.home} alt="" />
            <span>Início</span>
          </Link>
          <Link
            aria-current={isCharacterSheets ? "page" : undefined}
            className={isCharacterSheets ? "active" : ""}
            data-label="Fichas de Personagem"
            href="/fichas"
          >
            <img src={icons.character} alt="" />
            <span>Fichas de Personagem</span>
          </Link>
          <Link data-label="Utensílios" href="/utensilios">
            <img src={icons.utensils} alt="" />
            <span>Utensílios</span>
          </Link>
          <Link data-label="Bestiário" href="/bestiario">
            <img src={icons.bestiary} alt="" />
            <span>Bestiário</span>
          </Link>
          <Link data-label="Rolagem de Dados" href="/dados">
            <img src={icons.dice} alt="" />
            <span>Rolagem de Dados</span>
          </Link>
        </nav>

        <div className="home-sidebar-actions">
          <Link data-label="Perfil" href="/perfil">
            <img src={icons.profile} alt="" />
            <span>Perfil</span>
          </Link>
          <button data-label="Sair" onClick={logout} type="button">
            <img src={icons.logout} alt="" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main
        className={`home-content${
          isCharacterSheets ? " character-sheets-content" : ""
        }`}
      >
        <section
          className={`home-section${
            isCharacterSheets ? " character-sheets-section" : ""
          }`}
        >
          <div className="home-section-heading">
            <h1>{isCharacterSheets ? "Fichas" : "Bestiário"}</h1>
          </div>

          {isCharacterSheets && (
            <div className="character-toolbar">
              <label className="character-search">
                <span aria-hidden="true">⌕</span>
                <input
                  aria-label="Buscar fichas"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar por nome, título ou especialidade..."
                  type="search"
                  value={searchQuery}
                />
              </label>
              <Link className="character-create-button" href="/fichas/novo">
                CRIAR
              </Link>
            </div>
          )}

          {isCharacterSheets ? (
            <div
              className={`monster-grid${
                !loadingApi && visibleCards.length === 0 ? " empty" : ""
              }`}
            >
              {loadingApi
                ? [0, 1].map((item) => <MonsterCardSkeleton key={item} />)
                : visibleCards.map((card) => (
                    <MonsterCard key={card.href} {...card} />
                  ))}
            </div>
          ) : (
            <div className="bestiary-api-grid home-bestiary-grid">
              {loadingApi
                ? [0, 1, 2].map((index) => <MonsterSkeleton key={index} />)
                : monstros
                    .slice(0, 3)
                    .map((monster) => (
                      <MonsterApiCard key={monster.id} monster={monster} />
                    ))}
            </div>
          )}

          {apiStatus && (
            <p className="api-status" role={apiError ? "alert" : "status"}>
              {apiStatus}
            </p>
          )}
        </section>

        {!isCharacterSheets && <UtensiliosDisponiveis />}
      </main>
    </div>
  );
}

function UtensiliosDisponiveis() {
  const { data, error } = useCatalogoUtensilios();
  const destaques = data?.slice(0, 3) ?? [];

  return (
    <section
      className="home-section utensils-section utensil-catalog"
      id="utensils"
      aria-labelledby="home-utensils-title"
    >
      <div className="home-section-heading utensils-heading">
        <h2 id="home-utensils-title">Catálogo de utensílios</h2>
        <Link href="/utensilios">Ver catálogo</Link>
      </div>
      {destaques.length ? (
        <div className="managed-utensil-list">
          {destaques.map((utensilio) => (
            <ConsultarUtensilio
              key={utensilio.id}
              utensilio={utensilio}
              heading="h3"
              resumo
            />
          ))}
        </div>
      ) : (
        <p className="api-status" aria-live="polite">
          {error
            ? "Não foi possível carregar os utensílios."
            : data
              ? "Nenhum utensílio disponível."
              : "Carregando utensílios…"}
        </p>
      )}
    </section>
  );
}
