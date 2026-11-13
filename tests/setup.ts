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
