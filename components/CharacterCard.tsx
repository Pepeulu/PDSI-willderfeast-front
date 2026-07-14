import Link from 'next/link';

export default function CharacterCard({
  name = 'Gata Samurai',
  image = '/assets/cleaver.png',
}: {
  name?: string;
  image?: string;
}) {
  return (
    <article className="figma-character">
      <div className="character-top">
        <img src={image} alt={name} />
        <div>
          <b>{name}</b>
          <span>Vigor</span>
          <i className="bar red" />
          <span>Vitalidade</span>
          <i className="bar green" />
        </div>
      </div>
      <div className="character-stats">
        <span>
          Pod<small>+1</small>
        </span>
        <span>
          Pre<small>+1</small>
        </span>
        <span>
          Lig<small>+1</small>
        </span>
        <span>
          Sag<small>+1</small>
        </span>
      </div>
      <div className="character-meta">
        <b>
          Especialidade<small>Apanhador</small>
        </b>
        <b>
          Utensílio<small>Cutelo</small>
        </b>
      </div>
      <Link href="/fichas/personagem">Ficha Completa</Link>
    </article>
  );
}
