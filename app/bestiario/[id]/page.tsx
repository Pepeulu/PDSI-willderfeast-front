import Header from '@/components/Header';
const text =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. A besta se move pelo território e protege seu habitat com ferocidade.';
function Divider({ title }: { title: string }) {
  return (
    <h2 className="sheet-divider">
      <span>{title}</span>
    </h2>
  );
}
export default function BeastSheet() {
  return (
    <>
      <Header />
      <main className="long-sheet beast-sheet">
        <section className="sheet-profile">
          <img src="/assets/monsters.jpg" alt="Besta" />
          <div>
            <p>
              <b>Nome:</b> Hagsechu
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
        <Divider title="Partes" />
        {['Escamas', 'Garras', 'Cauda'].map((x) => (
          <section className="beast-part" key={x}>
            <p>
              <b>{x.toUpperCase()}.</b> Alcance: 1 <em>(AGARRAR PODEROSO)</em> | Passiva: se você
              conseguir atacar ela fica <strong>PRESA</strong>
            </p>
            <p>• Se quebrado: Alcance 1 (AGARRAR PODEROSO)</p>
          </section>
        ))}
        <div className="durability">
          <b>20</b>
          <b>20</b>
          <b>20</b>
        </div>
        <Divider title="Comportamento" />
        {['Comportamento', 'Dieta', 'Habitat'].map((x) => (
          <div className="history-row" key={x}>
            <b>{x}:</b>
            <p>
              {text}
              <br />
              {text}
            </p>
          </div>
        ))}
        <Divider title="Pontos / Habilidades" />
      </main>
    </>
  );
}
