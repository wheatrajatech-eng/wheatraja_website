// Real-browser mutations against the disposable API fixture, never production data.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

async function main() {
  const children = [], passed = [], errors = [];
  let browser;
  async function start(command, args, port, ready) {
    await new Promise((resolve, reject) => { const probe = net.createServer(); probe.once("error", reject); probe.listen(port, () => probe.close(resolve)); });
    const child = spawn(command, args, { windowsHide: true, stdio: "ignore" }); children.push(child);
    for (let i = 0; i < 60; i++) {
      if (child.exitCode !== null) throw Error(`Server ${port} exited`);
      try { if ((await fetch(`http://localhost:${port}${ready}`)).ok) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw Error(`Server ${port} unavailable`);
  }
  async function api(context, method, endpoint, data) {
    const response = await context.request.fetch(`http://localhost:8001/api/v1${endpoint}`, { method, data, headers: { "X-CSRF-Token": "audit" } });
    assert(response.ok(), `${endpoint}: ${response.status()} ${await response.text()}`);
    return response.json();
  }
  async function saved(page, name = "Save changes") {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Save completed." }).waitFor();
  }
  try {
    await start(path.resolve("apps/api/venv/Scripts/python.exe"), ["scripts/dashboard-audit-api.py"], 8001, "/__audit/session/customer");
    for (const [app, port] of [["website", 3100], ["admin", 3101]]) await start(process.execPath, [require.resolve("next/dist/bin/next"), "start", `apps/${app}`, "-p", String(port)], port, "/login");
    browser = await chromium.launch({ headless: true });
    const contexts = {};
    for (const role of ["customer", "admin"]) {
      const { token } = await (await fetch(`http://localhost:8001/__audit/session/${role}`)).json();
      contexts[role] = await browser.newContext({ viewport: { width: 390, height: 844 } });
      contexts[role].setDefaultTimeout(30000);
      await contexts[role].addCookies([{ name: "wr_access", value: token, domain: "localhost", path: "/" }, { name: "wr_csrf", value: "audit", domain: "localhost", path: "/" }]);
    }
    const customer = await contexts.customer.newPage(), admin = await contexts.admin.newPage();
    for (const page of [customer, admin]) page.on("pageerror", e => errors.push(e.message));
    for (const status of ["placed", "milling", "packed", "shipped", "out_for_delivery", "delivered"]) {
      await api(contexts.admin, "PATCH", "/orders/admin/WRAUDIT1/status", { status });
      await customer.goto("http://localhost:3100/account/tracking", { waitUntil: "domcontentloaded" });
      const current = customer.locator('[aria-current="step"]');
      await current.first().waitFor();
      assert.equal(await current.count(), 1);
      assert((await current.innerText()).toLowerCase().replaceAll(" ", "_").includes(status));
    }
    passed.push("Tracking: all six status highlights"); console.log(passed.at(-1));
    await customer.goto("http://localhost:3100/account/support", { waitUntil: "networkidle" });
    await customer.getByPlaceholder("Subject", { exact: true }).fill("Browser test request");
    await customer.getByPlaceholder("Explain what happened").fill("Please check my test delivery.");
    await customer.getByRole("button", { name: "Create Ticket", exact: true }).click();
    await customer.getByRole("status").filter({ hasText: "created." }).waitFor();
    passed.push("Customer support ticket creation");
    await admin.goto("http://localhost:3101/support", { waitUntil: "networkidle" });
    await admin.getByRole("button", { name: "Manage", exact: true }).first().click();
    await admin.getByLabel("Status", { exact: true }).selectOption("resolved");
    await admin.getByLabel("Resolution / reply notes").fill("Resolved through browser audit");
    await saved(admin);
    assert.equal((await api(contexts.admin, "GET", "/growth/admin/support"))[0].status, "resolved");
    passed.push("Admin support resolution persisted");
    await api(contexts.customer, "POST", "/reviews", { slug: "mp-sharbati-atta", rating: 5, comment: "Browser test review" });
    await admin.goto("http://localhost:3101/reviews", { waitUntil: "networkidle" });
    await admin.getByRole("button", { name: "Manage", exact: true }).first().click();
    await admin.getByLabel("Published / approved").check(); await saved(admin);
    await admin.getByRole("button", { name: "Manage", exact: true }).first().click();
    await admin.getByRole("button", { name: "Delete record", exact: true }).click();
    await admin.getByRole("dialog").getByRole("button", { name: "Confirm", exact: true }).click();
    await admin.getByRole("status").filter({ hasText: "Delete record permanently completed." }).waitFor();
    passed.push("Review approval and confirmed deletion");
    await admin.goto("http://localhost:3101/subscriptions", { waitUntil: "networkidle" });
    await admin.getByRole("button", { name: "Manage", exact: true }).first().click();
    await admin.getByLabel("Quantity", { exact: true }).fill("2"); await saved(admin);
    assert.equal((await api(contexts.admin, "GET", "/subscriptions/admin/upcoming"))[0].quantity, 2);
    await admin.getByRole("button", { name: "Manage", exact: true }).first().click();
    await admin.getByRole("button", { name: "Pause", exact: true }).click();
    await admin.getByRole("dialog").getByRole("button", { name: "Confirm", exact: true }).click();
    await admin.getByRole("status").filter({ hasText: "Pause plan completed." }).waitFor();
    assert.equal((await api(contexts.admin, "GET", "/subscriptions/admin/upcoming"))[0].status, "paused");
    passed.push("Subscription quantity and pause persisted");
    await admin.goto("http://localhost:3101/delivery-slots", { waitUntil: "networkidle" });
    await admin.getByRole("button", { name: "Create new", exact: true }).click();
    for (const [label, value] of [["Zone", "Browser audit"], ["Pincode", "201301"], ["Starts at", "2027-01-20T10:00"], ["Ends at", "2027-01-20T12:00"], ["Capacity", "5"]]) await admin.getByLabel(label, { exact: true }).fill(value);
    await saved(admin, "Create record");
    assert((await api(contexts.admin, "GET", "/admin/delivery-slots")).some(row => row.zone === "Browser audit"));
    passed.push("Delivery slot creation persisted");
    await admin.goto("http://localhost:3101/contact", { waitUntil: "networkidle" });
    await admin.getByRole("button", { name: "Manage", exact: true }).first().click();
    await admin.getByLabel("Status", { exact: true }).selectOption("closed"); await saved(admin);
    assert.equal((await api(contexts.admin, "GET", "/admin/contact"))[0].status, "closed");
    passed.push("Contact status persisted");
    await admin.goto("http://localhost:3101/recoveries", { waitUntil: "networkidle" });
    await admin.getByRole("button", { name: "Manage", exact: true }).first().click();
    await admin.getByLabel("Follow-up status").selectOption("reminded");
    await admin.getByLabel("Follow-up channel").selectOption("phone"); await saved(admin);
    assert.equal((await api(contexts.admin, "GET", "/growth/admin/recoveries"))[0].status, "reminded");
    passed.push("Recovery follow-up persisted without sending messages");
    await admin.goto("http://localhost:3101/users", { waitUntil: "networkidle" });
    await admin.getByRole("button", { name: "Create new", exact: true }).click();
    await admin.getByLabel("Phone", { exact: true }).fill("9000000004");
    await admin.getByLabel("Name", { exact: true }).fill("Browser audit user");
    await admin.getByLabel("Account type").selectOption("customer");
    await admin.getByRole("button", { name: "Create record", exact: true }).click();
    await admin.getByRole("dialog").getByRole("button", { name: "Confirm", exact: true }).click();
    await admin.getByRole("status").filter({ hasText: "Save account access completed." }).waitFor();
    assert((await api(contexts.admin, "GET", "/users/admin/accounts")).some(row => row.phone === "9000000004"));
    passed.push("User creation with access confirmation persisted");
    for (const [page, context, port, route] of [[customer, contexts.customer, 3100, "/account"], [admin, contexts.admin, 3101, "/dashboard"]]) {
      await page.goto(`http://localhost:${port}${route}`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /sign out/i }).click();
      await page.waitForURL(/\/login/);
      assert(!(await context.cookies()).some(cookie => cookie.name === "wr_access"));
      await page.goto(`http://localhost:${port}${route}`, { waitUntil: "networkidle" });
      assert(new URL(page.url()).pathname === "/login");
      passed.push(`${port === 3100 ? "Customer" : "Admin"} logout clears session and protects dashboard`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await fs.mkdir("docs/audit/dashboard-actions", { recursive: true });
    await fs.writeFile("docs/audit/dashboard-actions/results.json", JSON.stringify({ passed, errors }, null, 2));
    if (browser) await browser.close();
    for (const child of children) child.kill();
  }
  console.log(JSON.stringify({ passed, errors }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
