export const runAdditionalLatinSmokeChecks = async ({
  smoke,
  assert,
  fetchText,
  postJson,
  postJsonBody,
  apiBaseUrl,
  webBaseUrl,
  validateMetricsSnapshot,
}) => {
  await smoke.check("Quechua Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "quechua",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Quechua Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Aymara Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "aymara",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Aymara Jakarta code, got ${code}`);
  });

  await smoke.check("Guarani Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "guarani",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Guarani Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Kongo Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "kongo",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Kongo Jakarta code, got ${code}`);
  });

  await smoke.check("Zarma Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "zarma",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Zarma Jakarta code, got ${code}`);
  });

  await smoke.check("Tamasheq Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "tamasheq",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Tamasheq Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Songhay Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "songhay",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Songhay Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Twi Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "twi",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Twi Jakarta code, got ${code}`);
  });

  await smoke.check("Dagbanli Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "dagbani",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Dagbanli Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Luganda Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "luganda",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Luganda Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Acholi Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "acholi",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Acholi Jakarta code, got ${code}`);
  });

  await smoke.check("Dinka Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "dinka",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Dinka Jakarta code, got ${code}`);
  });

  await smoke.check("Nuer Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "nuer",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Jakarta-/.test(code), `expected Nuer Jakarta code, got ${code}`);
  });

  await smoke.check("chiShona Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "shona",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected chiShona Jakarta code, got ${code}`,
    );
  });

  await smoke.check("isiNdebele Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "ndebele",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected isiNdebele Jakarta code, got ${code}`,
    );
  });

  await smoke.check("Tok Pisin Jakarta encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "tok_pisin",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^Jakarta-/.test(code),
      `expected Tok Pisin Jakarta code, got ${code}`,
    );
  });
};
