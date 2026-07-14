export default function CreatureArt({ kind = 0 }: { kind?: number }) {
  const icons = ['🦊', '🦌', '🦅', '🐗', '🐍', '🐺'];
  return (
    <div className={`creature-art art-${kind % 6}`}>
      <span>{icons[kind % icons.length]}</span>
      <i />
    </div>
  );
}
