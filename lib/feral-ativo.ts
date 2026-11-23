import { API_URL } from "@/lib/api-origin";
import { getMyFerais, type AuthUser, type Feral } from "@/lib/api";

export const feralAtivoAlterado = "wilderfeast:feral-ativo";
const cookieIdentidade = "wilderfeast_sidebar_identity";
const validadeSegundos = 24 * 60 * 60;
let consulta:
  { sessao: string; feralId: number; promessa: Promise<void> } | undefined;

function chaveFeral() {
  const usuario = localStorage.getItem("wilderfeast_user") ?? "";
  return `wilderfeast_feral_ativo_id:${usuario}`;
}

export function feralAtivoId() {
  return Number(localStorage.getItem(chaveFeral()));
}

export function imagemFeralAtivo() {
  return lerIdentidadeLateral()?.imagem ?? null;
}

function usuarioLocal() {
  const sessao = localStorage.getItem("wilderfeast_user") ?? "";
  try {
    const usuario = (
      sessao ? JSON.parse(sessao) : null
    ) as Partial<AuthUser> | null;
    const id =
      typeof usuario?.id === "number" && Number.isSafeInteger(usuario.id)
        ? usuario.id
        : 0;
    const nome = usuario?.nome?.trim() || usuario?.email?.split("@")[0] || "";
    return {
      sessao,
      id,
      conta: id > 0 ? String(id) : nome,
      nome,
      malformado: false,
    };
  } catch {
    return { sessao, id: 0, conta: "", nome: "", malformado: true };
  }
}

type IdentidadeLateral = {
  conta: string;
  nome: string;
  nomeFicha?: string | null;
  imagem: string | null;
  expiraEm: number;
};

let ultimaIdentidade: { sessao: string; dados: IdentidadeLateral } | undefined;

export function lerIdentidadeLateral() {
  const prefixo = `${cookieIdentidade}=`;
  const entrada = document.cookie
    .split(/;\s*/)
    .find((cookie) => cookie.startsWith(prefixo));
  if (!entrada) return null;
  try {
    const identidade = JSON.parse(
      decodeURIComponent(entrada.slice(prefixo.length)),
    ) as IdentidadeLateral;
    return identidade?.conta === usuarioLocal().conta &&
      typeof identidade.nome === "string" &&
      (identidade.nomeFicha == null ||
        typeof identidade.nomeFicha === "string") &&
      (typeof identidade.imagem === "string" || identidade.imagem === null) &&
      Number.isFinite(identidade.expiraEm) &&
      identidade.expiraEm > Date.now()
      ? identidade
      : null;
  } catch {
    return null;
  }
}

export function identidadeLateralVisivel() {
  const { sessao, nome } = usuarioLocal();
  const cookie = lerIdentidadeLateral();
  if (ultimaIdentidade?.sessao !== sessao) ultimaIdentidade = undefined;
  if (cookie && sessao) ultimaIdentidade = { sessao, dados: cookie };
  // Enquanto a API renova o cookie, conserve os dados da mesma sessão.
  const dados = cookie ?? ultimaIdentidade?.dados;
  return JSON.stringify([
    dados?.nomeFicha ?? null,
    dados?.nome ?? nome,
    dados?.imagem ?? null,
  ]);
}

export function limparIdentidadeLateral() {
  consulta = undefined;
  ultimaIdentidade = undefined;
  document.cookie = `${cookieIdentidade}=; Max-Age=0; Path=/; SameSite=Lax`;
  window.dispatchEvent(new Event(feralAtivoAlterado));
}

export function limparSessaoLocal() {
  localStorage.removeItem("wilderfeast_user");
  limparIdentidadeLateral();
}

function gravarIdentidade(nomeFicha: string | null, imagem: string | null) {
  const { conta, nome } = usuarioLocal();
  const anterior = lerIdentidadeLateral();
  if (
    anterior?.nome === nome &&
    anterior.nomeFicha === nomeFicha &&
    anterior.imagem === imagem
  )
    return;
  const identidade = {
    conta,
    nome,
    nomeFicha,
    imagem,
    expiraEm: Date.now() + validadeSegundos * 1000,
  };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${cookieIdentidade}=${encodeURIComponent(JSON.stringify(identidade))}; Max-Age=${validadeSegundos}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(feralAtivoAlterado));
}

export function atualizarIdentidadeLateral() {
  const { sessao, id, malformado } = usuarioLocal();
  if (malformado) localStorage.removeItem("wilderfeast_user");
  if (id <= 0 || lerIdentidadeLateral()?.nomeFicha !== undefined) return;
  const feralId = feralAtivoId();
  if (consulta?.sessao === sessao && consulta.feralId === feralId) return;

  const promessa = getMyFerais()
    .then((fichas) => {
      if (
        consulta?.promessa !== promessa ||
        usuarioLocal().sessao !== sessao ||
        lerIdentidadeLateral()?.nomeFicha !== undefined
      )
        return;
      const feral = fichas.find((ficha) => ficha.id === feralId) ?? fichas[0];
      salvarFeralAtivo(feral ?? null);
    })
    .catch(() => undefined)
    .finally(() => {
      if (consulta?.promessa === promessa) consulta = undefined;
    });
  consulta = { sessao, feralId, promessa };
}

export function urlImagemFeral(imagem: string | null) {
  const valor = imagem?.trim() ?? "";
  if (/^https?:\/\/[^\s]+$/i.test(valor)) {
    try {
      return new URL(valor).hostname ? valor : "";
    } catch {
      return "";
    }
  }
  if (/^\/(?!\/)[^\s]+$/.test(valor))
    return `${API_URL.replace(/\/$/, "")}${valor}`;
  return "";
}

export function salvarFeralAtivo(
  feral: Pick<Feral, "id" | "nome" | "imagem_url"> | null,
) {
  if (feral) {
    localStorage.setItem(chaveFeral(), String(feral.id));
  } else {
    localStorage.removeItem(chaveFeral());
  }
  gravarIdentidade(
    feral?.nome?.trim() || null,
    feral ? urlImagemFeral(feral.imagem_url) : null,
  );
}
