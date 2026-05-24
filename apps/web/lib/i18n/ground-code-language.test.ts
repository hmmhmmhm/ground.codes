import { describe, expect, test } from "bun:test";

import { getGroundCodeLanguage } from "./ground-code-language";

describe("ground code language mapping", () => {
  test("maps French UI locale to French Ground Codes", () => {
    expect(getGroundCodeLanguage("fr")).toBe("french");
  });

  test("maps Portuguese UI locale to Portuguese Ground Codes", () => {
    expect(getGroundCodeLanguage("pt")).toBe("portuguese");
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
  });
});
