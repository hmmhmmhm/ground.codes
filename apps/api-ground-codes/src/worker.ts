import { createApp } from "./app.js";
import { installPostgisRegionStore } from "./postgis-region-store.js";

export interface Env {
  HYPERDRIVE?: {
    connectionString: string;
  };
  API_RUNTIME_TAG?: string;
  GIT_COMMIT_SHA?: string;
  SUPABASE_DB_URL?: string;
  CORS_ORIGINS?: string;
}

const app = createApp();
let installedConnectionString: string | null = null;

const installRegionStoreFromEnv = (env: Env) => {
  const connectionString =
    env.HYPERDRIVE?.connectionString ?? env.SUPABASE_DB_URL;
  if (!connectionString || connectionString === installedConnectionString) {
    return;
  }

  installPostgisRegionStore(connectionString);
  installedConnectionString = connectionString;
};

const installRuntimeMetadataFromEnv = (env: Env) => {
  if (env.API_RUNTIME_TAG) {
    process.env.API_RUNTIME_TAG = env.API_RUNTIME_TAG;
  }
  if (env.GIT_COMMIT_SHA) {
    process.env.GIT_COMMIT_SHA = env.GIT_COMMIT_SHA;
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    installRuntimeMetadataFromEnv(env);
    installRegionStoreFromEnv(env);
    return await app.handle(request);
  },
};
