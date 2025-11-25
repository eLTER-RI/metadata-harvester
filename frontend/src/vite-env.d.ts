interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
