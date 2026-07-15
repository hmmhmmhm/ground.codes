import {
  createLanguageSmokeCheck,
  runRegisteredSmokeChecks,
} from "./production-smoke-helpers.mjs";

export const additionalLatinSmokeChecks = [
  createLanguageSmokeCheck({
    language: "quechua",
    label: "Quechua Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "aymara",
    label: "Aymara Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "guarani",
    label: "Guarani Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "kongo",
    label: "Kongo Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "zarma",
    label: "Zarma Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "tamasheq",
    label: "Tamasheq Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "songhay",
    label: "Songhay Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "twi",
    label: "Twi Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "dagbani",
    label: "Dagbanli Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "luganda",
    label: "Luganda Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "acholi",
    label: "Acholi Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "dinka",
    label: "Dinka Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "nuer",
    label: "Nuer Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "shona",
    label: "chiShona Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "ndebele",
    label: "isiNdebele Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
  createLanguageSmokeCheck({
    language: "tok_pisin",
    label: "Tok Pisin Jakarta encode",
    lat: -6.1751,
    lng: 106.865,
    prefix: "Jakarta",
  }),
];

export const runAdditionalLatinSmokeChecks = (context) =>
  runRegisteredSmokeChecks(context, additionalLatinSmokeChecks);
