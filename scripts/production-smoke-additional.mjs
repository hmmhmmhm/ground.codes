export const runAdditionalSmokeChecks = async ({
  smoke,
  assert,
  fetchText,
  postJson,
  postJsonBody,
  apiBaseUrl,
  webBaseUrl,
  validateMetricsSnapshot,
}) => {
  await smoke.check("Mongolian Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "mongolian",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Жакарта-/.test(code),
      `expected Mongolian Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Lao Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "lao",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^ຈາກາຕາ-/.test(code), `expected Lao Jakarta code, got ${code}`);
  });

  await smoke.check("Malagasy Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "malagasy",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Malagasy Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Dari Delhi encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 28.65195,
      lng: 77.23149,
      language: "dari",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^دهلی-/.test(code), `expected Dari Delhi code, got ${code}`);
  });

  await smoke.check("Oromo Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "oromo",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Oromo Jakarta code, got ${code}`);
  });

  await smoke.check("Chichewa Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "chichewa",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Chichewa Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Tigrinya Cairo encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 30.0444,
      lng: 31.2357,
      language: "tigrinya",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^ካይሮ-/.test(code), `expected Tigrinya Cairo code, got ${code}`);
  });

  await smoke.check("Bambara Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "bambara",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Bambara Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Fula Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "fula",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Fula Jakarta code, got ${code}`);
  });

  await smoke.check("Wolof Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "wolof",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Wolof Jakarta code, got ${code}`);
  });

  await smoke.check("Sinhala Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "sinhala",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^ජකර්තා-/.test(code), `expected Sinhala Jakarta code, got ${code}`);
  });

  await smoke.check("Tamil Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "tamil",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^ஜகார்த்தா-/.test(code),
      `expected Tamil Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Kinyarwanda Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "kinyarwanda",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Kinyarwanda Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Kirundi Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "kirundi",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Kirundi Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Krio Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "krio",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Krio Jakarta code, got ${code}`);
  });

  await smoke.check("Ewe Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "ewe",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Ewe Jakarta code, got ${code}`);
  });

  await smoke.check("Fon Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "fon",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Fon Jakarta code, got ${code}`);
  });

  await smoke.check("Sango Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "sango",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Sango Jakarta code, got ${code}`);
  });

  await smoke.check("Mooré Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "moore",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Mooré Jakarta code, got ${code}`);
  });

  await smoke.check("Kanuri Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "kanuri",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Kanuri Jakarta code, got ${code}`);
  });
};
