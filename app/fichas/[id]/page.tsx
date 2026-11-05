"use client";

import DashboardShell from "@/components/DashboardShell";
import {
  ApiError,
  createFeral,
  deleteFeral,
  Feral,
  getApiErrorMessage,
  getFeral,
} from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type FeralForm = {
  nome: string;
  titulo: string;
  especialidade: string;
  imagemUrl: string;
  vigorMaximo: string;
  vigorAtual: string;
  voceE: string;
  tentaSer: string;
  ferasFamiliares: string;
  pratoTipico: string;
  temperoTipico: string;
  infanciaCriacao: string;
  iniciacaoComoFeral: string;
  ambicao: string;
  conexao: string;
};

type TextFieldConfig = {
  field: keyof FeralForm;
  label: string;
  maxLength?: number;
  placeholder: string;
  type?: "text" | "url";
  wide?: boolean;
};

const initialForm: FeralForm = {
  nome: "",
  titulo: "",
  especialidade: "",
  imagemUrl: "",
  vigorMaximo: "10",
  vigorAtual: "10",
  voceE: "",
  tentaSer: "",
  ferasFamiliares: "",
  pratoTipico: "",
  temperoTipico: "",
  infanciaCriacao: "",
  iniciacaoComoFeral: "",
  ambicao: "",
  conexao: "",
};

const identityFields: TextFieldConfig[] = [
  {
    field: "nome",
    label: "Nome do Feral *",
    maxLength: 100,
    placeholder: "Ex.: Askell",
  },
  {
    field: "titulo",
    label: "Título",
    maxLength: 100,
    placeholder: "Ex.: O Alquímico",
  },
  {
    field: "especialidade",
    label: "Especialidade",
    maxLength: 100,
    placeholder: "Ex.: Cozinha de campo",
  },
  {
    field: "imagemUrl",
    label: "URL da imagem",
    maxLength: 255,
    placeholder: "https://exemplo.com/feral.jpg",
    type: "url",
  },
];

const profileFields: TextFieldConfig[] = [
  {
    field: "voceE",
    label: "Você é",
    placeholder: "Como o Feral se define",
  },
  {
    field: "tentaSer",
    label: "Tenta ser",
    placeholder: "O que busca se tornar",
  },
  {
    field: "ferasFamiliares",
    label: "Feras familiares",
    placeholder: "Feras conhecidas ou próximas",
    wide: true,
  },
  {
    field: "pratoTipico",
    label: "Prato típico",
    maxLength: 100,
    placeholder: "Ex.: Ensopado de raízes",
  },
  {
    field: "temperoTipico",
    label: "Tempero típico",
    maxLength: 100,
    placeholder: "Ex.: Pimenta defumada",
  },
];

