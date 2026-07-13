export const runCoreSmokeChecks = async ({
  smoke,
  assert,
  fetchText,
  postJson,
  postJsonBody,
  apiBaseUrl,
  webBaseUrl,
  validateMetricsSnapshot,
}) => {
  await smoke.check("API readiness", async () => {
    const text = await fetchText(`${apiBaseUrl}/readyz`);
    const ready = JSON.parse(text);
    assert(
      ready.status === "ready",
      `unexpected readiness: ${JSON.stringify(ready)}`,
    );
    assert(
      ready.service === "api-ground-codes",
      `unexpected service: ${JSON.stringify(ready)}`,
    );
    assert(
      typeof ready.runtimeTag === "string" &&
        (ready.runtimeTag === "workspace" || ready.runtimeTag === "unknown"),
      `missing runtime tag: ${JSON.stringify(ready)}`,
    );
    assert(
      /^[0-9a-f]{40}$/.test(ready.runtimeCommit),
      `missing runtime commit: ${JSON.stringify(ready)}`,
    );
  });

  await smoke.check("API docs root", async () => {
    const text = await fetchText(`${apiBaseUrl}/`);
    assert(
      text.includes("Ground Codes API") && text.includes("/v1/encode"),
      `unexpected API docs root: ${text.slice(0, 120)}`,
    );
  });

  await smoke.check("Earth Seoul encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "english",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Seoul-/.test(code), `expected Seoul code, got ${code}`);
  });

  await smoke.check("Korean Seoul encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "korean",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^서울-/.test(code), `expected Korean Seoul code, got ${code}`);
  });

  await smoke.check("Chinese Seoul encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "chinese",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^首尔-/.test(code), `expected Chinese Seoul code, got ${code}`);
  });

  await smoke.check("Japanese Seoul encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "japanese",
      regionLevel: 2,
      body: "earth",
    });
    assert(
      /^セオウル-/.test(code),
      `expected Japanese Seoul code, got ${code}`,
    );
  });

  await smoke.check("Spanish Seoul encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "spanish",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Seul-/.test(code), `expected Spanish Seoul code, got ${code}`);
  });

  await smoke.check("French Seoul encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "french",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Seoul-/.test(code), `expected French Seoul code, got ${code}`);
  });

  await smoke.check("German Seoul encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "german",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Seoul-/.test(code), `expected German Seoul code, got ${code}`);
  });

  await smoke.check("Portuguese Seoul encode", async () => {
    const code = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "portuguese",
      regionLevel: 2,
      body: "earth",
    });
    assert(/^Seul-/.test(code), `expected Portuguese Seoul code, got ${code}`);
  });

  for (const { label, language } of [
    { label: "Turkish", language: "turkish" },
    { label: "Italian", language: "italian" },
    { label: "Dutch", language: "dutch" },
    { label: "Polish", language: "polish" },
    { label: "Ukrainian", language: "ukrainian" },
    { label: "Romanian", language: "romanian" },
    { label: "Czech", language: "czech" },
    { label: "Greek", language: "greek" },
    { label: "Swedish", language: "swedish" },
    { label: "Hungarian", language: "hungarian" },
    { label: "Danish", language: "danish" },
  ]) {
    await smoke.check(`${label} Seoul encode`, async () => {
      const code = await postJson("/v1/encode", {
        lat: 37.566,
        lng: 126.978,
        language,
        regionLevel: 2,
        body: "earth",
      });
      assert(/^Seoul-/.test(code), `expected ${label} Seoul code, got ${code}`);
    });
  }

  for (const { label, language } of [
    { label: "Marathi", language: "marathi" },
    { label: "Telugu", language: "telugu" },
    { label: "Gujarati", language: "gujarati" },
    { label: "Kannada", language: "kannada" },
    { label: "Malayalam", language: "malayalam" },
    { label: "Yoruba", language: "yoruba" },
    { label: "Persian", language: "persian" },
    { label: "Cantonese", language: "cantonese" },
  ]) {
    await smoke.check(`${label} Seoul encode`, async () => {
      const code = await postJson("/v1/encode", {
        lat: 37.566,
        lng: 126.978,
        language,
        regionLevel: 2,
        body: "earth",
      });
      assert(/^Seoul-/.test(code), `expected ${label} Seoul code, got ${code}`);
    });
  }

  for (const { label, language } of [
    { label: "Afar", language: "afar", prefix: "AA Seoul" },
    { label: "Abkhazian", language: "abkhazian", prefix: "AB Seoul" },
    { label: "Afrikaans", language: "afrikaans", prefix: "AF Seoul" },
    { label: "Akan", language: "akan", prefix: "AK Seoul" },
    { label: "Albanian", language: "albanian", prefix: "SQ Seoul" },
    { label: "Aragonese", language: "aragonese", prefix: "AN Seoul" },
    { label: "Armenian", language: "armenian", prefix: "HY Seoul" },
    { label: "Assamese", language: "assamese", prefix: "AS Seoul" },
    { label: "Avaric", language: "avaric", prefix: "AV Seoul" },
    { label: "Avestan", language: "avestan", prefix: "AE Seoul" },
    { label: "Azerbaijani", language: "azerbaijani", prefix: "AZ Seoul" },
    { label: "Bashkir", language: "bashkir", prefix: "BA Seoul" },
    { label: "Basque", language: "basque", prefix: "EU Seoul" },
    { label: "Belarusian", language: "belarusian", prefix: "BE Seoul" },
    { label: "Bislama", language: "bislama", prefix: "BI Seoul" },
    { label: "Bosnian", language: "bosnian", prefix: "BS Seoul" },
    { label: "Breton", language: "breton", prefix: "BR Seoul" },
    { label: "Bulgarian", language: "bulgarian", prefix: "BG Seoul" },
    { label: "Catalan", language: "catalan", prefix: "CA Seoul" },
    { label: "Chamorro", language: "chamorro", prefix: "CH Seoul" },
    { label: "Chechen", language: "chechen", prefix: "CE Seoul" },
    { label: "Church Slavic", language: "church_slavic", prefix: "CU Seoul" },
    { label: "Chuvash", language: "chuvash", prefix: "CV Seoul" },
    { label: "Cornish", language: "cornish", prefix: "KW Seoul" },
    { label: "Corsican", language: "corsican", prefix: "CO Seoul" },
    { label: "Cree", language: "cree", prefix: "CR Seoul" },
    { label: "Divehi", language: "divehi", prefix: "DV Seoul" },
    { label: "Dzongkha", language: "dzongkha", prefix: "DZ Seoul" },
    { label: "Esperanto", language: "esperanto", prefix: "EO Seoul" },
    { label: "Estonian", language: "estonian", prefix: "ET Seoul" },
    { label: "Faroese", language: "faroese", prefix: "FO Seoul" },
    { label: "Fijian", language: "fijian", prefix: "FJ Seoul" },
    { label: "Finnish", language: "finnish", prefix: "FI Seoul" },
    {
      label: "Western Frisian",
      language: "western_frisian",
      prefix: "FY Seoul",
    },
    { label: "Georgian", language: "georgian", prefix: "KA Seoul" },
    { label: "Gaelic", language: "gaelic", prefix: "GD Seoul" },
    { label: "Irish", language: "irish", prefix: "GA Seoul" },
    { label: "Galician", language: "galician", prefix: "GL Seoul" },
    { label: "Manx", language: "manx", prefix: "GV Seoul" },
    { label: "Haitian", language: "haitian", prefix: "HT Seoul" },
    { label: "Hebrew", language: "hebrew", prefix: "HE Seoul" },
    { label: "Herero", language: "herero", prefix: "HZ Seoul" },
    { label: "Hiri Motu", language: "hiri_motu", prefix: "HO Seoul" },
    { label: "Croatian", language: "croatian", prefix: "HR Seoul" },
    { label: "Igbo", language: "igbo", prefix: "IG Seoul" },
    { label: "Icelandic", language: "icelandic", prefix: "IS Seoul" },
    { label: "Ido", language: "ido", prefix: "IO Seoul" },
    { label: "Sichuan Yi", language: "sichuan_yi", prefix: "II Seoul" },
    { label: "Inuktitut", language: "inuktitut", prefix: "IU Seoul" },
    { label: "Interlingue", language: "interlingue", prefix: "IE Seoul" },
    {
      label: "Interlingua (International Auxiliary Language Association)",
      language: "interlingua",
      prefix: "IA Seoul",
    },
    { label: "Inupiaq", language: "inupiaq", prefix: "IK Seoul" },
    { label: "Javanese", language: "javanese", prefix: "JV Seoul" },
    { label: "Kalaallisut", language: "kalaallisut", prefix: "KL Seoul" },
    { label: "Kashmiri", language: "kashmiri", prefix: "KS Seoul" },
    { label: "Kazakh", language: "kazakh", prefix: "KK Seoul" },
    { label: "Kikuyu", language: "kikuyu", prefix: "KI Seoul" },
    { label: "Kirghiz", language: "kirghiz", prefix: "KY Seoul" },
    { label: "Komi", language: "komi", prefix: "KV Seoul" },
    { label: "Kuanyama", language: "kuanyama", prefix: "KJ Seoul" },
    { label: "Kurdish", language: "kurdish", prefix: "KU Seoul" },
    { label: "Latin", language: "latin", prefix: "LA Seoul" },
    { label: "Latvian", language: "latvian", prefix: "LV Seoul" },
    { label: "Limburgan", language: "limburgan", prefix: "LI Seoul" },
    { label: "Lithuanian", language: "lithuanian", prefix: "LT Seoul" },
    { label: "Luxembourgish", language: "luxembourgish", prefix: "LB Seoul" },
    { label: "Luba-Katanga", language: "luba_katanga", prefix: "LU Seoul" },
    { label: "Macedonian", language: "macedonian", prefix: "MK Seoul" },
    { label: "Marshallese", language: "marshallese", prefix: "MH Seoul" },
    { label: "Maori", language: "maori", prefix: "MI Seoul" },
    { label: "Malay", language: "malay", prefix: "MS Seoul" },
    { label: "Maltese", language: "maltese", prefix: "MT Seoul" },
    { label: "Nauru", language: "nauru", prefix: "NA Seoul" },
    { label: "Navajo", language: "navajo", prefix: "NV Seoul" },
    { label: "South Ndebele", language: "south_ndebele", prefix: "NR Seoul" },
    { label: "Ndonga", language: "ndonga", prefix: "NG Seoul" },
    {
      label: "Norwegian Nynorsk",
      language: "norwegian_nynorsk",
      prefix: "NN Seoul",
    },
    {
      label: "Norwegian Bokmål",
      language: "norwegian_bokm_l",
      prefix: "NB Seoul",
    },
    { label: "Norwegian", language: "norwegian", prefix: "NO Seoul" },
    { label: "Occitan (post 1500)", language: "occitan", prefix: "OC Seoul" },
    { label: "Ojibwa", language: "ojibwa", prefix: "OJ Seoul" },
    { label: "Oriya", language: "oriya", prefix: "OR Seoul" },
    { label: "Ossetian", language: "ossetian", prefix: "OS Seoul" },
    { label: "Panjabi", language: "panjabi", prefix: "PA Seoul" },
    { label: "Pali", language: "pali", prefix: "PI Seoul" },
    { label: "Romansh", language: "romansh", prefix: "RM Seoul" },
    { label: "Sanskrit", language: "sanskrit", prefix: "SA Seoul" },
    { label: "Slovak", language: "slovak", prefix: "SK Seoul" },
    { label: "Slovenian", language: "slovenian", prefix: "SL Seoul" },
    { label: "Northern Sami", language: "northern_sami", prefix: "SE Seoul" },
    { label: "Samoan", language: "samoan", prefix: "SM Seoul" },
    { label: "Sindhi", language: "sindhi", prefix: "SD Seoul" },
    {
      label: "Sotho, Southern",
      language: "sotho_southern",
      prefix: "ST Seoul",
    },
    { label: "Sardinian", language: "sardinian", prefix: "SC Seoul" },
    { label: "Serbian", language: "serbian", prefix: "SR Seoul" },
    { label: "Swati", language: "swati", prefix: "SS Seoul" },
    { label: "Sundanese", language: "sundanese", prefix: "SU Seoul" },
    { label: "Tahitian", language: "tahitian", prefix: "TY Seoul" },
    { label: "Tatar", language: "tatar", prefix: "TT Seoul" },
  ]) {
    await smoke.check(`${label} Seoul encode`, async () => {
      const code = await postJson("/v1/encode", {
        lat: 37.566,
        lng: 126.978,
        language,
        regionLevel: 2,
        body: "earth",
      });
      assert(/^Seoul-/.test(code), `expected ${label} Seoul code, got ${code}`);
    });
  }
};
