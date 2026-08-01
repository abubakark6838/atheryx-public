// AtheryX SDK — C# (.NET)
//
// Minimal HTTP client using System.Net.Http.Json.
// Base URL: https://atheryxauth.cc/api/v1.1

using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

class Program
{
    private const string ApiBase = "https://atheryxauth.cc/api/v1.1";
    private static readonly HttpClient Client = new();

    static async Task<Dictionary<string, object>> CallAsync(string endpoint, object payload)
    {
        var res = await Client.PostAsJsonAsync($"{ApiBase}/{endpoint}", payload);
        var data = await res.Content.ReadFromJsonAsync<Dictionary<string, object>>();

        if (data != null && data.TryGetValue("success", out var ok) && ok is true)
            return data;

        var msg = data != null && data.TryGetValue("message", out var m) ? m?.ToString() : "AtheryX request failed";
        throw new Exception(msg);
    }

    static async Task Main()
    {
        // 1. Open a session
        var session = await CallAsync("init", new
        {
            owner_id = "YOUR_OWNER_ID",
            app_name = "YOUR_APP_NAME",
            secret = "YOUR_APP_SECRET",
        });
        var sessionId = session["session_id"]?.ToString();
        Console.WriteLine("Session: " + sessionId);

        // 2. Login
        var user = await CallAsync("login", new
        {
            session_id = sessionId,
            username = "demo_user",
            password = "ChangeMe123!",
            hwid = "my-device-id",
        });
        Console.WriteLine("Logged in as: " + user["username"]);

        // 3. Validate license
        var lic = await CallAsync("licenses", new
        {
            session_id = sessionId,
            license_key = "LICENSE-KEY-XXXX-XXXX",
            hwid = "my-device-id",
        });
        Console.WriteLine($"License active: {lic["active"]}");
    }
}
