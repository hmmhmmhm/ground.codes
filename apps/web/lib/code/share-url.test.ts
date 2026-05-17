import { describe, expect, test } from "bun:test";
import {
  buildGroundCodeSharePath,
  parseGroundCodeSharePath,
} from "./share-url";

describe("Ground Code share URLs", () => {
  test("uses a root path for Earth codes", () => {
    expect(
      buildGroundCodeSharePath({
        code: "서울-안방",
        body: "earth",
      }),
    ).toBe("/%EC%84%9C%EC%9A%B8-%EC%95%88%EB%B0%A9");
  });

  test("uses explicit body prefixes for Moon and Mars codes", () => {
    expect(
      buildGroundCodeSharePath({
        code: "Olympus Mons-Happy-Tiger",
        body: "mars",
      }),
    ).toBe("/mars/Olympus%20Mons-Happy-Tiger");

    expect(
      buildGroundCodeSharePath({
        code: "Mare Tranquillitatis-Happy-Tiger",
        body: "moon",
      }),
    ).toBe("/moon/Mare%20Tranquillitatis-Happy-Tiger");
  });

  test("parses Earth, Moon, and Mars share paths", () => {
    expect(parseGroundCodeSharePath("/서울-안방")).toEqual({
      body: "earth",
      code: "서울-안방",
    });
    expect(parseGroundCodeSharePath("/mars/Olympus%20Mons-Happy-Tiger")).toEqual({
      body: "mars",
      code: "Olympus Mons-Happy-Tiger",
    });
    expect(
      parseGroundCodeSharePath("/moon/Mare%20Tranquillitatis-Happy-Tiger/"),
    ).toEqual({
      body: "moon",
      code: "Mare Tranquillitatis-Happy-Tiger",
    });
  });

  test("ignores app routes that are not share codes", () => {
    expect(parseGroundCodeSharePath("/api/weather-data")).toBeNull();
    expect(parseGroundCodeSharePath("/docs")).toBeNull();
    expect(parseGroundCodeSharePath("/about")).toBeNull();
    expect(parseGroundCodeSharePath("/Seoul-not-a-real-code")).toBeNull();
    expect(parseGroundCodeSharePath("/moon")).toBeNull();
    expect(parseGroundCodeSharePath("/moon/about")).toBeNull();
  });
});
