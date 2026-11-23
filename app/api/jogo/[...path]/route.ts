import { cookies } from "next/headers";
import { API_URL } from "@/lib/api-origin";

const rotas = [
  { path: /^imagens\/feral$/, methods: ["POST"] },
  { path: /^utensilio$/, methods: ["GET"] },
  { path: /^feral\/[1-9]\d*\/atributos$/, methods: ["GET", "PUT"] },
  { path: /^feral\/[1-9]\d*\/inventario$/, methods: ["GET"] },
  { path: /^feral\/[1-9]\d*\/itens-encontrados$/, methods: ["GET", "POST"] },
  {
    path: /^feral\/[1-9]\d*\/itens-encontrados\/[1-9]\d*$/,
    methods: ["PUT", "PATCH"],
  },
  {
    path: /^feral\/[1-9]\d*\/inventario\/[1-9]\d*(?:\/estilo)?$/,
    methods: ["PUT"],
  },
];

async function encaminhar(
  req: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const path = (await context.params).path.join("/");
  const rota = rotas.find((rota) => rota.path.test(path));
  if (!rota)
    return Response.json({ error: "Recurso inválido." }, { status: 404 });
  if (!rota.methods.includes(req.method))
    return Response.json(
      { error: "Método inválido." },
      { status: 405, headers: { Allow: rota.methods.join(", ") } },
    );
  const token = (await cookies()).get("wilderfeast_token")?.value;
  if (!token)
    return Response.json({ error: "Sessão não encontrada." }, { status: 401 });

  try {
    const upload = path === "imagens/feral";
    const opcoesUpload = upload ? { duplex: "half" } : {};
    const response = await fetch(
      `${API_URL}/${path}${path === "utensilio" ? "/" : ""}`,
      {
        method: req.method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": upload
            ? "application/octet-stream"
            : "application/json",
        },
        cache: "no-store",
        body: upload
          ? req.body
          : req.method !== "GET"
            ? await req.text()
            : undefined,
        ...opcoesUpload,
      },
    );
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const error =
        typeof data?.detail === "string"
          ? data.detail
          : "A API não conseguiu concluir a solicitação.";
      return Response.json({ error }, { status: response.status });
    }
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { error: "Não foi possível conectar à API." },
      { status: 502 },
    );
  }
}

export {
  encaminhar as GET,
  encaminhar as PUT,
  encaminhar as POST,
  encaminhar as PATCH,
};
