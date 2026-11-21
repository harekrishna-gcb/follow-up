/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Apps Script Web App URL (ending in /exec), or "mock" for the in-browser demo backend. */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
