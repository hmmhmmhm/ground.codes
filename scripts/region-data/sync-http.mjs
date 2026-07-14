import { Readable } from "node:stream";

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const discardBody = async (response) => {
  try {
    await response.body?.cancel();
  } catch {}
};

const retryableStatus = (status) => status === 429 || status >= 500;
const retryableNetworkError = (error) => {
  const code = error?.code ?? error?.cause?.code;
  return (
    [
      "ECONNRESET",
      "ECONNREFUSED",
      "EPIPE",
      "ETIMEDOUT",
      "UND_ERR_CONNECT_TIMEOUT",
      "UND_ERR_SOCKET",
    ].includes(code) ||
    (error?.name === "TypeError" &&
      /fetch failed|network|socket|terminated/i.test(error.message))
  );
};

export const requestWithRetry = async (
  url,
  consume,
  { attempts = 3, retryDelayMs = 100, fetchImpl = globalThis.fetch } = {},
) => {
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 10) {
    throw new TypeError("HTTP attempts must be an integer between 1 and 10");
  }
  if (
    !Number.isSafeInteger(retryDelayMs) ||
    retryDelayMs < 0 ||
    retryDelayMs > 10_000
  ) {
    throw new TypeError("retryDelayMs must be between 0 and 10000");
  }
  if (typeof fetchImpl !== "function" || typeof consume !== "function") {
    throw new TypeError("HTTP fetch and consume implementations are required");
  }

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { accept: "application/octet-stream" },
        redirect: "error",
      });
    } catch (error) {
      if (!retryableNetworkError(error)) throw error;
      lastError = error;
      if (attempt === attempts) break;
      await sleep(Math.min(retryDelayMs * 2 ** (attempt - 1), 1_000));
      continue;
    }
    if (response.ok) {
      try {
        return await consume(response);
      } catch (error) {
        if (!retryableNetworkError(error) || attempt === attempts) throw error;
        lastError = error;
        await discardBody(response);
        await sleep(Math.min(retryDelayMs * 2 ** (attempt - 1), 1_000));
        continue;
      }
    }
    if (!retryableStatus(response.status) || attempt === attempts) {
      await discardBody(response);
      throw new TypeError(`HTTP ${response.status} for ${url.pathname}`);
    }
    await discardBody(response);
    await sleep(Math.min(retryDelayMs * 2 ** (attempt - 1), 1_000));
  }
  throw new TypeError(
    `network request failed for ${url.pathname}: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
};

export const readResponseBytes = async (
  response,
  label,
  { maximumBytes = 16 * 1024 * 1024 } = {},
) => {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    await discardBody(response);
    throw new TypeError(`${label} exceeds ${maximumBytes} bytes`);
  }
  if (!response.body) throw new TypeError(`${label} response has no body`);
  const chunks = [];
  let total = 0;
  for await (const chunk of Readable.fromWeb(response.body)) {
    total += chunk.length;
    if (total > maximumBytes) {
      throw new TypeError(`${label} exceeds ${maximumBytes} bytes`);
    }
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks, total);
  if (bytes.length === 0) throw new TypeError(`${label} response is empty`);
  return bytes;
};
