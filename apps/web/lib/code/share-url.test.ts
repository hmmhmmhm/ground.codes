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
    ).toBe("/서울-안방");
  });

  test("uses explicit body prefixes for Moon and Mars codes", () => {
    expect(
      buildGroundCodeSharePath({
        code: "Olympus Mons-Happy-Tiger",
        body: "mars",
      }),
    ).toBe("/mars/Olympus Mons-Happy-Tiger");

    expect(
      buildGroundCodeSharePath({
        code: "Mare Tranquillitatis-Happy-Tiger",
        body: "moon",
      }),
    ).toBe("/moon/Mare Tranquillitatis-Happy-Tiger");
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
    expect(
      parseGroundCodeSharePath(
        "/mars/%EB%8B%88%ED%81%AC%EC%8A%A4%20%EC%98%A4%EB%A5%B4%EC%9D%B4%EB%AF%80%ED%94%BC%EC%B9%B4-%EC%B0%BD-%EC%A1%B0%EB%B6%80-%EC%95%84%EB%B3%B4%EC%B9%B4%EB%8F%84%EC%9C%A0",
      ),
    ).toEqual({
      body: "mars",
      code: "니크스 오르이므피카-창-조부-아보카도유",
    });
  });

  test("parses multilingual Moon and Mars share paths with longer precision codes", () => {
    const cases = [
      {
        path: "/moon/Brashear%20P-Boulder-Main-Accuracy-Anonymous",
        body: "moon",
        code: "Brashear P-Boulder-Main-Accuracy-Anonymous",
      },
      {
        path: "/moon/%EB%B8%8C%EB%9D%BC%EC%8B%9C%EC%97%90%EC%95%84%EB%A5%B4%20%ED%94%BC%20%EB%B6%80%EC%86%8D%20%EC%A7%80%ED%98%95-%EC%97%B0%ED%95%84%EA%B9%8E%EC%9D%B4-%EB%8B%A4%EB%A6%AC-%EA%B3%B5%EC%9B%90-%EA%B8%B0%EC%81%A8",
        body: "moon",
        code: "브라시에아르 피 부속 지형-연필깎이-다리-공원-기쁨",
      },
      {
        path: "/moon/%E5%B8%83%E6%8B%89%E5%B8%8C%E5%9F%83%E9%98%BF%E5%B0%94%20%E7%9A%AE%E9%99%84%E5%B1%9E%E5%9C%B0%E5%BD%A2-%E9%94%81-%E8%8B%B9-%E9%80%9F%E5%86%99-%E5%AD%A3",
        body: "moon",
        code: "布拉希埃阿尔 皮附属地形-锁-苹-速写-季",
      },
      {
        path: "/moon/%E3%83%96%E3%83%A9%E3%82%B7%E3%82%A8%E3%82%A2%E3%83%AB%20%E3%83%97-%E3%81%8F%E3%82%8C%E3%82%8B-%E3%81%88%E3%81%A0-%E3%81%A8%E3%81%AB%E3%81%8B%E3%81%8F-%E3%82%82%E3%81%A1%E3%82%82%E3%81%AE",
        body: "moon",
        code: "ブラシエアル プ-くれる-えだ-とにかく-もちもの",
      },
      {
        path: "/mars/Richardson-All-Pounds-Twin-Posters",
        body: "mars",
        code: "Richardson-All-Pounds-Twin-Posters",
      },
      {
        path: "/mars/%EB%A6%AC%EC%B9%98%EC%95%84%EB%A5%B4%EB%93%9C%EC%86%8C%EB%8A%90%20%ED%81%AC%EB%A0%88%EC%9D%B4%ED%84%B0-%ED%91%B8%EB%A5%B8%EC%83%98%EB%AC%BC-%ED%91%B8%EB%A5%B8%EB%B0%94%EB%8B%B7%EA%B8%B8-%EB%8C%80%ED%9A%8C-%EC%97%B0%ED%9A%8C",
        body: "mars",
        code: "리치아르드소느 크레이터-푸른샘물-푸른바닷길-대회-연회",
      },
      {
        path: "/mars/%E9%87%8C%E5%A5%87%E9%98%BF%E5%B0%94%E5%BE%B7%E7%B4%A2%E6%81%A9%E6%92%9E%E5%87%BB%E5%9D%91-%E8%AE%AF-%E6%AF%9B%E8%B1%86-%E5%BA%95-%E4%BC%A0%E6%89%BF",
        body: "mars",
        code: "里奇阿尔德索恩撞击坑-讯-毛豆-底-传承",
      },
      {
        path: "/mars/%E3%83%AA%E3%83%81%E3%82%A2%E3%83%AB%E3%83%89%E3%82%BD%E3%83%B3-%E3%81%AB%E3%82%93%E3%81%8D-%E3%81%A1%E3%82%8A-%E3%81%A4%E3%81%8F%E3%82%8A-%E3%82%86%E3%81%86%E3%81%9B%E3%81%84",
        body: "mars",
        code: "リチアルドソン-にんき-ちり-つくり-ゆうせい",
      },
    ] as const;

    for (const item of cases) {
      expect(parseGroundCodeSharePath(item.path)).toEqual({
        body: item.body,
        code: item.code,
      });
    }
  });

  test("ignores app routes that are not share codes", () => {
    expect(parseGroundCodeSharePath("/api/weather-data")).toBeNull();
    expect(parseGroundCodeSharePath("/docs")).toBeNull();
    expect(parseGroundCodeSharePath("/about")).toBeNull();
    expect(parseGroundCodeSharePath("/moon")).toBeNull();
    expect(parseGroundCodeSharePath("/moon/about")).toBeNull();
  });
});
