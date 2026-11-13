// @vitest-environment node

import { beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

it.each([
  ["win32", "C:\\Users\\dev\\ONEDRIVE\\Projeto", ".next-local"],
  ["win32", "C:\\Users\\dev\\Projeto", ".next"],
  ["linux", "/home/dev/projeto", ".next"],
])("configura o diretório de build em %s para %s", async (platform, cwd, distDir) => {
  vi.stubGlobal("process", { ...process, platform, cwd: () => cwd });

  const { default: config } = await import("../next.config.mjs");

  expect(config.distDir).toBe(distDir);
});
