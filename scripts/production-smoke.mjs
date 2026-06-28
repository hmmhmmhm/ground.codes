import { appendFileSync } from "node:fs";

import {
  createSmokeRecorder,
  fetchWithRetry,
  formatGitHubStepSummary,
  formatSmokeSummary,
  getMissingMetricRoutes,
} from "./production-smoke-helpers.mjs";

const apiBaseUrl = (
  process.env.GROUND_CODES_API_URL ?? "https://api.ground.codes"
).replace(/\/+$/, "");
const webBaseUrl = (
  process.env.GROUND_CODES_WEB_URL ?? "https://ground.codes"
).replace(/\/+$/, "");

const smoke = createSmokeRecorder();

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fetchText = async (url, init) => {
  const response = await fetchWithRetry(url, init);
  const text = await response.text();
  assert(response.ok, `${url} returned ${response.status}: ${text}`);
  return text;
};

const postJson = async (path, body) => {
  const response = await fetchWithRetry(`${apiBaseUrl}${path}`, {
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
  assert(/^セオウル-/.test(code), `expected Japanese Seoul code, got ${code}`);
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

for (const { label, language, prefix } of [
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
  { label: "Western Frisian", language: "western_frisian", prefix: "FY Seoul" },
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
  { label: "Sotho, Southern", language: "sotho_southern", prefix: "ST Seoul" },
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
    assert(
      code.startsWith(`${prefix}-`),
      `expected ${label} ${prefix} code, got ${code}`,
    );
  });
}

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
  assert(/^Hà Nội-/.test(code), `expected Vietnamese Hanoi code, got ${code}`);
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
  assert(/^Jakarta-/.test(code), `expected Swahili Jakarta code, got ${code}`);
});

await smoke.check("Filipino Jakarta encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: -6.1751,
    lng: 106.865,
    language: "filipino",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Jakarta-/.test(code), `expected Filipino Jakarta code, got ${code}`);
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
  assert(/^ဂျာကာတာ-/.test(code), `expected Burmese Jakarta code, got ${code}`);
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
  assert(/^Jakarta-/.test(code), `expected Malagasy Jakarta code, got ${code}`);
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
  assert(/^Jakarta-/.test(code), `expected Chichewa Jakarta code, got ${code}`);
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
  assert(/^Jakarta-/.test(code), `expected Bambara Jakarta code, got ${code}`);
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
  assert(/^ஜகார்த்தா-/.test(code), `expected Tamil Jakarta code, got ${code}`);
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
  assert(/^Jakarta-/.test(code), `expected Kirundi Jakarta code, got ${code}`);
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

await smoke.check("Quechua Jakarta encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: -6.1751,
    lng: 106.865,
    language: "quechua",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Jakarta-/.test(code), `expected Quechua Jakarta code, got ${code}`);
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
  assert(/^Jakarta-/.test(code), `expected Guarani Jakarta code, got ${code}`);
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
  assert(/^Jakarta-/.test(code), `expected Tamasheq Jakarta code, got ${code}`);
});

await smoke.check("Songhay Jakarta encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: -6.1751,
    lng: 106.865,
    language: "songhay",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Jakarta-/.test(code), `expected Songhay Jakarta code, got ${code}`);
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
  assert(/^Jakarta-/.test(code), `expected Dagbanli Jakarta code, got ${code}`);
});

await smoke.check("Luganda Jakarta encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: -6.1751,
    lng: 106.865,
    language: "luganda",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Jakarta-/.test(code), `expected Luganda Jakarta code, got ${code}`);
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
  assert(/^Jakarta-/.test(code), `expected chiShona Jakarta code, got ${code}`);
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

await smoke.check("API route metrics cover smoke paths", async () => {
  const metrics = JSON.parse(await fetchText(`${apiBaseUrl}/metrics`));
  const missingRoutes = getMissingMetricRoutes(metrics, [
    "/readyz",
    "/v1/encode",
    "/v1/search",
  ]);
  assert(
    missingRoutes.length === 0,
    `metrics missing route samples: ${missingRoutes.join(", ")}`,
  );
});

await smoke.check("Web robots", async () => {
  const robots = await fetchText(`${webBaseUrl}/robots.txt`);
  assert(robots.includes("Sitemap:"), "robots.txt does not include a sitemap");
});

await smoke.check("Web sitemap", async () => {
  const sitemap = await fetchText(`${webBaseUrl}/sitemap.xml`);
  assert(
    sitemap.includes("<loc>https://ground.codes</loc>"),
    "sitemap missing root URL",
  );
});

if (process.env.GROUND_CODES_SMOKE_FORCE_FAILURE === "true") {
  await smoke.check("Forced notification test", async () => {
    throw new Error("Forced failure requested by workflow_dispatch input");
  });
}

console.log("Production smoke timings:");
console.log(formatSmokeSummary(smoke.results));

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    formatGitHubStepSummary(smoke.results),
  );
}

if (smoke.failures.length > 0) {
  console.error(
    `Production smoke failed with ${smoke.failures.length} failure(s):`,
  );
  for (const failure of smoke.failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production smoke passed.");
