const runningInsideWindowsOneDrive =
  process.platform === "win32" &&
  process.cwd().toLocaleLowerCase().includes("\\onedrive\\");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // O OneDrive transforma arquivos do cache do Next em reparse points e causa
  // EINVAL/ENOTDIR no Windows. Localmente o build fica fora da pasta sincronizada;
  // na Vercel e nos demais ambientes o diretório padrão continua sendo usado.
  distDir: runningInsideWindowsOneDrive ? ".next-local" : ".next",
};

export default nextConfig;
