import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://poas-wilderfeast.onrender.com";

type LoginPayload = {
  email: string;
  senha: string;
};

type RegisterPayload = {
  email: string;
  nome: string;
  senha: string;
};

type CreateFeralPayload = {
  nome: string;
  titulo: string | null;
  especialidade: string | null;
  imagem_url: string | null;
  vigor_max: number;
  vigor_atual: number;
  voce_e: string | null;
  tenta_ser: string | null;
  feras_familiares: string | null;
  prato_tipico: string | null;
  tempero_tipico: string | null;
  infancia_criacao: string | null;
  iniciacao_como_feral: string | null;
  ambicao: string | null;
  conexao: string | null;
};

type SessionBody =
  | { action: "login"; payload: LoginPayload }
  | { action: "register"; payload: RegisterPayload }
  | { action: "create-feral"; payload: CreateFeralPayload }
  | { action: "update-feral"; id: number; payload: CreateFeralPayload }
  | { token: string };

async function readApiResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (response.ok) {
    return { data, error: null };
  }

  const message =
    data && typeof data === "object" && "detail" in data
      ? String(data.detail)
      : "A API do Wilderfeast não respondeu como esperado.";

  return { data: null, error: message };
}

async function saveToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("wilderfeast_token", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as SessionBody;

  if ("action" in body && body.action === "register") {
    const response = await fetch(`${API_URL}/auth/registro`, {
      body: JSON.stringify(body.payload),
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = await readApiResponse(response);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: response.status });
    }

    return NextResponse.json(result.data, { status: response.status });
  }

  if ("action" in body && body.action === "login") {
    const form = new URLSearchParams({
      password: body.payload.senha,
      username: body.payload.email,
    });
    const response = await fetch(`${API_URL}/auth/login`, {
      body: form,
      cache: "no-store",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
    });
    const result = await readApiResponse(response);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: response.status });
    }

    const loginData = result.data as {
      access_token: string;
      token_type: "bearer";
      usuario_id: number;
    };
    await saveToken(loginData.access_token);

    return NextResponse.json({
      token_type: loginData.token_type,
      usuario_id: loginData.usuario_id,
    });
  }

  if ("action" in body && body.action === "create-feral") {
    const cookieStore = await cookies();
    const token = cookieStore.get("wilderfeast_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/feral/`, {
      body: JSON.stringify(body.payload),
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const result = await readApiResponse(response);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: response.status });
    }

    return NextResponse.json(result.data, { status: response.status });
  }

  if ("token" in body && body.token) {
    await saveToken(body.token);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Dados da sessão ausentes." }, { status: 400 });
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const resource = searchParams.get("resource");
  const id = searchParams.get("id");
  const paths: Record<string, { authenticated: boolean; path: string }> = {
    ferais: { authenticated: true, path: "/feral/meus" },
    monstros: { authenticated: false, path: "/monstro/" },
  };
  const target =
    resource === "feral" && id
      ? { authenticated: true, path: `/feral/${encodeURIComponent(id)}` }
      : resource === "monstro" && id
        ? { authenticated: false, path: `/monstro/${encodeURIComponent(id)}` }
        : resource
          ? paths[resource]
          : undefined;

  if (!target) {
    return NextResponse.json({ error: "Recurso inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("wilderfeast_token")?.value;

  if (target.authenticated && !token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }

  const response = await fetch(`${API_URL}${target.path}`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const result = await readApiResponse(response);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: response.status });
  }

  return NextResponse.json(result.data, { status: response.status });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as SessionBody;

  if (!("action" in body) || body.action !== "update-feral") {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  if (!Number.isInteger(body.id) || body.id < 1) {
    return NextResponse.json({ error: "Ficha inválida." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("wilderfeast_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }

  const response = await fetch(`${API_URL}/feral/${body.id}`, {
    body: JSON.stringify(body.payload),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
  const result = await readApiResponse(response);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: response.status });
  }

  return NextResponse.json(result.data, { status: response.status });
}

export async function DELETE(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const resource = searchParams.get("resource");
  const id = searchParams.get("id");
  const cookieStore = await cookies();
  const token = cookieStore.get("wilderfeast_token")?.value;

  if (resource === "feral") {
    if (!token) {
      return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
    }

    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Ficha inválida." }, { status: 400 });
    }

    const response = await fetch(`${API_URL}/feral/${id}`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await readApiResponse(response);
      return NextResponse.json(
        { error: result.error ?? "Não foi possível excluir a ficha." },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true });
  }

  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
    }).catch(() => undefined);
  }

  cookieStore.delete("wilderfeast_token");
  return NextResponse.json({ ok: true });
}
