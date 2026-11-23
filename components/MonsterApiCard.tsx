import Link from "next/link";
import type { Monstro } from "@/lib/api";
import BeastIllustration from "./BeastIllustration";

/** Reserva a posição de um cartão durante a consulta ao bestiário. */
export function MonsterSkeleton() {
  return (
    <article aria-hidden="true" className="bestiary-card bestiary-skeleton">
      <span />
      <i />
      <i />
    </article>
  );
}

/** Mostra o resumo do monstro e oferece acesso ao registro completo. */
export function MonsterApiCard({ monster }: { monster: Monstro }) {
  const vigor = Math.max(
    0,
    Math.min(100, (monster.vigor_atual / monster.vigor_base) * 100),
  );

  return (
    <Link className="bestiary-card" href={`/bestiario/${monster.id}`}>
      <div className="bestiary-card-image">
        <BeastIllustration nome={monster.nome} imagemUrl={monster.imagem_url} />
        <b>{monster.categoria}</b>
      </div>
      <div className="bestiary-card-copy">
        <p>REGISTRO #{String(monster.id).padStart(3, "0")}</p>
        <h2>{monster.nome}</h2>
        <div className="bestiary-tags">
          <span>{monster.habitat || "Habitat desconhecido"}</span>
          <span>{monster.dieta || "Dieta desconhecida"}</span>
        </div>
        <small>
          VIGOR {monster.vigor_atual} / {monster.vigor_base}
        </small>
        <div className="bestiary-vigor">
          <i style={{ width: `${vigor}%` }} />
        </div>
      </div>
    </Link>
  );
}
