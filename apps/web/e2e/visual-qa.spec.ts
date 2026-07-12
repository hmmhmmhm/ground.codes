import { expect, test } from "@playwright/test";

const waitForShareUrlToResolve = async (
  page: import("@playwright/test").Page,
) => {
  const searchResponse = page.waitForResponse((response) =>
    response.url().includes("/v1/search"),
  );
  const encodeResponse = page.waitForResponse((response) =>
    response.url().includes("/v1/encode"),
  );

  await page.goto("/%EC%84%9C%EC%9A%B8-%EC%95%88%EB%B0%A9");
  await expect((await searchResponse).ok()).toBe(true);
  await expect((await encodeResponse).ok()).toBe(true);
  await expect(page.getByTestId("selected-area-panel")).toBeVisible();
};

test.describe("visual QA capture", () => {
  test("captures desktop, mobile, and API docs screenshots", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await waitForShareUrlToResolve(page);
    await page.screenshot({
      path: testInfo.outputPath("desktop-map.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 360, height: 740 });
    await waitForShareUrlToResolve(page);
    await page.screenshot({
      path: testInfo.outputPath("compact-mobile-map.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await waitForShareUrlToResolve(page);
    await page.screenshot({
      path: testInfo.outputPath("mobile-map.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 768, height: 1024 });
    await waitForShareUrlToResolve(page);
    await page.screenshot({
      path: testInfo.outputPath("tablet-map.png"),
      fullPage: true,
    });

    await page.goto("http://127.0.0.1:3000/docs");
    await expect(
      page.getByRole("heading", { name: "Ground Codes API" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("api-docs.png"),
      fullPage: true,
    });
  });
});
