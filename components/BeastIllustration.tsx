import imagensCloudinary from "@/lib/imagens-cloudinary.json";
import ilustracoes from "@/lib/ilustracoes-bestiario.json";

const arquivos = new Map(Object.entries(ilustracoes));
const imagens: Record<string, string | undefined> = imagensCloudinary.bestiario;
const nomesAlternativos = new Map([
  ["sposus", "sposu"],
  ["votra-enxame", "votra"],
]);

export default function BeastIllustration({
  nome,
  imagemUrl,
  destaque = false,
}: {
  nome: string;
  imagemUrl?: string | null;
  destaque?: boolean;
}) {
  const nomeNormalizado = nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
  const arquivo = arquivos.get(
    nomesAlternativos.get(nomeNormalizado) ?? nomeNormalizado,
  );

  const imagem = imagemUrl?.trim() || (arquivo && imagens[arquivo]);

  return imagem ? (
    <img
      className="beast-art"
      src={imagem}
      alt={`Ilustração de ${nome}`}
      loading={destaque ? "eager" : "lazy"}
    />
  ) : (
    <span className="beast-art-placeholder">Ilustração indisponível</span>
  );
}
