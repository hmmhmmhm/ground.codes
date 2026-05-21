import { describe, expect, test } from "bun:test";

import messages from "@/messages/de/index.json";
import placeTypes from "@/messages/de/placeTypes.json";

describe("German UI locale", () => {
  test("uses native German characters in UI copy", () => {
    expect(messages.map.controls.body).toBe("Himmelskörper");
    expect(messages.airQuality.title).toBe("Luftqualität");
    expect(messages.common.close).toBe("Schließen");
    expect(messages.common.hours).toBe("Öffnungszeiten");
    expect(placeTypes.bakery).toBe("Bäckerei");
  });

  test("keeps URL-only transliteration out of German UI copy", () => {
    const serialized = JSON.stringify({ messages, placeTypes });

    expect(serialized).not.toMatch(
      /Koerper|Qualitaet|Schliessen|Oeff|Baeckerei|verfuegbar|spaeter/,
    );
  });
});
