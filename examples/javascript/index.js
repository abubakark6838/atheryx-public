/**
 * AtheryX SDK — JavaScript / Node.js
 *
 * Minimal, dependency-free client for the AtheryX public API.
 * Base URL: https://atheryxauth.cc/api/v1.1
 */

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

/** Open an authenticated app session. */
async function init(cfg = CONFIG) {
  return call("init", {
    owner_id: cfg.ownerId,
    app_name: cfg.appName,
    secret: cfg.secret,
  });
}

/** Authenticate a user. */
async function login(sessionId, username, password, hwid = "") {
  return call("login", { session_id: sessionId, username, password, hwid });
}

/** Register a new user with a license key. */
async function register(sessionId, username, password, key, email = "", hwid = "") {
  return call("register", { session_id: sessionId, username, password, key, email, hwid });
}

/** Validate / bind a license key to a hardware ID. */
async function validateLicense(sessionId, licenseKey, hwid = "") {
  return call("licenses", { session_id: sessionId, license_key: licenseKey, hwid });
}

/** Rotate the session token. */
async function refreshSession(sessionId, refreshToken) {
  return call("session/refresh", { session_id: sessionId, refresh_token: refreshToken });
}

async function main() {
  const { session_id } = await init();
  console.log("Session:", session_id);

  const loginRes = await login(session_id, "demo_user", "ChangeMe123!", "my-device-id");
  console.log("Logged in as:", loginRes.username);

  const lic = await validateLicense(session_id, "LICENSE-KEY-XXXX-XXXX", "my-device-id");
  console.log("License active:", lic.active);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
