import Link from 'next/link';

export default function Header() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <img src="/assets/title.png" alt="Wilderfeast — Você é o que você come" />
      </Link>
      <nav>
        <Link href="/dados">Dados</Link>
        <Link href="/fichas">Fichas</Link>
        <Link href="/bestiario">Bestiário</Link>
        <Link href="/login">Mestre</Link>
      </nav>
    </header>
  );
}
