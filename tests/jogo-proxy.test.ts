// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { GET, PATCH, POST, PUT } from "@/app/api/jogo/[...path]/route";
import { API_URL } from "@/lib/api-origin";

const cookie = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookie }) }));
const rede = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", rede.mockReset());
  cookie.mockReturnValue({ value: "sessao" });
});
function enviar(method: string, path: string, body?: string) {
  const handle = { GET, POST, PUT, PATCH }[
    method as "GET" | "POST" | "PUT" | "PATCH"
  ];
  return handle(
    new Request("http://localhost/api/jogo/" + path, { method, body }),
    { params: Promise.resolve({ path: path.split("/") }) },
  );
}
it.each([
  ["GET", "utensilio", "/utensilio/"],
  ["GET", "feral/3/inventario", "/feral/3/inventario"],
  ["GET", "feral/3/itens-encontrados", "/feral/3/itens-encontrados"],
  ["POST", "feral/3/itens-encontrados", "/feral/3/itens-encontrados"],
  ["PUT", "feral/3/itens-encontrados/2", "/feral/3/itens-encontrados/2"],
  ["PATCH", "feral/3/itens-encontrados/2", "/feral/3/itens-encontrados/2"],
  ["GET", "feral/3/atributos", "/feral/3/atributos"],
  ["PUT", "feral/3/inventario/2", "/feral/3/inventario/2"],
  ["PUT", "feral/3/inventario/2/estilo", "/feral/3/inventario/2/estilo"],
])("encaminha %s %s e preserva o status", async (method, path, destino) => {
  const body = method === "GET" ? undefined : '{"valor":1}';
  const status = method === "POST" ? 201 : 200;
  rede.mockResolvedValue(new Response("[]", { status }));
  const res = await enviar(method, path, body);
  expect(res.status).toBe(status);
  expect(await res.text()).toBe("[]");
  expect(rede).toHaveBeenCalledWith(
    API_URL + destino,
    expect.objectContaining({
      method,
      body,
      headers: expect.objectContaining({
        Authorization: "Bearer sessao",
        "Content-Type": "application/json",
      }),
    }),
  );
});
it("recusa recurso, método e sessão inválidos antes de encaminhar", async () => {
  expect((await enviar("GET", "feral/0/inventario")).status).toBe(404);
  expect((await enviar("PUT", "feral/2/inventario")).status).toBe(405);
  cookie.mockReturnValue(undefined);
  expect((await enviar("GET", "utensilio")).status).toBe(401);
  expect(rede).not.toHaveBeenCalled();
});
it("preserva a resposta sem corpo ao remover um item", async () => {
  rede.mockResolvedValue(new Response(null, { status: 204 }));
  const resposta = await enviar(
    "PATCH",
    "feral/3/itens-encontrados/2",
    '{"variacao":-1}',
  );
  expect(resposta.status).toBe(204);
  expect(await resposta.text()).toBe("");
});
it("encaminha o corpo binário do upload com a sessão", async () => {
  const bytes = new Uint8Array([255, 216, 255]);
  rede.mockImplementation(async (_url, opcoes) => {
    expect(opcoes?.headers).toEqual({
      Authorization: "Bearer sessao",
      "Content-Type": "application/octet-stream",
    });
    expect(
      new Uint8Array(await new Response(opcoes?.body).arrayBuffer()),
    ).toEqual(bytes);
    return Response.json(
      { url: "https://res.cloudinary.test/feral.jpg" },
      { status: 201 },
    );
  });
  const resposta = await POST(
    new Request("http://localhost/api/jogo/imagens/feral", {
      method: "POST",
      body: bytes,
    }),
    {
      params: Promise.resolve({ path: ["imagens", "feral"] }),
    },
  );
  expect(resposta.status).toBe(201);
  expect(rede).toHaveBeenCalledWith(
    API_URL + "/imagens/feral",
    expect.objectContaining({ method: "POST", duplex: "half" }),
  );
});
it("preserva erros da API e identifica falha de conexão", async () => {
  rede
    .mockResolvedValueOnce(
      Response.json({ detail: "Feral não encontrado." }, { status: 404 }),
    )
    .mockResolvedValueOnce(new Response("indisponível", { status: 503 }))
    .mockRejectedValueOnce(new Error("rede"));
  expect(await (await enviar("GET", "feral/2/atributos")).json()).toEqual({
    error: "Feral não encontrado.",
  });
  expect((await enviar("GET", "utensilio")).status).toBe(503);
  expect((await enviar("GET", "utensilio")).status).toBe(502);
});
