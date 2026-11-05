"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export type DashboardSection =
  | "inicio"
  | "fichas"
  | "utensilios"
  | "bestiario"
  | "dados"
  | "perfil";

type DashboardShellProps = {
  active: DashboardSection;
  children: ReactNode;
  contentClassName?: string;
  dashboardClassName?: string;
};

const profileAvatar =
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Qiyana_0.jpg";

function NavigationIcon({ name }: { name: DashboardSection | "sair" }) {
  const common = {
    "aria-hidden": true,
    className: "sidebar-nav-icon",
    fill: "none",
    viewBox: "0 0 24 24",
  } as const;

  if (name === "inicio") {
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9M9 21v-7h6v7" />
      </svg>
    );
  }

  if (name === "fichas") {
    return (
      <svg {...common}>
        <rect height="18" rx="1" width="14" x="5" y="3" />
        <circle cx="12" cy="9" r="2.2" />
        <path d="M8.5 17c.9-2.4 6.1-2.4 7 0" />
      </svg>
    );
  }

  if (name === "utensilios") {
    return (
      <svg {...common}>
        <path d="M6 3v7M3.5 3v5a2.5 2.5 0 0 0 5 0V3M6 10v11" />
        <path d="M16 3v18M16 3c3.1 2 3.1 7.5 0 9" />
      </svg>
    );
  }

  if (name === "bestiario") {
    return (
      <svg {...common}>
        <circle cx="5.5" cy="7" r="2" />
        <circle cx="10" cy="4.5" r="2" />
        <circle cx="14" cy="4.5" r="2" />
        <circle cx="18.5" cy="7" r="2" />
        <path d="M5.5 16.8c0-3.2 2.9-6 6.5-6s6.5 2.8 6.5 6c0 2.4-1.8 3.2-3.8 2.4a7.5 7.5 0 0 0-5.4 0c-2 .8-3.8 0-3.8-2.4Z" />
      </svg>
    );
  }

  if (name === "dados") {
    return (
      <svg {...common}>
        <rect height="18" rx="2" width="18" x="3" y="3" />
        <circle cx="8" cy="8" r="1" />
        <circle cx="16" cy="8" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="8" cy="16" r="1" />
        <circle cx="16" cy="16" r="1" />
      </svg>
    );
  }

  if (name === "perfil") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21c.7-4.4 3.2-6.5 7.5-6.5s6.8 2.1 7.5 6.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
    </svg>
  );
}

const navigation: Array<{
  href: string;
  label: string;
  section: Exclude<DashboardSection, "perfil">;
}> = [
  { href: "/", label: "Início", section: "inicio" },
  { href: "/fichas", label: "Fichas de Personagem", section: "fichas" },
  { href: "/utensilios", label: "Utensílios", section: "utensilios" },
  { href: "/bestiario", label: "Bestiário", section: "bestiario" },
  { href: "/dados", label: "Rolagem de Dados", section: "dados" },
];

export default function DashboardShell({
  active,
  children,
  contentClassName = "",
  dashboardClassName = "",
}: DashboardShellProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState("FERAL");

  useEffect(() => {
    setCollapsed(
      localStorage.getItem("wilderfeast_sidebar_collapsed") === "true",
    );

    const savedUser = localStorage.getItem("wilderfeast_user");
    if (!savedUser) return;

    try {
      const user = JSON.parse(savedUser) as { email?: string; nome?: string };
      const name = user.nome?.trim() || user.email?.split("@")[0];
      if (name) setUserName(name.toLocaleUpperCase("pt-BR"));
    } catch {
      localStorage.removeItem("wilderfeast_user");
    }
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("wilderfeast_sidebar_collapsed", String(next));
      return next;
    });
  }

  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    localStorage.removeItem("wilderfeast_user");
    router.replace("/login");
    router.refresh();
  }

  return (
    <div
      className={`home-dashboard ${dashboardClassName}${
        collapsed ? " sidebar-collapsed" : ""
      }`.trim()}
    >
      <aside className="home-sidebar">
        <button
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expandir menu" : "Minimizar menu"}
          className="sidebar-toggle"
          onClick={toggleSidebar}
          type="button"
        >
          <span aria-hidden="true">{collapsed ? "›" : "‹"}</span>
        </button>

        <div className="home-user">
          <span className="home-avatar">
            <img alt="Qiyana" src={profileAvatar} />
          </span>
          <strong>{userName}</strong>
        </div>

        <nav aria-label="Navegação principal" className="home-navigation">
          {navigation.map((item) => (
            <Link
              aria-current={active === item.section ? "page" : undefined}
              className={active === item.section ? "active" : ""}
              data-label={item.label}
              href={item.href}
              key={item.section}
            >
              <NavigationIcon name={item.section} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="home-sidebar-actions">
          <Link
            aria-current={active === "perfil" ? "page" : undefined}
            className={active === "perfil" ? "active" : ""}
            data-label="Perfil"
            href="/perfil"
          >
            <NavigationIcon name="perfil" />
            <span>Perfil</span>
          </Link>
          <button data-label="Sair" onClick={logout} type="button">
            <NavigationIcon name="sair" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className={`home-content ${contentClassName}`.trim()}>{children}</main>
    </div>
  );
}
