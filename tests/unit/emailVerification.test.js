import test from "node:test";
import assert from "node:assert/strict";
import {
  VERIFY_MESSAGES,
  authErrorMessage,
  getVerifyTokenFromLocation,
  isEmailNotVerifiedError,
  isInvalidTokenError,
  isVerifyEmailLocation,
  registerRequiresVerification,
} from "../../src/authVerification.js";

test("token comes from the hash query in the hash-routed app", () => {
  assert.equal(getVerifyTokenFromLocation({ hash: "#/verify-email?token=abc123" }), "abc123");
});

test("token falls back to ?search= when the hash has no query", () => {
  assert.equal(getVerifyTokenFromLocation({ hash: "#/verify-email", search: "?token=xyz" }), "xyz");
});

test("hash wins over search and a full href parses both", () => {
  assert.equal(
    getVerifyTokenFromLocation({ hash: "#/verify-email?token=hash-one", search: "?token=search-one" }),
    "hash-one",
  );
  assert.equal(getVerifyTokenFromLocation({ href: "https://app.test/verify-email?token=web" }), "web");
  assert.equal(getVerifyTokenFromLocation({ href: "https://app.test/#/verify-email?token=h" }), "h");
});

test("missing or empty token gives an empty string, never null", () => {
  assert.equal(getVerifyTokenFromLocation({ hash: "#/resumen" }), "");
  assert.equal(getVerifyTokenFromLocation({ hash: "#/verify-email?token=" }), "");
  assert.equal(getVerifyTokenFromLocation({}), "");
});

test("verify-email route matches hash and plain path only", () => {
  assert.equal(isVerifyEmailLocation({ hash: "#/verify-email?token=a" }), true);
  assert.equal(isVerifyEmailLocation({ hash: "#/verify-email" }), true);
  assert.equal(isVerifyEmailLocation({ pathname: "/verify-email" }), true);
  assert.equal(isVerifyEmailLocation({ hash: "#/resumen" }), false);
  assert.equal(isVerifyEmailLocation({}), false);
});

test("login 403 Email not verified is detected from body or message", () => {
  assert.equal(isEmailNotVerifiedError({ status: 403, body: { error: "Email not verified" } }), true);
  assert.equal(isEmailNotVerifiedError({ status: 403, message: "Email not verified" }), true);
  assert.equal(isEmailNotVerifiedError({ status: 403, body: "Email not verified" }), true);
  assert.equal(isEmailNotVerifiedError({ status: 401, body: { error: "Email not verified" } }), false);
  assert.equal(isEmailNotVerifiedError({ status: 403, body: { error: "Bad credentials" } }), false);
});

test("expired or reused token is the 400 Invalid or expired token", () => {
  assert.equal(isInvalidTokenError({ status: 400, body: { error: "Invalid or expired token" } }), true);
  assert.equal(isInvalidTokenError({ status: 400, message: "Invalid or expired token" }), true);
  assert.equal(isInvalidTokenError({ status: 400, body: { error: "Bad request" } }), false);
  assert.equal(isInvalidTokenError({ status: 403, body: { error: "Invalid or expired token" } }), false);
});

test("only an explicit true flag holds the user at the inbox message", () => {
  assert.equal(registerRequiresVerification({ emailVerificationRequired: true }), true);
  assert.equal(registerRequiresVerification({ emailVerificationRequired: false }), false);
  assert.equal(registerRequiresVerification({}), false);
  assert.equal(registerRequiresVerification(null), false);
});

test("API errors map to the Spanish messages from the contract", () => {
  assert.match(
    authErrorMessage({ status: 403, message: "Email not verified" }),
    /aún no está verificado/,
  );
  assert.equal(authErrorMessage({ status: 400, message: "Invalid or expired token" }), VERIFY_MESSAGES.expired);
  assert.equal(authErrorMessage({ status: 409, message: "El correo ya está registrado." }), "El correo ya está registrado.");
});
