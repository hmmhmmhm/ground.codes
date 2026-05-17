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

  test("removes a leading Google Plus Code from the resolved address", () => {
    expect(
      getSelectedAreaDetailText({
        address: "QG2X+84 대한민국 서울특별시 용산구 용산동4가 7-3",
        precisionLabel: "정밀도 약 3m",
      }),
    ).toBe("대한민국 서울특별시 용산구 용산동4가 7-3");

    expect(
      getSelectedAreaDetailText({
        address: "849VCWC8+R9, Mountain View, CA, USA",
        precisionLabel: "Approx. 3m precision",
      }),
    ).toBe("Mountain View, CA, USA");
  });
});
