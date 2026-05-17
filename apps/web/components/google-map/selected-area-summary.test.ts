import { describe, expect, test } from "bun:test";
import { getSelectedAreaDetailText } from "./selected-area-summary";

describe("selected area summary", () => {
  test("uses the resolved address before the precision label", () => {
    expect(
      getSelectedAreaDetailText({
        address: "서울특별시 용산구 한강대로",
        precisionLabel: "정밀도 약 3m",
      }),
    ).toBe("서울특별시 용산구 한강대로");
  });

  test("falls back to the precision label while the address is unavailable", () => {
    expect(
      getSelectedAreaDetailText({
        address: "  ",
        precisionLabel: "정밀도 약 3m",
      }),
    ).toBe("정밀도 약 3m");
  });
});
