export const runExpandedSmokeChecks = async ({
  smoke,
  assert,
  fetchText,
  postJson,
  postJsonBody,
  apiBaseUrl,
  webBaseUrl,
  validateMetricsSnapshot,
}) => {
  await smoke.check("Indonesian Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "indonesian",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Indonesian Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Thai Bangkok encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 13.7563,
      lng: 100.5018,
      language: "thai",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^กรุงเทพมหานคร-/.test(code),
      `expected Thai Bangkok code, got ${code}`,
    );
  });

  await smoke.check("Vietnamese Hanoi encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 21.0278,
      lng: 105.8342,
      language: "vietnamese",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Hà Nội-/.test(code),
      `expected Vietnamese Hanoi code, got ${code}`,
    );
  });

  await smoke.check("Hindi Delhi encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 28.65195,
      lng: 77.23149,
      language: "hindi",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^दिल्ली-/.test(code), `expected Hindi Delhi code, got ${code}`);
  });

  await smoke.check("Arabic Cairo encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 30.0444,
      lng: 31.2357,
      language: "arabic",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^القاهرة-/.test(code), `expected Arabic Cairo code, got ${code}`);
  });

  await smoke.check("Russian Moscow encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 55.7558,
      lng: 37.6173,
      language: "russian",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Москва-/.test(code), `expected Russian Moscow code, got ${code}`);
  });

  await smoke.check("Swahili Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "swahili",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Swahili Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Filipino Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "filipino",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Filipino Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Hausa Cairo encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 30.0444,
      lng: 31.2357,
      language: "hausa",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Alkahira-/.test(code), `expected Hausa Cairo code, got ${code}`);
  });

  await smoke.check("Bengali Delhi encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 28.65195,
      lng: 77.23149,
      language: "bengali",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^দিল্লি-/.test(code), `expected Bengali Delhi code, got ${code}`);
  });

  await smoke.check("Urdu Delhi encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 28.65195,
      lng: 77.23149,
      language: "urdu",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^دہلی-/.test(code), `expected Urdu Delhi code, got ${code}`);
  });

  await smoke.check("Amharic Cairo encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 30.0444,
      lng: 31.2357,
      language: "amharic",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^ካይሮ-/.test(code), `expected Amharic Cairo code, got ${code}`);
  });

  await smoke.check("Burmese Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "burmese",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^ဂျာကာတာ-/.test(code),
      `expected Burmese Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Khmer Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "khmer",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^ចាការតា-/.test(code), `expected Khmer Jakarta code, got ${code}`);
  });

  await smoke.check("Nepali Delhi encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 28.65195,
      lng: 77.23149,
      language: "nepali",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^दिल्ली-/.test(code), `expected Nepali Delhi code, got ${code}`);
  });

  await smoke.check("Somali Cairo encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 30.0444,
      lng: 31.2357,
      language: "somali",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Qaahira-/.test(code), `expected Somali Cairo code, got ${code}`);
  });

  await smoke.check("Pashto Delhi encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 28.65195,
      lng: 77.23149,
      language: "pashto",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^ډیلي-/.test(code), `expected Pashto Delhi code, got ${code}`);
  });

  await smoke.check("Lingala Cairo encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 30.0444,
      lng: 31.2357,
      language: "lingala",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Kairo-/.test(code), `expected Lingala Cairo code, got ${code}`);
  });
};
