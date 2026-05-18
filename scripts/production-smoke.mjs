const apiBaseUrl = (
  process.env.GROUND_CODES_API_URL ?? "https://api.ground.codes"
).replace(/\/+$/, "");
const webBaseUrl = (
  process.env.GROUND_CODES_WEB_URL ?? "https://ground.codes"
).replace(/\/+$/, "");

const failures = [];

const check = async (name, run) => {
  try {
    await run();
    console.log(`ok ${name}`);
  } catch (error) {
    failures.push(
      `${name}: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(`not ok ${name}`);
    console.error(error);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fetchText = async (url, init) => {
  const response = await fetch(url, init);
  const text = await response.text();
  assert(response.ok, `${url} returned ${response.status}: ${text}`);
  return text;
};

const postJson = async (path, body) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  assert(response.ok, `${path} returned ${response.status}: ${text}`);
  return text;
};

const postJsonBody = async (path, body) =>
  JSON.parse(await postJson(path, body));

await check("API readiness", async () => {
  const text = await fetchText(`${apiBaseUrl}/readyz`);
  const ready = JSON.parse(text);
  assert(
    ready.status === "ready",
    `unexpected readiness: ${JSON.stringify(ready)}`,
  );
});

await check("Earth Seoul encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 37.566,
    lng: 126.978,
    language: "english",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Seoul-/.test(code), `expected Seoul code, got ${code}`);
});

await check("ASCII earth region data", async () => {
  const code = await postJson("/v1/encode", {
    lat: -82,
    lng: -63,
    language: "english",
    regionLevel: 2,
    body: "earth",
  });
  assert(
    code === "Mollereisstrom-Alder",
    `expected Mollereisstrom-Alder, got ${code}`,
  );
});

await check("ASCII region search", async () => {
  const result = await postJsonBody("/v1/search", {
    query: "Mollereisstrom",
    language: "english",
    regionLevel: 3,
    body: "earth",
    maxResults: 1,
  });
  assert(
    result.results?.[0]?.label === "Mollereisstrom",
    `unexpected search result: ${JSON.stringify(result)}`,
  );
});

await check("Moon encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 8.35,
    lng: 30.84,
    language: "english",
    regionLevel: 2,
    body: "moon",
  });
  assert(
    /^Mare Tranquillitatis-/.test(code),
    `expected Moon code, got ${code}`,
  );
});

await check("Mars encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 18.6528,
    lng: -133.8025,
    language: "english",
    regionLevel: 2,
    body: "mars",
  });
  assert(/^Olympus Mons-/.test(code), `expected Mars code, got ${code}`);
});

await check("Undecodable code is a client error", async () => {
  const response = await fetch(`${apiBaseUrl}/v1/decode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "Seoul-notrealcode",
      language: "english",
      regionLevel: 2,
    }),
  });
  const body = await response.json();
  assert(response.status === 400, `expected 400, got ${response.status}`);
  assert(
    body.error?.code === "INVALID_INPUT",
    `unexpected body: ${JSON.stringify(body)}`,
  );
});

await check("Missing region info is not a server error", async () => {
  const response = await fetch(`${apiBaseUrl}/v1/region/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "not-a-real-region",
      language: "english",
      regionLevel: 2,
      body: "earth",
    }),
  });
  const body = await response.json();
  assert(response.status === 404, `expected 404, got ${response.status}`);
  assert(
    body.error?.code === "NOT_FOUND",
    `unexpected body: ${JSON.stringify(body)}`,
  );
});

await check("Unsupported route is not a server error", async () => {
  const response = await fetch(`${apiBaseUrl}/v1/encode`);
  const body = await response.json();
  assert(response.status === 404, `expected 404, got ${response.status}`);
  assert(
    body.error?.code === "NOT_FOUND",
    `unexpected body: ${JSON.stringify(body)}`,
  );
});

await check("Web robots", async () => {
  const robots = await fetchText(`${webBaseUrl}/robots.txt`);
  assert(robots.includes("Sitemap:"), "robots.txt does not include a sitemap");
});

await check("Web sitemap", async () => {
  const sitemap = await fetchText(`${webBaseUrl}/sitemap.xml`);
  assert(
    sitemap.includes("<loc>https://ground.codes</loc>"),
    "sitemap missing root URL",
  );
});

if (failures.length > 0) {
  console.error(`Production smoke failed with ${failures.length} failure(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production smoke passed.");
