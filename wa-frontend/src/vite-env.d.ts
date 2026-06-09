interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_TIMEOUT_LIMIT: string; // Nilai dari .env selalu dibaca sebagai string
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}