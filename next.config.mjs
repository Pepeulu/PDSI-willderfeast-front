/** @file Configuração de build e desenvolvimento do Next.js. */

/** Detecta projetos em pastas sincronizadas pelo OneDrive no Windows. */
const runningInsideWindowsOneDrive =
  process.platform === "win32" &&
  process.cwd().toLocaleLowerCase().includes("\\onedrive\\");

/**
 * Usa um diretório dedicado ao cache local do Next em projetos no OneDrive.
 * É possível apontar `.next-local` para uma pasta fora da sincronização por meio de uma junção do Windows.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  distDir: runningInsideWindowsOneDrive ? ".next-local" : ".next",
};

export default nextConfig;
