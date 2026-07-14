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

const installRuntimeMetadataFromEnv = (env: Env) => {
  if (env.API_RUNTIME_TAG) {
    process.env.API_RUNTIME_TAG = env.API_RUNTIME_TAG;
  }
  if (env.GIT_COMMIT_SHA) {
    process.env.GIT_COMMIT_SHA = env.GIT_COMMIT_SHA;
  }
};

interface WorkerApplication {
  handle(request: Request): Response | Promise<Response>;
}

interface WorkerDependencies {
  createApplication?: () => WorkerApplication;
  installRegionStore?: (connectionString: string) => void;
  installRuntimeMetadata?: (env: Env) => void;
}

export const createWorker = ({
  createApplication = createApp,
  installRegionStore = installPostgisRegionStore,
  installRuntimeMetadata = installRuntimeMetadataFromEnv,
}: WorkerDependencies = {}) => {
  let app: WorkerApplication | undefined;
  let installedConnectionString: string | null = null;

  return {
    async fetch(request: Request, env: Env): Promise<Response> {
      installRuntimeMetadata(env);

      const connectionString =
        env.HYPERDRIVE?.connectionString ?? env.SUPABASE_DB_URL;
      if (connectionString && connectionString !== installedConnectionString) {
        installRegionStore(connectionString);
        installedConnectionString = connectionString;
      }

      app ??= createApplication();
      return await app.handle(request);
    },
  };
};

export default createWorker();
