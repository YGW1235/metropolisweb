import { expect, test } from "@playwright/test";

const brandLinkPattern = /Metropolis|메트로폴리스/i;

const publicPages = [
  { path: "/", name: "home" },
  { path: "/topics", name: "topics" },
  { path: "/login", name: "login" },
  { path: "/contact", name: "contact" },
  { path: "/notices", name: "notices" },
  { path: "/terms", name: "terms" },
  { path: "/privacy", name: "privacy" },
];

const notFoundPath = "/this-page-should-not-exist";

for (const { path, name } of publicPages) {
  test(`${name} page renders`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });

    expect(response, `${path} should return a response`).not.toBeNull();
    expect(
      response?.status(),
      `${path} should not return an error status`,
    ).toBeLessThan(400);

    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(
      page.getByRole("link", { name: brandLinkPattern }).first(),
    ).toBeVisible();
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    expect((await page.title()).trim().length).toBeGreaterThan(0);
  });
}

test("not found page renders", async ({ page }) => {
  const response = await page.goto(notFoundPath, {
    waitUntil: "domcontentloaded",
  });

  expect(response, "404 page should return a response").not.toBeNull();
  expect(response?.status(), "missing page should return 404").toBe(404);

  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(
    page.getByRole("link", { name: brandLinkPattern }).first(),
  ).toBeVisible();
  await expect(page.locator("main").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /페이지를 찾을 수 없습니다/ }),
  ).toBeVisible();
});