const historyFields: TextFieldConfig[] = [
  {
    field: "infanciaCriacao",
    label: "Infância e criação",
    placeholder: "Conte como foi a infância do Feral...",
  },
  {
    field: "iniciacaoComoFeral",
    label: "Iniciação como Feral",
    placeholder: "Descreva sua iniciação como caçador-cozinheiro...",
  },
  {
    field: "ambicao",
    label: "Ambição",
    placeholder: "Qual é o maior objetivo do personagem?",
  },
  {
    field: "conexao",
    label: "Conexão",
    placeholder: "Descreva uma conexão importante...",
  },
];

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="feral-form-section-heading">
      <span>{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function CreateCharacterSheet() {
  const router = useRouter();
  const [form, setForm] = useState<FeralForm>(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof FeralForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function renderTextField(config: TextFieldConfig) {
    return (
      <label
        className={"feral-field" + (config.wide ? " feral-field-wide" : "")}
        key={config.field}
      >
        <span>{config.label}</span>
        <input
          autoFocus={config.field === "nome"}
          maxLength={config.maxLength}
          onChange={(event) => updateField(config.field, event.target.value)}
          placeholder={config.placeholder}
          required={config.field === "nome"}
          type={config.type ?? "text"}
          value={form[config.field]}
        />
      </label>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const vigorMaximo = Number(form.vigorMaximo);
    const vigorAtual = Number(form.vigorAtual);

    if (!form.nome.trim()) {
      setError("Informe o nome do Feral.");
      return;
    }

    if (
      !Number.isInteger(vigorMaximo) ||
      !Number.isInteger(vigorAtual) ||
      vigorMaximo < 1 ||
      vigorAtual < 0 ||
      vigorAtual > vigorMaximo
    ) {
      setError(
        "Informe valores inteiros de vigor. O vigor atual não pode superar o vigor máximo.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await createFeral({
        ambicao: optionalValue(form.ambicao),
        conexao: optionalValue(form.conexao),
        especialidade: optionalValue(form.especialidade),
        feras_familiares: optionalValue(form.ferasFamiliares),
        imagem_url: optionalValue(form.imagemUrl),
        infancia_criacao: optionalValue(form.infanciaCriacao),
        iniciacao_como_feral: optionalValue(form.iniciacaoComoFeral),
        nome: form.nome.trim(),
        prato_tipico: optionalValue(form.pratoTipico),
        tempero_tipico: optionalValue(form.temperoTipico),
        tenta_ser: optionalValue(form.tentaSer),
        titulo: optionalValue(form.titulo),
        vigor_atual: vigorAtual,
        vigor_max: vigorMaximo,
        voce_e: optionalValue(form.voceE),
      });

      router.push("/fichas");
      router.refresh();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        localStorage.removeItem("wilderfeast_user");
        router.replace("/login?next=/fichas/novo");
        return;
      }

      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível criar a ficha. Tente novamente.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="feral-create-page">
      <div className="feral-create-shell">
        <Link className="feral-back-link" href="/fichas">
          <span aria-hidden="true">←</span>
          Voltar para fichas
        </Link>

        <header className="feral-create-heading">
          <p>NOVO REGISTRO DE CAÇADOR-COZINHEIRO</p>
          <h1>Criar ficha</h1>
          <span>
            Preencha os dados do seu Feral. Os campos marcados com * são
            obrigatórios.
          </span>
        </header>

        <form className="feral-create-form" noValidate onSubmit={submit}>
          <section className="feral-form-section">
            <SectionHeading
              description="As informações principais exibidas no card da ficha."
              number="01"
              title="Identidade"
            />
            <div className="feral-form-grid">
              {identityFields.map(renderTextField)}
            </div>
          </section>

          <section className="feral-form-section">
            <SectionHeading
              description="Vigor, natureza e referências culinárias."
              number="02"
              title="Perfil do Feral"
            />
            <div className="feral-form-grid">
              <label className="feral-field">
                <span>Vigor máximo *</span>
                <input
                  min={1}
                  onChange={(event) =>
                    updateField("vigorMaximo", event.target.value)
                  }
                  required
                  step={1}
                  type="number"
                  value={form.vigorMaximo}
                />
              </label>
              <label className="feral-field">
                <span>Vigor atual *</span>
                <input
                  min={0}
                  onChange={(event) =>
                    updateField("vigorAtual", event.target.value)
                  }
                  required
                  step={1}
                  type="number"
                  value={form.vigorAtual}
                />
              </label>
              {profileFields.map(renderTextField)}
            </div>
          </section>

          <section className="feral-form-section">
            <SectionHeading
              description="Os acontecimentos que moldaram o personagem."
              number="03"
              title="História e vínculos"
            />
            <div className="feral-form-grid">
              {historyFields.map((config) => (
                <label
                  className="feral-field feral-field-wide"
                  key={config.field}
                >
                  <span>{config.label}</span>
                  <textarea
                    onChange={(event) =>
                      updateField(config.field, event.target.value)
                    }
                    placeholder={config.placeholder}
                    rows={config.field === "ambicao" || config.field === "conexao" ? 3 : 4}
                    value={form[config.field]}
                  />
                </label>
              ))}
            </div>
          </section>

          {error && (
            <p className="feral-form-error" role="alert">
              {error}
            </p>
          )}

          <div className="feral-form-actions">
            <Link className="feral-cancel-button" href="/fichas">
              Cancelar
            </Link>
            <button
              className="feral-submit-button"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "SALVANDO..." : "CRIAR FICHA"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function SheetField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="api-sheet-field">
      <span>{label}</span>
      <p>{value || "Não informado"}</p>
    </div>
  );
}

function CharacterSheetDetail({ id }: { id: number }) {
  const router = useRouter();
  const [feral, setFeral] = useState<Feral | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getFeral(id)
      .then((data) => {
        if (active) setFeral(data);
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && requestError.status === 401) {
          localStorage.removeItem("wilderfeast_user");
          router.replace(`/login?next=/fichas/${id}`);
          return;
        }
        if (active) {
          setError(
            getApiErrorMessage(requestError, "Não foi possível carregar a ficha."),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, router]);

  async function removeSheet() {
    if (!feral || !window.confirm(`Excluir definitivamente a ficha de ${feral.nome}?`)) {
      return;
    }

    try {
      setDeleting(true);
      await deleteFeral(feral.id);
      router.replace("/fichas");
      router.refresh();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível excluir a ficha."),
      );
      setDeleting(false);
    }
  }

  return (
    <DashboardShell active="fichas" contentClassName="api-sheet-content">
      <section className="hub-page api-character-sheet">
        <header className="profile-brand-heading">
          <span aria-hidden="true">⚔</span>
          <b>WILDERFEAST</b>
          <i />
        </header>

        {loading ? (
          <div className="profile-loading" aria-label="Carregando ficha">
            <span /><span /><span />
          </div>
        ) : error && !feral ? (
          <div className="hub-empty-state api-sheet-error">
            <span aria-hidden="true">!</span>
            <h2>Ficha indisponível</h2>
            <p>{error}</p>
            <Link href="/fichas">VOLTAR PARA FICHAS</Link>
          </div>
        ) : feral ? (
          <>
            <div className="api-sheet-hero">
              <div className="api-sheet-photo">
                <img
                  alt={`Retrato de ${feral.nome}`}
                  src={feral.imagem_url || "/assets/wilders.jpg"}
                />
              </div>
              <div className="api-sheet-identity">
                <p>FICHA DO FERAL · #{String(feral.id).padStart(3, "0")}</p>
                <h1>{feral.nome}</h1>
                <h2>{feral.titulo || "Feral sem título"}</h2>
                <div className="api-sheet-badges">
                  <span>{feral.especialidade || "Especialidade não definida"}</span>
                  <span>VIGOR {feral.vigor_atual} / {feral.vigor_max}</span>
                </div>
                <div className="api-sheet-vigor">
                  <i
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (feral.vigor_atual / feral.vigor_max) * 100),
                      )}%`,
                    }}
                  />
                </div>
                <div className="api-sheet-actions">
                  <Link href={`/perfil?feral=${feral.id}`}>EDITAR PERFIL</Link>
                  <button disabled={deleting} onClick={removeSheet} type="button">
                    {deleting ? "EXCLUINDO..." : "EXCLUIR FICHA"}
                  </button>
                </div>
              </div>
            </div>

            <div className="profile-section-title"><span>01</span><h2>Natureza do Feral</h2></div>
            <div className="api-sheet-field-grid">
              <SheetField label="Você é" value={feral.voce_e} />
              <SheetField label="Mas você tenta ser" value={feral.tenta_ser} />
              <SheetField label="Feras familiares" value={feral.feras_familiares} />
              <SheetField label="Prato típico" value={feral.prato_tipico} />
              <SheetField label="Tempero típico" value={feral.tempero_tipico} />
            </div>

            <div className="profile-section-title"><span>02</span><h2>História e vínculos</h2></div>
            <div className="api-sheet-history">
              <SheetField label="Infância e criação" value={feral.infancia_criacao} />
              <SheetField label="Iniciação como Feral" value={feral.iniciacao_como_feral} />
              <SheetField label="Ambição" value={feral.ambicao} />
              <SheetField label="Conexão" value={feral.conexao} />
            </div>

            {error && <p className="hub-feedback error" role="alert">{error}</p>}
          </>
        ) : null}
      </section>
    </DashboardShell>
  );
}

export default function Sheet() {
  const params = useParams<{ id: string }>();

  return params.id === "novo" ? (
    <CreateCharacterSheet />
  ) : (
    <CharacterSheetDetail id={Number(params.id)} />
  );
}
