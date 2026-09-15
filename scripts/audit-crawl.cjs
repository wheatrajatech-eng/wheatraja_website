const { chromium } = require("playwright");

const routes = [
  "/", "/products", "/products/mp-sharbati-atta", "/products/super-multigrain-atta",
  "/products/sehori-sharbati-atta", "/cart", "/checkout", "/blog",
  "/blog/fresh-milled-atta-vs-stored-atta", "/about", "/contact", "/delivery",
  "/subscription", "/reviews", "/login", "/account", "/account/orders",
  "/account/tracking", "/account/addresses", "/account/wallet", "/account/refer",
  "/account/profile", "/admin", "/admin/orders", "/admin/products",
  "/admin/inventory", "/admin/customers", "/admin/coupons", "/admin/offers",
  "/admin/delivery-radius", "/admin/subscriptions", "/admin/wallet",
  "/admin/referrals", "/admin/reviews", "/admin/blog", "/admin/notifications",
  "/admin/analytics", "/admin/settings"
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const results = [];

  for (const route of routes) {
    const response = await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle", timeout: 30000 });
    const headings = await page.locator("h1,h2").evaluateAll((nodes) => nodes.slice(0, 6).map((node) => node.textContent.trim()));
    const buttons = await page.locator("button,a").evaluateAll((nodes) => nodes.slice(0, 14).map((node) => ({
      text: node.textContent.trim(),
      href: node.getAttribute("href")
    })));
    const inputs = await page.locator("input,textarea").count();
    const status = response ? response.status() : null;
    const bodyText = await page.locator("body").innerText();
    results.push({ route, status, headings, buttons, inputs, chars: bodyText.length });
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
