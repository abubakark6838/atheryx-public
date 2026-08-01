#!/usr/bin/env python3
"""AtheryX SDK — Python.

Minimal, stdlib-only client for the AtheryX public API.
Base URL: https://atheryxauth.cc/api/v1.1
"""

import json
import urllib.request

API_BASE = "https://atheryxauth.cc/api/v1.1"

CONFIG = {
    "owner_id": "YOUR_OWNER_ID",
    "app_name": "YOUR_APP_NAME",
    "secret": "YOUR_APP_SECRET",
}


def _call(endpoint: str, payload: dict) -> dict:
    req = urllib.request.Request(
        f"{API_BASE}/{endpoint}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode("utf-8"))
    if not data.get("success"):
        raise RuntimeError(data.get("message", "AtheryX request failed"))
    return data


def init(cfg: dict = CONFIG) -> dict:
    return _call("init", {
        "owner_id": cfg["owner_id"],
        "app_name": cfg["app_name"],
        "secret": cfg["secret"],
    })


def login(session_id: str, username: str, password: str, hwid: str = "") -> dict:
    return _call("login", {
        "session_id": session_id,
        "username": username,
        "password": password,
        "hwid": hwid,
    })


def register(session_id: str, username: str, password: str, key: str,
             email: str = "", hwid: str = "") -> dict:
    return _call("register", {
        "session_id": session_id,
        "username": username,
        "password": password,
        "key": key,
        "email": email,
        "hwid": hwid,
    })


def validate_license(session_id: str, license_key: str, hwid: str = "") -> dict:
    return _call("licenses", {
        "session_id": session_id,
        "license_key": license_key,
        "hwid": hwid,
    })


def refresh_session(session_id: str, refresh_token: str) -> dict:
    return _call("session/refresh", {
        "session_id": session_id,
        "refresh_token": refresh_token,
    })


def main() -> None:
    session = init()
    session_id = session["session_id"]
    print("Session:", session_id)

    user = login(session_id, "demo_user", "ChangeMe123!", hwid="my-device-id")
    print("Logged in as:", user["username"])

    lic = validate_license(session_id, "LICENSE-KEY-XXXX-XXXX", hwid="my-device-id")
    print("License active:", lic["active"])


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print("Error:", exc)
