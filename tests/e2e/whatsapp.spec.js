import { expect, test } from "@playwright/test";

// The WhatsApp screen against a simulated backend (page.route), so it runs without the API on :8080.
// The real backend journey (code -> verify -> "cotizar" -> proposal) is covered by WhatsappQuoteChatApiTests.

const ME = { id: 1, email: "owner@demo.co", fullName: "Owner Demo", role: "OWNER", agencyId: 1, agencyName: "Agencia Demo", emailVerified: true };

async function fakeBackend(page, { codeIsWrongOnce = false } = {}) {
  const state = { contact: null, sentTo: null, wrongLeft: codeIsWrongOnce ? 1 : 0, calls: [] };
  await page.context().addCookies([{ name: "XSRF-TOKEN", value: "test", url: "http://localhost:5173" }]);
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    state.calls.push(`${method} ${path}`);

    if (path === "/api/auth/me") return json(200, ME);
    if (path === "/api/auth/me/whatsapp/info") return json(200, { botNumber: "+573010944197", serviceConfigured: true });
    if (path === "/api/auth/me/whatsapp" && method === "GET") {
      return state.contact ? json(200, state.contact) : json(404, { error: "No WhatsApp number on this account" });
    }
    if (path === "/api/auth/me/whatsapp/verification") {
      state.sentTo = JSON.parse(request.postData()).phone;
      return json(202, { phone: "+57*******197", expiresInSeconds: 600 });
    }
    if (path === "/api/auth/me/whatsapp/verify") {
      if (state.wrongLeft > 0 || JSON.parse(request.postData()).code !== "123456") {
        state.wrongLeft -= 1;
        return json(400, { error: "Invalid or expired code" });
      }
      state.contact = { phone: "+57*******197", enabled: true, verifiedAt: "2026-11-20T17:00:00Z" };
      return json(200, state.contact);
    }
    if (path === "/api/auth/me/whatsapp" && method === "PATCH") {
      state.contact = { ...state.contact, enabled: JSON.parse(request.postData()).enabled };
      return json(200, state.contact);
    }
    if (path === "/api/auth/me/whatsapp" && method === "DELETE") {
      state.contact = null;
      return route.fulfill({ status: 204 });
    }
    // Everything else the shell loads (dashboard, notifications...) is empty.
    return method === "GET" ? json(200, path.includes("summary") ? {} : []) : json(200, {});
  });
  return state;
}

test("a user links their number with the code and sees how to quote", async ({ page }) => {
  const backend = await fakeBackend(page, { codeIsWrongOnce: true });
  await page.goto("/#/whatsapp");

  await expect(page.getByRole("heading", { name: "WhatsApp" }).first()).toBeVisible();
  await page.getByLabel("Número de WhatsApp").fill("12");
  await page.getByRole("button", { name: "Enviar código" }).click();
  await expect(page.getByText(/Revisa el número/)).toBeVisible();

  await page.getByLabel("Número de WhatsApp").fill("301 094 4197");
  await page.getByRole("button", { name: "Enviar código" }).click();
  expect(backend.sentTo).toBe("+573010944197");
  await expect(page.getByText("Escribe el código")).toBeVisible();
  await expect(page.getByRole("button", { name: /Reenviar en \d+ s/ })).toBeDisabled();

  await page.getByLabel("Código de verificación").fill("123 456");
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.getByText(/código no es correcto/)).toBeVisible();

  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.getByText("Verificado", { exact: true })).toBeVisible();
  await expect(page.getByText("+57 301 094 4197")).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir el chat" })).toHaveAttribute(
    "href",
    "https://wa.me/573010944197?text=cotizar",
  );

  await page.getByRole("switch").click();
  await expect(page.getByRole("switch")).not.toBeChecked();
  await expect(page.getByText("Pausados", { exact: true })).toBeVisible();
});
