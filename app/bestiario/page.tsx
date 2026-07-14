import Header from '@/components/Header';
import MonsterCard from '@/components/MonsterCard';
export default function Bestiario() {
  return (
    <>
      <Header />
      <main className="figma-page">
        <h1>Bestiário</h1>
        <p>Todas as informações sobre as bestas do mundo wilderfeast</p>
        <div className="figma-monster-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <MonsterCard key={i} index={i} />
          ))}
        </div>
      </main>
    </>
  );
}
