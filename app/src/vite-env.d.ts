/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** release tag, set by .github/workflows/deploy.yml; unset in local builds */
  readonly VITE_APP_VERSION?: string;
}
