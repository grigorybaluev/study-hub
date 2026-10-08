/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** release tag, set by .github/workflows/deploy.yml; unset in local builds */
  readonly VITE_APP_VERSION?: string;
}

/** The build (#215): `git describe` and when it was built, ISO; set in vite.config.ts. */
declare const __BUILD__: { version: string; built: string };
