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
});
