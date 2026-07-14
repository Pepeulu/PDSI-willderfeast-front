import Link from 'next/link';
export default function MonsterCard({ index = 0 }: { index?: number }) {
  const names = ['Hagsechu', 'Mammudo', 'Kakwari', 'Botabo', 'Tatzelwurm', 'Batu'];
  const positions = ['0% 0%', '100% 0%', '0% 100%', '100% 100%', '0% 0%', '100% 0%'];
  return (
    <Link href={`/bestiario/${index + 1}`} className="monster-card">
      <div
        className="monster-image"
        role="img"
        aria-label={names[index % 6]}
        style={{ backgroundPosition: positions[index % 6] }}
      />
      <b>Besta {index + 1}</b>
      <small>{index % 2 ? 'É muito difícil de caçar' : 'Faz isso e aquilo'}</small>
    </Link>
  );
}
