import { expect, test } from "@playwright/test";

const boxesOverlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

test("opens a canonical Earth Ground Code share URL", async ({ page }) => {
  test.setTimeout(90_000);
  const searchResponse = page.waitForResponse((response) =>
    response.url().includes("/v1/search"),
  );
  const encodeResponse = page.waitForResponse((response) =>
    response.url().includes("/v1/encode"),
  );
  await page.goto("/%EC%84%9C%EC%9A%B8-%EC%95%88%EB%B0%A9");
  await expect((await searchResponse).ok()).toBe(true);
  await expect((await encodeResponse).ok()).toBe(true);

  await expect(page.getByText(/37\.566000/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Share|공유/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Copy|복사/ })).toHaveCount(0);
});

test("searches partial region names and shows selectable results", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/?map=roadmap");

  const search = page.getByRole("textbox", {
    name: /그라운드 코드|Ground Code/,
  });
  await search.fill("Seo");
  const searchResponse = page.waitForResponse((response) =>
    response.url().includes("/v1/search"),
  );
  await search.press("Enter");
  await expect((await searchResponse).ok()).toBe(true);

  await expect(page.getByText("Seoul").first()).toBeVisible();
  await expect(page.getByText("Seongnamsi").first()).toBeVisible();
});

test("keeps mobile map controls clear of search and selected area panel", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });

  const searchResponse = page.waitForResponse((response) =>
    response.url().includes("/v1/search"),
  );
  const encodeResponse = page.waitForResponse((response) =>
    response.url().includes("/v1/encode"),
  );
  await page.goto("/%EC%84%9C%EC%9A%B8-%EC%95%88%EB%B0%A9");
  await expect((await searchResponse).ok()).toBe(true);
  await expect((await encodeResponse).ok()).toBe(true);
  await expect(page.getByText(/37\.566000/).first()).toBeVisible();

  const searchBox = await page
    .getByRole("textbox", { name: /그라운드 코드|Ground Code/ })
    .boundingBox();
  const settingsBox = await page
    .getByTestId("map-settings-controls")
    .boundingBox();
  const actionBox = await page.getByTestId("map-action-controls").boundingBox();
  const panelBox = await page.getByTestId("selected-area-panel").boundingBox();

  expect(searchBox).not.toBeNull();
  expect(settingsBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(panelBox).not.toBeNull();

  expect(boxesOverlap(settingsBox!, searchBox!)).toBe(false);
  expect(boxesOverlap(settingsBox!, panelBox!)).toBe(false);
  expect(boxesOverlap(actionBox!, panelBox!)).toBe(false);
});

test("shows a visible error for an invalid code-shaped share URL", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const searchResponse = page.waitForResponse((response) =>
    response.url().includes("/v1/search"),
  );

  await page.goto("/Seoul-notrealcode");
  await expect((await searchResponse).ok()).toBe(true);
  await expect(
    page.getByText(/No matching Ground Code|일치하는 그라운드 코드/),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: /그라운드 코드|Ground Code/ }),
  ).toHaveValue("Seoul-notrealcode");
});
