"use client";

import DashboardShell from "@/components/DashboardShell";
import {
  ApiError,
  CreateFeralPayload,
  Feral,
  getApiErrorMessage,
  getMyFerais,
  updateFeral,
} from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type FeralDraft = {
  ambicao: string;
  conexao: string;
  especialidade: string;
  ferasFamiliares: string;
  imagemUrl: string;
  infanciaCriacao: string;
  iniciacaoComoFeral: string;
  nome: string;
  pratoTipico: string;
  temperoTipico: string;
  tentaSer: string;
  titulo: string;
  vigorAtual: string;
  vigorMaximo: string;
  voceE: string;
};

const emptyDraft: FeralDraft = {
  ambicao: "",
  conexao: "",
  especialidade: "",
  ferasFamiliares: "",
  imagemUrl: "",
  infanciaCriacao: "",
  iniciacaoComoFeral: "",
  nome: "",
  pratoTipico: "",
  temperoTipico: "",
  tentaSer: "",
  titulo: "",
  vigorAtual: "",
  vigorMaximo: "",
  voceE: "",
};

function draftFromFeral(feral: Feral): FeralDraft {
  return {
    ambicao: feral.ambicao ?? "",
    conexao: feral.conexao ?? "",
    especialidade: feral.especialidade ?? "",
    ferasFamiliares: feral.feras_familiares ?? "",
    imagemUrl: feral.imagem_url ?? "",
    infanciaCriacao: feral.infancia_criacao ?? "",
    iniciacaoComoFeral: feral.iniciacao_como_feral ?? "",
    nome: feral.nome,
    pratoTipico: feral.prato_tipico ?? "",
    temperoTipico: feral.tempero_tipico ?? "",
    tentaSer: feral.tenta_ser ?? "",
    titulo: feral.titulo ?? "",
    vigorAtual: String(feral.vigor_atual),
    vigorMaximo: String(feral.vigor_max),
    voceE: feral.voce_e ?? "",
  };
}

function nullable(value: string) {
  return value.trim() || null;
}

