/** Isola o DOM, o armazenamento local e as substituições de cada teste. */
import { afterEach, vi } from "vitest";

if (typeof document !== "undefined") {
  const { cleanup } = await import("@testing-library/react");

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
