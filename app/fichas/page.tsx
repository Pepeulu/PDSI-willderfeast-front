import Header from "@/components/Header";
import CharacterCard from "@/components/CharacterCard";
import Link from "next/link";
export default function Fichas() {
  return (
    <>
      <Header />
      <main className="figma-page">
        <h1>Fichas</h1>
        <div className="fichas-grid">
          <CharacterCard />
          <CharacterCard name="Nome" image="/assets/torch.png" />
          <CharacterCard name="Nome" />
          <Link href="/cadastro" className="blue-tile">
            Criar nova
          </Link>
        </div>
      </main>
    </>
  );
}
