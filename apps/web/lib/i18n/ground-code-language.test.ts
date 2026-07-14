import { describe, expect, test } from "bun:test";

import { locales } from "@/i18n";
import { getGroundCodeLanguage } from "./ground-code-language";

describe("ground code language mapping", () => {
  test("maps French UI locale to French Ground Codes", () => {
    expect(getGroundCodeLanguage("fr")).toBe("french");
  });

  test("maps Portuguese UI locale to Portuguese Ground Codes", () => {
    expect(getGroundCodeLanguage("pt")).toBe("portuguese");
  });

  test("maps major European UI locales to Ground Codes", () => {
    expect(getGroundCodeLanguage("tr")).toBe("turkish");
    expect(getGroundCodeLanguage("it")).toBe("italian");
    expect(getGroundCodeLanguage("nl")).toBe("dutch");
    expect(getGroundCodeLanguage("pl")).toBe("polish");
    expect(getGroundCodeLanguage("uk")).toBe("ukrainian");
    expect(getGroundCodeLanguage("ro")).toBe("romanian");
    expect(getGroundCodeLanguage("cs")).toBe("czech");
    expect(getGroundCodeLanguage("el")).toBe("greek");
    expect(getGroundCodeLanguage("sv")).toBe("swedish");
    expect(getGroundCodeLanguage("hu")).toBe("hungarian");
    expect(getGroundCodeLanguage("da")).toBe("danish");
  });

  test("maps Indonesian UI locale to Indonesian Ground Codes", () => {
    expect(getGroundCodeLanguage("id")).toBe("indonesian");
  });

  test("maps Thai UI locale to Thai Ground Codes", () => {
    expect(getGroundCodeLanguage("th")).toBe("thai");
  });

  test("maps Vietnamese UI locale to Vietnamese Ground Codes", () => {
    expect(getGroundCodeLanguage("vi")).toBe("vietnamese");
  });

  test("maps Hindi UI locale to Hindi Ground Codes", () => {
    expect(getGroundCodeLanguage("hi")).toBe("hindi");
  });

  test("maps Arabic UI locale to Arabic Ground Codes", () => {
    expect(getGroundCodeLanguage("ar")).toBe("arabic");
  });

  test("maps Russian UI locale to Russian Ground Codes", () => {
    expect(getGroundCodeLanguage("ru")).toBe("russian");
  });

  test("maps address-gap expansion UI locales to Ground Codes", () => {
    expect(getGroundCodeLanguage("sw")).toBe("swahili");
    expect(getGroundCodeLanguage("fil")).toBe("filipino");
    expect(getGroundCodeLanguage("ha")).toBe("hausa");
    expect(getGroundCodeLanguage("bn")).toBe("bengali");
    expect(getGroundCodeLanguage("ur")).toBe("urdu");
    expect(getGroundCodeLanguage("am")).toBe("amharic");
    expect(getGroundCodeLanguage("my")).toBe("burmese");
    expect(getGroundCodeLanguage("km")).toBe("khmer");
    expect(getGroundCodeLanguage("ne")).toBe("nepali");
    expect(getGroundCodeLanguage("so")).toBe("somali");
    expect(getGroundCodeLanguage("ps")).toBe("pashto");
    expect(getGroundCodeLanguage("ln")).toBe("lingala");
    expect(getGroundCodeLanguage("mn")).toBe("mongolian");
    expect(getGroundCodeLanguage("lo")).toBe("lao");
    expect(getGroundCodeLanguage("mg")).toBe("malagasy");
    expect(getGroundCodeLanguage("prs")).toBe("dari");
    expect(getGroundCodeLanguage("om")).toBe("oromo");
    expect(getGroundCodeLanguage("ny")).toBe("chichewa");
    expect(getGroundCodeLanguage("ti")).toBe("tigrinya");
    expect(getGroundCodeLanguage("bm")).toBe("bambara");
    expect(getGroundCodeLanguage("ff")).toBe("fula");
    expect(getGroundCodeLanguage("wo")).toBe("wolof");
    expect(getGroundCodeLanguage("si")).toBe("sinhala");
    expect(getGroundCodeLanguage("ta")).toBe("tamil");
    expect(getGroundCodeLanguage("rw")).toBe("kinyarwanda");
    expect(getGroundCodeLanguage("rn")).toBe("kirundi");
    expect(getGroundCodeLanguage("kri")).toBe("krio");
    expect(getGroundCodeLanguage("ee")).toBe("ewe");
    expect(getGroundCodeLanguage("fon")).toBe("fon");
    expect(getGroundCodeLanguage("sg")).toBe("sango");
    expect(getGroundCodeLanguage("mos")).toBe("moore");
    expect(getGroundCodeLanguage("kr")).toBe("kanuri");
    expect(getGroundCodeLanguage("qu")).toBe("quechua");
    expect(getGroundCodeLanguage("ay")).toBe("aymara");
    expect(getGroundCodeLanguage("gn")).toBe("guarani");
    expect(getGroundCodeLanguage("kg")).toBe("kongo");
    expect(getGroundCodeLanguage("dje")).toBe("zarma");
    expect(getGroundCodeLanguage("tmh")).toBe("tamasheq");
    expect(getGroundCodeLanguage("son")).toBe("songhay");
    expect(getGroundCodeLanguage("tw")).toBe("twi");
    expect(getGroundCodeLanguage("dag")).toBe("dagbani");
    expect(getGroundCodeLanguage("lg")).toBe("luganda");
    expect(getGroundCodeLanguage("ach")).toBe("acholi");
    expect(getGroundCodeLanguage("din")).toBe("dinka");
    expect(getGroundCodeLanguage("nus")).toBe("nuer");
    expect(getGroundCodeLanguage("sn")).toBe("shona");
    expect(getGroundCodeLanguage("nde")).toBe("ndebele");
    expect(getGroundCodeLanguage("tpi")).toBe("tok_pisin");
  });

  test("maps candidate expansion UI locales to Ground Codes", () => {
    expect(getGroundCodeLanguage("mr")).toBe("marathi");
    expect(getGroundCodeLanguage("te")).toBe("telugu");
    expect(getGroundCodeLanguage("gu")).toBe("gujarati");
    expect(getGroundCodeLanguage("kn")).toBe("kannada");
    expect(getGroundCodeLanguage("ml")).toBe("malayalam");
    expect(getGroundCodeLanguage("yo")).toBe("yoruba");
    expect(getGroundCodeLanguage("fa")).toBe("persian");
    expect(getGroundCodeLanguage("yue")).toBe("cantonese");
  });

  test("resolves every supported UI locale without falling through", () => {
    for (const locale of locales) {
      const language = getGroundCodeLanguage(locale);
      expect(language).toBeString();
      expect(language.length).toBeGreaterThan(0);
      if (locale === "en") {
        expect(language).toBe("english");
      } else {
        expect(language).not.toBe("english");
      }
    }
  });
});
