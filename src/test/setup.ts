import "@testing-library/jest-dom";
import { Buffer } from "buffer";

// jsdom does not provide a Node-compatible Buffer; @solana/web3.js relies on
// it for PDA seed encoding. Ensure the global matches the app runtime, which
// polyfills Buffer via the `buffer` package (see vite optimizeDeps).
globalThis.Buffer = globalThis.Buffer ?? Buffer;

// Only applies in the jsdom environment; node-environment test files skip it.
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}
