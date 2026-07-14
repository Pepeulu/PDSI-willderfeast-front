import Header from '@/components/Header';
const lorem =
  'Lorem ipsum bla bla bla arthur, lorem ipsum bla bla bla arthur, lorem ipsum bla bla bla arthur.';
function Divider({ title }: { title: string }) {
  return (
    <h2 className="sheet-divider">
      <span>{title}</span>
    </h2>
  );
}
export default async function Sheet() {
  return (
    <>
      <Header />
      <main className="long-sheet">
        <section className="sheet-profile">
          <img src="/assets/wilders.jpg" alt="Askell" />
          <div>
            <p>
              <b>Nome:</b> Askell
            </p>
            <p>
              <b>Título:</b> O alquímico
            </p>
            <p>
              <b>Interpretado por</b> Davi Dilleon
            </p>
            <p>
              <b>Condições:</b>
            </p>
            <div className="conditions">
              <span>Confuso 3</span>
              <span>Atordoado</span>
              <span>Ferido 2</span>
              <span>Em campanha</span>
            </div>
          </div>
        </section>
        <Divider title="Utensílio" />
        <h3 className="sheet-center">Bule</h3>
        <div className="sheet-text">
          <b>Informações:</b>
          <p>
            Alcance: 1 (Golpear)
            <br />
            Se quebrado: Alcance 1 (Golpear). Essa parte dá metade do dano.
            <br />
            Durabilidade: <mark>100%</mark>
          </p>
          <b>Ataques:</b>
          <p>
            {lorem}
            <br />
            {lorem}
            <br />
            {lorem}
          </p>
        </div>
        <Divider title="História" />
        {['Criação', 'Iniciação', 'Ambição', 'Conexão'].map((x) => (
          <div className="history-row" key={x}>
            <b>{x}:</b>
            <p>
              {lorem}
              <br />
              {lorem}
            </p>
          </div>
        ))}
        <Divider title="Pontos / Habilidades" />
        <div className="ability-columns">
          <div>
            <h3>Estilos</h3>
            {['LIGEIRO', 'PODEROSO', 'PRECISO', 'SAGAZ'].map((x) => (
              <span className="ability" key={x}>
                {x}
                <b>0</b>
              </span>
            ))}
          </div>
          <div>
            <h3>Habilidades</h3>
            {['AGARRAR', 'ATIRAR', 'ARMAZENAR', 'ATRAVESSAR', 'ASSEGURAR', 'CHAMAR'].map((x) => (
              <span className="ability" key={x}>
                {x}
                <b>0</b>
              </span>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
