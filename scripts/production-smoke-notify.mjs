import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MOSHI_WEBHOOK_URL = "https://api.getmoshi.app/api/webhook";

const githubRunUrl = (env) => {
  const serverUrl = (env.GITHUB_SERVER_URL || "https://github.com").replace(
    /\/+$/,
    "",
  );
  const repository = env.GITHUB_REPOSITORY || "unknown/unknown";
  const runId = env.GITHUB_RUN_ID || "unknown";
  return `${serverUrl}/${repository}/actions/runs/${runId}`;
};

export const notifySmokeFailure = async ({
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) => {
  const token = env.MOSHI_WEBHOOK_TOKEN;
  if (!token) {
    return {
      ok: false,
      error: "MOSHI_WEBHOOK_TOKEN is not configured",
    };
  }

  const payload = {
    token,
    title: "ground.codes smoke failed",
    message: `Production smoke failed on ${env.GITHUB_REF_NAME || "unknown ref"}. Run: ${githubRunUrl(env)}`,
  };

  let response;
  try {
    response = await fetchImpl(MOSHI_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      ok: false,
      error: "Moshi notification request failed",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `Moshi notification failed with HTTP ${response.status}`,
    };
  }

  return { ok: true };
};

export const runNotificationCli = async ({
  env = process.env,
  fetchImpl = globalThis.fetch,
  writeError = (message) => console.error(message),
  writeOutput = (message) => console.log(message),
} = {}) => {
  const result = await notifySmokeFailure({ env, fetchImpl });
  if (!result.ok) {
    writeError(result.error);
    return 1;
  }

  writeOutput("Moshi smoke failure notification delivered");
  return 0;
};

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  process.exitCode = await runNotificationCli();
}
