export const runOperationsSmokeChecks = async ({
  smoke,
  assert,
  fetchText,
  postJson,
  postJsonBody,
  apiBaseUrl,
  webBaseUrl,
  validateMetricsSnapshot,
}) => {
  await smoke.check("ASCII earth region data", async () => {
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

  await smoke.check("ASCII region search", async () => {
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

  await smoke.check("Biased region search", async () => {
    const result = await postJsonBody("/v1/search", {
      query: "Springfield",
      language: "english",
      regionLevel: 2,
      body: "earth",
      maxResults: 1,
      biasLat: 42.1,
      biasLng: -72.6,
    });
    assert(
      result.results?.[0]?.label === "West Springfield",
      `unexpected biased search result: ${JSON.stringify(result)}`,
    );
  });

  await smoke.check("Moon encode", async () => {
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

  await smoke.check("Mars encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 18.6528,
      lng: -133.8025,
      language: "english",
      regionLevel: 2,
      body: "mars",
    });
    assert(/^Olympus Mons-/.test(code), `expected Mars code, got ${code}`);
  });

  await smoke.check("Undecodable code is a client error", async () => {
    const response = await fetchWithRetry(`${apiBaseUrl}/v1/decode`, {
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

  await smoke.check("Missing region info is not a server error", async () => {
    const response = await fetchWithRetry(`${apiBaseUrl}/v1/region/info`, {
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

  await smoke.check("Unsupported route is not a server error", async () => {
    const response = await fetchWithRetry(`${apiBaseUrl}/v1/encode`);
    const body = await response.json();
    assert(response.status === 404, `expected 404, got ${response.status}`);
    assert(
      body.error?.code === "NOT_FOUND",
      `unexpected body: ${JSON.stringify(body)}`,
    );
  });

  await smoke.check("API metrics snapshot", async () => {
    const metrics = JSON.parse(await fetchText(`${apiBaseUrl}/metrics`));
    assert(
      metrics.service === "api-ground-codes",
      `unexpected metrics service: ${metrics.service}`,
    );
    const errors = validateMetricsSnapshot(metrics);
    assert(
      errors.length === 0,
      `invalid metrics snapshot: ${errors.join("; ")}`,
    );
  });

  await smoke.check("Web robots", async () => {
    const robots = await fetchText(`${webBaseUrl}/robots.txt`);
    assert(
      robots.includes("Sitemap:"),
      "robots.txt does not include a sitemap",
    );
  });

  await smoke.check("Web sitemap", async () => {
    const sitemap = await fetchText(`${webBaseUrl}/sitemap.xml`);
    assert(
      sitemap.includes("<loc>https://ground.codes</loc>"),
      "sitemap missing root URL",
    );
  });
};
