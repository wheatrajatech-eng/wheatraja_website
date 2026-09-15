const fs = require("node:fs/promises");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

async function main() {
  const children = [];
  let browser;
  const results = [];
  const reportDir = path.resolve("docs/audit/dashboard-responsive");
  async function start(command, args, port, readyPath) {
    await new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.once("error", reject);
      probe.listen(port, () => probe.close(resolve));
    });
    const child = spawn(command, args, { windowsHide: true, stdio: "ignore" });
    children.push(child);
    for (let n = 0; n < 60; n++) {
      if (child.exitCode !== null) throw new Error(`Server on ${port} exited: ${child.exitCode}`);
      try { if ((await fetch(`http://localhost:${port}${readyPath}`)).ok) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error(`Server on ${port} did not start`);
  }
  try {
    await fs.mkdir(reportDir, { recursive: true });
    await start(path.resolve("apps/api/venv/Scripts/python.exe"), ["scripts/dashboard-audit-api.py"], 8001, "/__audit/session/customer");
    for (const [app, port] of [["website", 3100], ["admin", 3101]]) {
      await start(process.execPath, [require.resolve("next/dist/bin/next"), "start", `apps/${app}`, "-p", String(port)], port, "/login");
    }
    browser = await chromium.launch({ headless: true });
    const adminSource = await fs.readFile("apps/admin/lib/admin-config.ts", "utf8");
    const adminRoutes = [...adminSource.matchAll(/href: "([^"]+)"/g)].map(match => match[1]);
    adminRoutes.push("/customers/9000000002");
    const entries = await fs.readdir("apps/website/app/account", { withFileTypes: true });
    const userRoutes = ["/account", ...entries.filter(entry => entry.isDirectory()).map(entry => `/account/${entry.name}`), "/account/orders/WRAUDIT1"];
    for (const [role, port, routes] of [["customer", 3100, userRoutes], ["admin", 3101, adminRoutes]]) {
      const { token } = await (await fetch(`http://localhost:8001/__audit/session/${role}`)).json();
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await context.addCookies([{ name: "wr_access", value: token, domain: "localhost", path: "/" }, { name: "wr_csrf", value: "audit", domain: "localhost", path: "/" }]);
      for (const route of routes) {
        const page = await context.newPage();
        const errors = [], apiFailures = [], calls = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("response", response => {
          if (response.url().includes(":8001/api/")) {
            calls.push({ path: new URL(response.url()).pathname, status: response.status() });
            if (response.status() >= 400) apiFailures.push(`${response.status()} ${new URL(response.url()).pathname}`);
          }
        });
        page.on("requestfailed", request => {
          if (request.url().includes(":8001/api/")) apiFailures.push(`${new URL(request.url()).pathname}: ${request.failure()?.errorText}`);
        });
        let status = null, failure = null;
        try {
          const response = await page.goto(`http://localhost:${port}${route}`, { waitUntil: "networkidle", timeout: 30000 });
          status = response.status();
          await page.locator("h1,h2").first().waitFor({ timeout: 5000 });
        } catch (error) { failure = error.message.slice(0, 240); }
        const headings = await page.locator("h1,h2").allTextContents();
        const notices = (await page.locator("body").innerText()).split("\n").filter(line => /unavailable|could not|unable to|not reachable|error|not found/i.test(line)).slice(0, 12);
        const widths = [];
        for (const width of [320, 390, 768, 1024, 1440, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          const measured = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, viewport: innerWidth }));
          widths.push({ width, ...measured, overflow: measured.actual > measured.viewport + 4 });
        }
        await page.setViewportSize({ width: 390, height: 844 });
        const result = { role, route, status, finalPath: new URL(page.url()).pathname, headings, errors, apiFailures, calls, notices, failure, widths };
        results.push(result);
        await page.screenshot({ path: path.join(reportDir, `${role}-${route.replaceAll("/", "_")}.png`), fullPage: true });
        console.log(JSON.stringify(result));
        await page.close();
      }
      await context.close();
    }
    await fs.writeFile(path.join(reportDir, "results.json"), JSON.stringify(results, null, 2));
  } finally {
    if (browser) await browser.close();
    for (const child of children) child.kill();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
