const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

async function main() {
  const children = [];
  let browser;
  const rows = [4, 2].map((attempts, index) => ({
    id: index + 1, reminder_schedule_id: index + 1, user_id: 1,
    customer_phone: "9000000002", customer_email: "test@example.com",
    channel: "email", event_type: "reorder_reminder", title: `Refill ${index + 1}`,
    body: "Time to refill", payload: { email: "test@example.com" }, status: "failed",
    attempts, available_at: "2026-09-14T10:00:00Z", kind: "reorder",
  }));
  const api = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const route = url.pathname.replace("/api/v1", "");
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "http://localhost:3100");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Content-Type", "application/json");
    if (req.method === "OPTIONS") return res.end();
    let data = [];
    if (route.startsWith("/auth/")) data = { authenticated: true, role: "admin", phone: "9000000002", name: "Test Buyer", profile_complete: true };
    else if (route === "/reminders/admin/outbox") data = rows.filter(row => !url.searchParams.get("status") || row.status === url.searchParams.get("status"));
    else if (route.endsWith("/timeline")) data = { timeline: [{ source: "notification_event", label: "Delivery attempt", status: "failed", at: "2026-09-14T10:00:00Z" }] };
    else if (route.endsWith("/retry")) {
      data = rows.find(row => route.includes(`/${row.id}/`));
      data.status = "queued";
    } else if (route.startsWith("/users/admin/customers/")) data = { id: 1, name: "Test Buyer", phone: "9000000002", email: "test@example.com", addresses: [], blocked: false };
    else if (route === "/reminders") data = [{ id: 1, kind: "reorder", status: "queued", reminder_at: "2026-09-20T10:00:00Z", payload: { message: "Your refill is coming up." } }];
    res.end(JSON.stringify(data));
  });
  try {
    // Fail if occupied: never replace or send requests to an existing API.
    await new Promise((resolve, reject) => { api.once("error", reject); api.listen(8001, resolve); });
    for (const [app, port] of [["admin", 3101], ["website", 3100]]) {
      const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", path.join("apps", app), "-p", String(port)], { windowsHide: true, stdio: "ignore" });
      children.push(child);
      let ready = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        if (child.exitCode !== null) throw new Error(`${app} server exited`);
        try { ready = (await fetch(`http://localhost:${port}/login`)).ok; } catch {}
        if (ready) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      assert(ready, `${app} did not start`);
    }
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    await context.addCookies([{ name: "wr_access", value: "isolated-test", domain: "localhost", path: "/" }]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("http://localhost:3101/reminder-outbox/failed");
      await page.getByRole("button", { name: "Export CSV (1)", exact: true }).waitFor();
      assert.equal(await page.locator("tbody tr").count(), 2);
      await page.getByRole("button", { name: /Attempts > 3/ }).click();
      assert.equal(await page.locator("tbody tr").count(), 1);
      const downloadEvent = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export CSV (1)", exact: true }).click();
      const download = await downloadEvent;
      const csv = await fs.readFile(await download.path(), "utf8");
      assert(csv.includes("Refill 1") && !csv.includes("Refill 2"));
      await page.getByRole("button", { name: "Inspect", exact: true }).click();
      await page.getByText("Delivery attempt", { exact: true }).waitFor();
      await page.getByRole("link", { name: "Open customer profile" }).click();
      await page.getByRole("heading", { name: "Test Buyer", exact: true }).waitFor();
      await page.goto("http://localhost:3100/account/reminders");
      await page.getByText("Your refill is coming up.", { exact: true }).waitFor();
    }
    await page.goto("http://localhost:3101/reminder-outbox/failed");
    await page.getByRole("button", { name: "Retry", exact: true }).first().click();
    await page.getByText("Row queued for retry.", { exact: true }).waitFor();
    assert.equal(await page.locator("tbody tr").count(), 1);
    assert.deepEqual(errors, []);
    console.log("Dashboard browser smoke passed: desktop/mobile reminders, severity filter, CSV contents, timeline, customer profile, single retry. Uses isolated API fixtures.");
  } finally {
    if (browser) await browser.close();
    for (const child of children) child.kill();
    api.closeAllConnections();
    await new Promise(resolve => api.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
