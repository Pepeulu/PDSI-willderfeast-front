import Link from 'next/link';
import Header from '@/components/Header';
import CharacterCard from '@/components/CharacterCard';
import MonsterCard from '@/components/MonsterCard';
export default function Home() {
  return (
    <>
      <Header />
      <main className="figma-page">
        <section>
          <h1>Criar ficha</h1>
          <p>Crie aqui a ficha do seu personagem</p>
          <Link className="orange-button" href="/cadastro">
            Criar
          </Link>
        </section>
        <section>
          <h2>Fichas Criadas</h2>
          <div className="home-characters">
            <CharacterCard />
            <CharacterCard name="Nome" image="/assets/torch.png" />
            <Link className="blue-tile" href="/fichas">
              Acessar
              <br />
              restante
            </Link>
          </div>
        </section>
        <section>
          <h2>Bestiário</h2>
          <p>Todas as informações sobre as bestas do mundo Wilderfeast</p>
          <div className="home-bestiary">
            <MonsterCard index={0} />
            <MonsterCard index={1} />
            <div className="bestiary-copy">
              <p>
                Para ter acesso ao bestiário completo, seja redirecionado para a página clicando no
                botão
              </p>
              <Link className="orange-button" href="/bestiario">
                Clique Aqui
              </Link>
            </div>
          </div>
        </section>
        <section className="master-area">
          <h2>Área do Mestre</h2>
          <p>Espaço dedicado para o nosso mestre lindo e maravilhoso</p>
          <Link className="orange-button" href="/login">
            Boss Aqui
          </Link>
        </section>
      </main>
    </>
  );
}
