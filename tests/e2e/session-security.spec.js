import { expect, request, test } from "@playwright/test";

const UI_PREFERENCE_VALUE_MAX = 64;

async function createAccount() {
  const api = await request.newContext({ baseURL: "http://localhost:5173" });
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@demo.co`;
  const response = await api.post("/api/auth/register", {
    data: { agencyName: "Agencia E2E", ownerFullName: "Owner E2E", email, password: "secret123" },
  });
  expect(response.status()).toBe(201);
  expect(await response.json()).not.toHaveProperty("token");
  await api.dispose();
  return email;
}

async function login(page, email) {
  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("secret123");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
}

async function expectNoCredentialsReachableFromJs(page, context) {
  const cookies = await context.cookies();
  const access = cookies.find((cookie) => cookie.name === "cz_access");
  expect(access, "access cookie set by the backend").toBeTruthy();
  expect(access.httpOnly).toBe(true);
  expect(access.sameSite).toBe("Strict");

  const exposed = await page.evaluate(() => ({
    cookie: document.cookie,
    local: Object.entries(window.localStorage),
    session: Object.entries(window.sessionStorage),
  }));
  expect(exposed.cookie).not.toContain("cz_access");
  expect(exposed.cookie).not.toContain("cz_refresh");
  expect(exposed.session).toEqual([]);
  for (const [key, value] of exposed.local) {
    expect(value, `localStorage ${key} must hold a UI preference, not data`).not.toContain(access.value);
    expect(value.length, `localStorage ${key} must hold a UI preference, not data`).toBeLessThanOrEqual(
      UI_PREFERENCE_VALUE_MAX,
    );
    expect(key.toLowerCase()).not.toMatch(/token|brief|execution|session/);
  }
}

test("login keeps every credential out of JavaScript and the session survives a reload", async ({ page, context }) => {
  const email = await createAccount();
  await login(page, email);
  await expectNoCredentialsReachableFromJs(page, context);

  await page.reload();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await expectNoCredentialsReachableFromJs(page, context);
});

test("the app sends the CSRF token on writes and a forged write without it is refused", async ({ page }) => {
  const email = await createAccount();
  await login(page, email);

  await page.goto("/#clientes");
  await page.getByRole("button", { name: "Nuevo cliente" }).first().click();
  await page.getByLabel("Nombre", { exact: true }).fill("Cliente E2E");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Cliente E2E").first()).toBeVisible();

  const forged = await page.evaluate(async () => {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Forjado" }),
    });
    return response.status;
  });
  expect(forged).toBe(403);
});

test("logging out clears the session cookies", async ({ page, context }) => {
  const email = await createAccount();
  await login(page, email);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  const live = (await context.cookies()).filter((c) => (c.name === "cz_access" || c.name === "cz_refresh") && c.value);
  expect(live).toEqual([]);
  const me = await page.evaluate(async () => (await fetch("/api/auth/me")).status);
  expect(me).toBe(401);
});
