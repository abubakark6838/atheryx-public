// AtheryX SDK — C++
//
// Minimal example using cpp-httplib + nlohmann/json (add both as dependencies).
// Base URL: https://atheryxauth.cc/api/v1.1

#include <httplib.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <string>

using json = nlohmann::json;

const std::string API_HOST = "atheryxauth.cc";

json Call(const std::string& endpoint, const json& payload) {
    httplib::Client cli(API_HOST, 443);
    cli.enable_server_certificate_verification(true);

    auto res = cli.Post(
        "/api/v1.1/" + endpoint,
        payload.dump(),
        "application/json");

    if (!res || res->status != 200) throw std::runtime_error("AtheryX request failed");
    auto data = json::parse(res->body);

    if (!data.value("success", false))
        throw std::runtime_error(data.value("message", "AtheryX request failed"));
    return data;
}

int main() {
    try {
        // 1. Open a session
        auto session = Call("init", {
            {"owner_id", "YOUR_OWNER_ID"},
            {"app_name", "YOUR_APP_NAME"},
            {"secret", "YOUR_APP_SECRET"},
        });
        std::string session_id = session["session_id"];
        std::cout << "Session: " << session_id << std::endl;

        // 2. Login
        auto user = Call("login", {
            {"session_id", session_id},
            {"username", "demo_user"},
            {"password", "ChangeMe123!"},
            {"hwid", "my-device-id"},
        });
        std::cout << "Logged in as: " << user["username"] << std::endl;

        // 3. Validate license
        auto lic = Call("licenses", {
            {"session_id", session_id},
            {"license_key", "LICENSE-KEY-XXXX-XXXX"},
            {"hwid", "my-device-id"},
        });
        std::cout << "License active: " << (lic["active"] ? "true" : "false") << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    return 0;
}
