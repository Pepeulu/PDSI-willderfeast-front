import type { Descricao, ItemInventario, Utensilio } from "@/lib/api";

export function estilosIniciais(
  [primeiro, segundo]: [string, string],
  escolhido?: string | null,
) {
  const restantes = ["Poderoso", "Preciso", "Ligeiro", "Capcioso"]
    .filter((estilo) => estilo !== primeiro && estilo !== segundo)
    .map((estilo) => `1 ${estilo}`);
  if (escolhido === primeiro || escolhido === segundo) {
    const outro = escolhido === primeiro ? segundo : primeiro;
    return `3 ${escolhido}, 2 ${outro}, ${restantes.join(" e ")}.`;
  }
  return `3 ${primeiro} e 2 ${segundo} ou 3 ${segundo} e 2 ${primeiro}. Em ambos os casos, ${restantes.join(" e ")}.`;
}

export function alcanceAtual(utensilio: Utensilio, item?: ItemInventario) {
  return utensilio.estilos_principais && item?.durabilidade_atual === 0
    ? "1 (Golpe)"
    : utensilio.alcance;
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function correspondeABusca(
  utensilio: Utensilio,
  busca: string,
  tecnicasDoItem: Descricao[] = [],
) {
  const campos = [
    utensilio.nome,
    utensilio.alcance,
    utensilio.estilos_principais &&
      estilosIniciais(utensilio.estilos_principais),
    ...utensilio.tecnicas.concat(tecnicasDoItem).map((t) => t.nome),
  ];
  return normalizar(campos.join(" ")).includes(normalizar(busca));
}
