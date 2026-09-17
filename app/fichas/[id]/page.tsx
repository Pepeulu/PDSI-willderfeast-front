"use client";

import Header from "@/components/Header";
import { ApiError, createFeral, getApiErrorMessage } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const lorem =
  "Lorem ipsum bla bla bla arthur, lorem ipsum bla bla bla arthur, lorem ipsum bla bla bla arthur.";

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

function Divider({ title }: { title: string }) {
  return (
    <h2 className="sheet-divider">
      <span>{title}</span>
    </h2>
  );
}

function CharacterSheetDetail() {
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
        {["Criação", "Iniciação", "Ambição", "Conexão"].map((item) => (
          <div className="history-row" key={item}>
            <b>{item}:</b>
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
            {["LIGEIRO", "PODEROSO", "PRECISO", "SAGAZ"].map((item) => (
              <span className="ability" key={item}>
                {item}
                <b>0</b>
              </span>
            ))}
          </div>
          <div>
            <h3>Habilidades</h3>
            {[
              "AGARRAR",
              "ATIRAR",
              "ARMAZENAR",
              "ATRAVESSAR",
              "ASSEGURAR",
              "CHAMAR",
            ].map((item) => (
              <span className="ability" key={item}>
                {item}
                <b>0</b>
              </span>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default function Sheet() {
  const params = useParams<{ id: string }>();

  return params.id === "novo" ? (
    <CreateCharacterSheet />
  ) : (
    <CharacterSheetDetail />
  );
}
