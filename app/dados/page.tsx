"use client";

import DashboardShell from "@/components/DashboardShell";
import { useState } from "react";

type RollEntry = { dice: string; id: number; result: string };

function rollDie(sides: number) {
  return 1 + Math.floor(Math.random() * sides);
}

export default function Dados() {
  const [human, setHuman] = useState(1);
  const [animal, setAnimal] = useState(1);
  const [styleCount, setStyleCount] = useState(3);
  const [styleDice, setStyleDice] = useState([1, 1, 1]);
  const [history, setHistory] = useState<RollEntry[]>([]);

  function remember(dice: string, result: string) {
    setHistory((current) => [
      { dice, id: Date.now() + Math.random(), result },
      ...current.slice(0, 5),
    ]);
  }

  function rollHuman() {
    const result = rollDie(8);
    setHuman(result);
    remember("Dado Humano · d8", String(result));
  }

  function rollAnimal() {
    const result = rollDie(20);
    setAnimal(result);
    remember("Dado Animal · d20", String(result));
  }

  function rollStyle() {
    const results = Array.from({ length: styleCount }, () => rollDie(6));
    setStyleDice(results);
    remember("Dados de Estilo · d6", results.join(" + "));
  }

  function changeStyleCount(value: number) {
    setStyleCount(value);
    setStyleDice(Array.from({ length: value }, () => 1));
  }

  return (
    <DashboardShell active="dados" contentClassName="dice-content">
      <section className="hub-page dice-page">
        <header className="hub-page-heading">
          <div>
            <p>MESA DE CAÇA</p>
            <h1>Rolagem de Dados</h1>
          </div>
          <span>RESULTADOS LOCAIS</span>
        </header>

        <div className="dice-primary-grid">
          <article className="dice-panel human-die">
            <div className="dice-panel-title">
              <span>01</span>
              <div><small>DADO HUMANO</small><h2>D8</h2></div>
            </div>
            <div aria-live="polite" className="faceted-die"><b>{human}</b></div>
            <button onClick={rollHuman} type="button">ROLAR DADO</button>
          </article>

          <article className="dice-panel animal-die">
            <div className="dice-panel-title">
              <span>02</span>
              <div><small>DADO ANIMAL</small><h2>D20</h2></div>
            </div>
            <div aria-live="polite" className="faceted-die"><b>{animal}</b></div>
            <button onClick={rollAnimal} type="button">ROLAR DADO</button>
          </article>
        </div>

        <article className="style-dice-panel">
          <div className="dice-panel-title">
            <span>03</span>
            <div><small>TESTE DE AÇÃO</small><h2>Dados de Estilo</h2></div>
          </div>
          <div aria-live="polite" className="style-dice-row">
            {styleDice.map((result, index) => (
              <div className="style-die" key={`${index}-${result}`}>{result}</div>
            ))}
          </div>
          <div className="style-dice-controls">
            <label>
              <span>Quantidade</span>
              <select
                onChange={(event) => changeStyleCount(Number(event.target.value))}
                value={styleCount}
              >
                {[1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>{count} {count === 1 ? "dado" : "dados"}</option>
                ))}
              </select>
            </label>
            <button onClick={rollStyle} type="button">ROLAR ESTILO</button>
          </div>
        </article>

        <section className="dice-history">
          <div className="dice-history-heading">
            <h2>Últimas rolagens</h2>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} type="button">LIMPAR</button>
            )}
          </div>
          {history.length === 0 ? (
            <p>Role um dado para começar o histórico desta sessão.</p>
          ) : (
            <ul>
              {history.map((entry) => (
                <li key={entry.id}><span>{entry.dice}</span><b>{entry.result}</b></li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </DashboardShell>
  );
}
