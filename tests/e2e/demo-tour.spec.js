import { expect, request, test } from "@playwright/test";
import { views } from "../../src/navigation.js";

// Smoke tour over the demo agency loaded by backend-cotizaIA/scripts/seed_demo.py: every view must render real
// data without a JavaScript error. Skipped when the demo agency is not loaded.
const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@estudio-narino.test";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "CotizaIA-demo-2026";

test.beforeAll(async () => {
  const api = await request.newContext({ baseURL: "http://localhost:5173" });
  const response = await api.post("/api/auth/login", { data: { email: DEMO_EMAIL, password: DEMO_PASSWORD } });
  await api.dispose();
  test.skip(response.status() !== 200, "demo agency not loaded: run scripts/seed_demo.py in the backend");
});

test("every view renders the demo agency without errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill(DEMO_EMAIL);
  await page.getByLabel("Contraseña", { exact: true }).fill(DEMO_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await expect(page.locator("header").getByText("Estudio Nariño Digital")).toBeVisible();

  for (const view of views) {
    await page.goto(`/#${view.slug}`);
    await expect(page.locator("header").getByText(view.label, { exact: true })).toBeVisible();
    await expect(page.getByText("Cargando…")).toHaveCount(0);
    await expect(page.getByText("No se pudo cargar toda la información")).toHaveCount(0);
  }

  await page.goto("/#clientes");
  await expect(page.getByText("Taller Moto Sur Pasto").first()).toBeVisible();
  await page.goto("/#catalogo");
  await expect(page.getByRole("button", { name: "Ver requisitos de Servicios digitales" })).toContainText(
    "10 requisitos",
  );

  expect(errors).toEqual([]);
});
