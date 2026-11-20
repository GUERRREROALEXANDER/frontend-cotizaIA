import { expect, test } from "@playwright/test";

// Proposals made outside this tab (a quote by WhatsApp) must show up without reloading: the app re-reads the
// workspace on entering a view that lists proposals and every 30 s while the tab is visible.

const ME = { id: 1, email: "owner@demo.co", fullName: "Owner Demo", role: "OWNER", agencyId: 1, agencyName: "Agencia Demo", emailVerified: true };

async function fakeBackend(page) {
  const calls = [];
  await page.context().addCookies([{ name: "XSRF-TOKEN", value: "test", url: "http://localhost:5173" }]);
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    calls.push(`${request.method()} ${path}`);
    if (path === "/api/auth/me") return json(200, ME);
    if (path === "/api/agency/pricing-model") return json(200, { pricingModel: "FIXED" });
    return request.method() === "GET" ? json(200, path.includes("summary") ? {} : []) : json(200, {});
  });
  return () => calls.filter((call) => call === "GET /api/proposals").length;
}

test("the workspace is re-read on entering Propuestas and every 30 s, not twice on login", async ({ page }) => {
  await page.clock.install();
  const proposalReads = await fakeBackend(page);

  await page.goto("/#/whatsapp");
  await expect(page.getByRole("heading", { name: "WhatsApp" })).toBeVisible();
  await expect.poll(proposalReads).toBe(1);

  await page.evaluate(() => { window.location.hash = "#/propuestas"; });
  await expect.poll(proposalReads).toBe(2);

  await page.clock.fastForward(31_000);
  await expect.poll(proposalReads).toBe(3);
});
