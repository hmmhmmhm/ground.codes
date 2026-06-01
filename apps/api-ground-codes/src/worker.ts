import { createApp } from "./app.js";
import { installPostgisRegionStore } from "./postgis-region-store.js";

export interface Env {
  HYPERDRIVE?: {
    connectionString: string;
  };
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    installRegionStoreFromEnv(env);
    return await app.handle(request);
  },
};
