import assert from "node:assert/strict";
import test from "node:test";
import {
  chatLink,
  cleanCode,
  formatPhone,
  normalizePhone,
  phoneError,
  whatsappErrorMessage,
} from "../../src/whatsapp.js";

test("a Colombian mobile typed without +57 gets the country code", () => {
  assert.equal(normalizePhone("301 094 4197"), "+573010944197");
  assert.equal(normalizePhone("3010944197"), "+573010944197");
  assert.equal(normalizePhone("+57 (301) 094-4197"), "+573010944197");
  assert.equal(normalizePhone("0057 301 094 4197"), "+573010944197");
  assert.equal(normalizePhone("+1 415 555 0100"), "+14155550100");
  assert.equal(normalizePhone("   "), "");
});

test("invalid numbers get a sentence the user can act on", () => {
  assert.equal(phoneError("301 094 4197"), null);
  assert.equal(phoneError("+57 301 094 4197"), null);
  assert.match(phoneError(""), /Escribe tu número/);
  assert.match(phoneError("12345"), /indicativo/);
  assert.match(phoneError("+0 301 094 4197"), /indicativo/);
});

test("codes keep only six digits", () => {
  assert.equal(cleanCode("123 456"), "123456");
  assert.equal(cleanCode("Código: 1234567"), "123456");
  assert.equal(cleanCode(null), "");
});

test("numbers are shown grouped and the chat link opens with cotizar typed", () => {
  assert.equal(formatPhone("+573010944197"), "+57 301 094 4197");
  assert.equal(formatPhone("+14155550100"), "+14155550100");
  assert.equal(chatLink("+573010944197"), "https://wa.me/573010944197?text=cotizar");
  assert.equal(chatLink(null), null);
});

test("backend errors become Spanish sentences", () => {
  assert.match(whatsappErrorMessage({ status: 429 }, "send"), /varios códigos/);
  assert.match(whatsappErrorMessage({ status: 400 }, "verify"), /código no es correcto/);
  assert.match(whatsappErrorMessage({ status: 400 }, "send"), /número no es válido/);
  assert.equal(whatsappErrorMessage({ status: 500, message: "Otro" }, "send"), "Otro");
});
