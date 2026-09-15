const { chromium } = require("playwright");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });

  const frontend = {
    title: await page.locator("h1").first().innerText(),
    productCount: await page.locator('a[href^="/products/"]').count(),
    heroVisible: await page.locator("text=Fresh Atta, Milled After Your Order").first().isVisible()
  };

  await page.goto("http://localhost:3000/products/mp-sharbati-atta", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Add to Cart/i }).first().click();
  await page.waitForTimeout(500);
  await page.goto("http://localhost:3000/cart", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(500);
  const cartHasItem = await page.locator("text=MP Sharbati Atta").first().isVisible();
  await page.goto("http://localhost:3001", { waitUntil: "domcontentloaded", timeout: 30000 });
  const adminLoaded = await page.locator("text=Wheat Raja Admin").first().isVisible();
  const fakeContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await fakeContext.addCookies([{ name: "wr_access", value: "fake-cookie", domain: "localhost", path: "/" }]);
  const fakePage = await fakeContext.newPage();
  await fakePage.goto("http://localhost:3001", { waitUntil: "domcontentloaded", timeout: 30000 });
  const fakeCookieReachedAdmin = await fakePage.locator("text=Live command center").first().isVisible();
  const adminRejectsFakeCookie = !fakeCookieReachedAdmin;
  await fakeContext.close();
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.screenshot({ path: "docs/homepage-smoke.png", fullPage: false });
  await browser.close();

  const apiResponse = await fetch("http://localhost:8001/health");
  const api = await apiResponse.json();

  if (!adminRejectsFakeCookie) {
    throw new Error("Admin accepted a fake wr_access cookie.");
  }

  console.log(JSON.stringify({ frontend: { ...frontend, cartHasItem }, admin: { adminLoaded, adminRejectsFakeCookie }, api }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
