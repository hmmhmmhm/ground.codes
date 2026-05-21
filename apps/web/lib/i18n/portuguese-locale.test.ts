import { describe, expect, test } from "bun:test";

import messages from "@/messages/pt/index.json";
import placeTypes from "@/messages/pt/placeTypes.json";

describe("Portuguese UI locale", () => {
  test("uses native Portuguese characters in UI copy", () => {
    expect(messages.common.languageName).toBe("Português");
    expect(messages.common.address).toBe("Endereço");
    expect(messages.weather.currentLocation).toBe("Localização atual");
    expect(messages.airQuality.title).toBe("Qualidade do ar");
    expect(placeTypes.bakery).toBe("Padaria");
  });

  test("keeps URL-only transliteration out of Portuguese UI copy", () => {
    const serialized = JSON.stringify({ messages, placeTypes });

    expect(serialized).not.toMatch(
      /Portugues|Endereco|Localizacao|direcao|informacao|nao disponivel/,
    );
  });
});
