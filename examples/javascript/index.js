/**
 * AtheryX SDK — JavaScript / Node.js
 *
 * Minimal, dependency-free client for the AtheryX public API.
 * Base URL: https://atheryxauth.cc/api/v1.1
 *
 * Requires Node 18+ (global fetch). Uses node:crypto for the variable
 * payload encryption — see the "Payload encryption" section of
 * docs/api-reference.md.
 */

import crypto from "node:crypto";

const API_BASE = "https://atheryxauth.cc/api/v1.1";

const CONFIG = {
  ownerId: "YOUR_OWNER_ID",
  appName: "YOUR_APP_NAME",
  secret: "YOUR_APP_SECRET",
};

async function call(endpoint, body) {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "AtheryX request failed");
  return data;
}

/* ------------------------------------------------------------------ *
 * Payload encryption (variables only)
 *
 *   key      = SHA-256(enckey)
 *   envelope = base64( iv ‖ AES-256-CBC(plaintext, key) )
 *   hmac     = HMAC-SHA256(ciphertext, key).hex.slice(0, 32)
 * ------------------------------------------------------------------ */

const keyFrom = (enckey) => crypto.createHash("sha256").update(enckey).digest();

function encryptJson(enckey, obj) {
  const key = keyFrom(enckey);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const ct = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(obj), "utf8")),
    cipher.final(),
  ]);
  const envelope = Buffer.concat([iv, ct]);
  const hmac = crypto.createHmac("sha256", key).update(ct).digest("hex").slice(0, 32);
  return { encrypted: envelope.toString("base64"), hmac };
}

function decryptEnvelope(enckey, base64Payload, hmac) {
  const key = keyFrom(enckey);
  const raw = Buffer.from(base64Payload, "base64");
  const iv = raw.subarray(0, 16);
  const ct = raw.subarray(16);
  const expected = crypto.createHmac("sha256", key).update(ct).digest("hex").slice(0, 32);
  if (expected !== hmac) throw new Error("Invalid signature");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(plain.toString("utf8"));
}

/* ------------------------------------------------------------------ *
 * Session
 * ------------------------------------------------------------------ */

/** Open an authenticated app session. Returns { session_id, refresh_token, enckey, ... }. */
async function init(cfg = CONFIG) {
  return call("init", {
    owner_id: cfg.ownerId,
    app_name: cfg.appName,
    secret: cfg.secret,
  });
}

/** Rotate the session token. */
async function refreshSession(sessionId, refreshToken) {
  return call("session/refresh", { session_id: sessionId, refresh_token: refreshToken });
}

/* ------------------------------------------------------------------ *
 * Users
 * ------------------------------------------------------------------ */

/** Register a new user with a license key. */
async function register(sessionId, username, password, key, email = "", hwid = "") {
  return call("register", { session_id: sessionId, username, password, key, email, hwid });
}

/** Authenticate a user. */
async function login(sessionId, username, password, hwid = "") {
  return call("login", { session_id: sessionId, username, password, hwid });
}

/**
 * Set the password on a reseller/free-issued account that still carries a
 * one-time setup code.
 */
async function claimPassword(sessionId, username, setupCode, newPassword) {
  return call("claim-password", {
    session_id: sessionId,
    username,
    setup_code: setupCode,
    new_password: newPassword,
  });
}

/* ------------------------------------------------------------------ *
 * Licenses & logs
 * ------------------------------------------------------------------ */

/** Validate / bind a license key to a hardware ID. */
async function validateLicense(sessionId, licenseKey, hwid = "") {
  return call("licenses", { session_id: sessionId, license_key: licenseKey, hwid });
}

/** Push an application log line. */
async function pushLog(sessionId, message) {
  return call("logs", { session_id: sessionId, message });
}

/* ------------------------------------------------------------------ *
 * Variables (encrypted)
 * ------------------------------------------------------------------ */

/** Read an app variable, decrypting the response with the session enckey. */
async function getVariable(sessionId, enckey, varKey) {
  const res = await call("variables", { session_id: sessionId, var_key: varKey });
  const payload = decryptEnvelope(enckey, res.data, res.hmac);
  return payload.variable.var_value;
}

/** Write an app variable. The payload is encrypted and HMAC-signed. */
async function setVariable(sessionId, enckey, varKey, varValue) {
  const { encrypted, hmac } = encryptJson(enckey, {
    session_id: sessionId,
    var_key: varKey,
    var_value: varValue,
  });
  return call("variables/set", { session_id: sessionId, encrypted, hmac });
}

/* ------------------------------------------------------------------ */

async function main() {
  const { session_id, enckey } = await init();
  console.log("Session:", session_id);

  const loginRes = await login(session_id, "demo_user", "ChangeMe123!", "my-device-id");
  console.log("Logged in as:", loginRes.username);

  const lic = await validateLicense(session_id, "LICENSE-KEY-XXXX-XXXX", "my-device-id");
  console.log("License active:", lic.active);

  // Variables round-trip (encrypted on the wire).
  await setVariable(session_id, enckey, "theme", "dark");
  console.log("theme =", await getVariable(session_id, enckey, "theme"));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
