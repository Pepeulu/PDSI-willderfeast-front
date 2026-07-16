"use client";
import { useState } from "react";
import Header from "@/components/Header";
function PolyDie({
  value,
  color,
  animal = false,
}: {
  value: number;
  color: string;
  animal?: boolean;
}) {
  return (
    <div
      className={`poly-die ${animal ? "animal" : ""}`}
      style={{ background: color }}
    >
      <span>{value}</span>
    </div>
  );
}
export default function Dados() {
  const [human, setHuman] = useState(1);
  const [animal, setAnimal] = useState(1);
  const [style, setStyle] = useState([1, 1, 1, 1, 1]);
  const roll = (max: number, set: (n: number) => void) =>
    set(1 + Math.floor(Math.random() * max));
  return (
    <>
      <Header />
      <main className="figma-page dice-figma">
        <section>
          <h2>Dado de Humano</h2>
          <PolyDie value={human} color="#4d8b27" />
          <button className="orange-button" onClick={() => roll(8, setHuman)}>
            Rolar
          </button>
        </section>
        <section>
          <h2>Dado Animal</h2>
          <PolyDie value={animal} color="#e20d3d" animal />
          <button className="orange-button" onClick={() => roll(20, setAnimal)}>
            Rolar
          </button>
        </section>
        <section>
          <h2>Dados de Estilo</h2>
          <div className="style-dice">
            {style.map((n, i) => (
              <div className="cube" key={i}>
                {n}
              </div>
            ))}
          </div>
          <div className="style-controls">
            <select>
              <option>Quantidade de dados</option>
              <option>3 dados</option>
              <option>5 dados</option>
            </select>
            <button
              className="orange-button"
              onClick={() =>
                setStyle(style.map(() => 1 + Math.floor(Math.random() * 6)))
              }
            >
              Rolar
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