export default function Perfil() {
  const router = useRouter();
  const [ferais, setFerais] = useState<Feral[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<FeralDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getMyFerais()
      .then((data) => {
        if (!active) return;
        setFerais(data);
        if (!data.length) return;

        const requestedId = Number(
          new URLSearchParams(window.location.search).get("feral"),
        );
        const selected =
          data.find((feral) => feral.id === requestedId) ?? data[0];
        setSelectedId(selected.id);
        setDraft(draftFromFeral(selected));
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && requestError.status === 401) {
          localStorage.removeItem("wilderfeast_user");
          router.replace("/login?next=/perfil");
          return;
        }
        if (active) {
          setError(
            getApiErrorMessage(requestError, "Não foi possível carregar o perfil."),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  function update(field: keyof FeralDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function selectFeral(id: number) {
    const selected = ferais.find((feral) => feral.id === id);
    if (!selected) return;
    setSelectedId(selected.id);
    setDraft(draftFromFeral(selected));
    setError("");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    setError("");
    setMessage("");

    const vigorMaximo = Number(draft.vigorMaximo);
    const vigorAtual = Number(draft.vigorAtual);
    if (
      !draft.nome.trim() ||
      !Number.isInteger(vigorMaximo) ||
      !Number.isInteger(vigorAtual) ||
      vigorMaximo < 1 ||
      vigorAtual < 0 ||
      vigorAtual > vigorMaximo
    ) {
      setError(
        "Informe o nome e valores válidos de vigor. O vigor atual não pode superar o máximo.",
      );
      return;
    }

    const payload: CreateFeralPayload = {
      ambicao: nullable(draft.ambicao),
      conexao: nullable(draft.conexao),
      especialidade: nullable(draft.especialidade),
      feras_familiares: nullable(draft.ferasFamiliares),
      imagem_url: nullable(draft.imagemUrl),
      infancia_criacao: nullable(draft.infanciaCriacao),
      iniciacao_como_feral: nullable(draft.iniciacaoComoFeral),
      nome: draft.nome.trim(),
      prato_tipico: nullable(draft.pratoTipico),
      tempero_tipico: nullable(draft.temperoTipico),
      tenta_ser: nullable(draft.tentaSer),
      titulo: nullable(draft.titulo),
      vigor_atual: vigorAtual,
      vigor_max: vigorMaximo,
      voce_e: nullable(draft.voceE),
    };

    try {
      setSaving(true);
      const updated = await updateFeral(selectedId, payload);
      setFerais((current) =>
        current.map((feral) => (feral.id === updated.id ? updated : feral)),
      );
      setDraft(draftFromFeral(updated));
      setMessage("Perfil atualizado com sucesso na API.");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        localStorage.removeItem("wilderfeast_user");
        router.replace(`/login?next=/perfil?feral=${selectedId}`);
        return;
      }
      setError(
        getApiErrorMessage(requestError, "Não foi possível salvar o perfil."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell active="perfil" contentClassName="profile-content">
      <section className="hub-page feral-profile-page">
        <header className="profile-brand-heading">
          <span aria-hidden="true">⚔</span>
          <b>WILDERFEAST</b>
          <i />
        </header>

        {loading ? (
          <div className="profile-loading" aria-label="Carregando perfil">
            <span /><span /><span />
          </div>
        ) : ferais.length === 0 && !error ? (
          <div className="hub-empty-state profile-empty">
            <span aria-hidden="true">✦</span>
            <h2>Você ainda não possui um Feral</h2>
            <p>Crie sua primeira ficha para preencher e editar o perfil.</p>
            <Link href="/fichas/novo">CRIAR FICHA</Link>
          </div>
        ) : (
          <form className="feral-profile-form" onSubmit={submit}>
            <div className="profile-selector-row">
              <label>
                <span>Feral ativo</span>
                <select
                  onChange={(event) => selectFeral(Number(event.target.value))}
                  value={selectedId ?? ""}
                >
                  {ferais.map((feral) => (
                    <option key={feral.id} value={feral.id}>{feral.nome}</option>
                  ))}
                </select>
              </label>
              {selectedId && <Link href={`/fichas/${selectedId}`}>VER FICHA COMPLETA</Link>}
            </div>

            <div className="profile-identity-grid">
              <div className="profile-fields-grid">
                <label><span>Nome *</span><input onChange={(event) => update("nome", event.target.value)} required value={draft.nome} /></label>
                <label><span>Título</span><input onChange={(event) => update("titulo", event.target.value)} value={draft.titulo} /></label>
                <label className="profile-field-wide"><span>Especialidade</span><input onChange={(event) => update("especialidade", event.target.value)} value={draft.especialidade} /></label>
                <label><span>Vigor atual *</span><input min="0" onChange={(event) => update("vigorAtual", event.target.value)} required type="number" value={draft.vigorAtual} /></label>
                <label><span>Vigor máximo *</span><input min="1" onChange={(event) => update("vigorMaximo", event.target.value)} required type="number" value={draft.vigorMaximo} /></label>
              </div>
              <div className="profile-image-panel">
                {draft.imagemUrl ? (
                  <img alt={`Imagem de ${draft.nome || "Feral"}`} src={draft.imagemUrl} />
                ) : (
                  <div><span aria-hidden="true">◇</span><p>Área para imagem do Feral</p></div>
                )}
                <label><span>URL da imagem</span><input onChange={(event) => update("imagemUrl", event.target.value)} placeholder="https://..." type="url" value={draft.imagemUrl} /></label>
              </div>
            </div>

            <div className="profile-section-title"><span>01</span><h2>Natureza do Feral</h2></div>
            <div className="profile-text-grid">
              <label><span>Você é</span><textarea onChange={(event) => update("voceE", event.target.value)} rows={3} value={draft.voceE} /></label>
              <label><span>Mas você tenta ser</span><textarea onChange={(event) => update("tentaSer", event.target.value)} rows={3} value={draft.tentaSer} /></label>
              <label className="profile-field-wide"><span>Feras familiares</span><textarea onChange={(event) => update("ferasFamiliares", event.target.value)} rows={3} value={draft.ferasFamiliares} /></label>
              <label><span>Prato típico</span><input onChange={(event) => update("pratoTipico", event.target.value)} value={draft.pratoTipico} /></label>
              <label><span>Tempero típico</span><input onChange={(event) => update("temperoTipico", event.target.value)} value={draft.temperoTipico} /></label>
            </div>

            <div className="profile-section-title"><span>02</span><h2>História e vínculos</h2></div>
            <div className="profile-text-grid">
              <label><span>Infância e criação</span><textarea onChange={(event) => update("infanciaCriacao", event.target.value)} rows={4} value={draft.infanciaCriacao} /></label>
              <label><span>Iniciação como Feral</span><textarea onChange={(event) => update("iniciacaoComoFeral", event.target.value)} rows={4} value={draft.iniciacaoComoFeral} /></label>
              <label><span>Ambição</span><textarea onChange={(event) => update("ambicao", event.target.value)} rows={4} value={draft.ambicao} /></label>
              <label><span>Conexão</span><textarea onChange={(event) => update("conexao", event.target.value)} rows={4} value={draft.conexao} /></label>
            </div>

            {error && <p className="hub-feedback error" role="alert">{error}</p>}
            {message && <p className="hub-feedback success" role="status">{message}</p>}

            <div className="profile-form-actions">
              <Link href="/fichas">CANCELAR</Link>
              <button disabled={saving} type="submit">{saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}</button>
            </div>
          </form>
        )}

        {error && ferais.length === 0 && <p className="hub-feedback error" role="alert">{error}</p>}
      </section>
    </DashboardShell>
  );
}
