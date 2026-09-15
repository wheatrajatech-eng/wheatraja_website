const { chromium } = require("playwright");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await desktop.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 30000 });
  await desktop.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
  const videoState = await desktop.locator("video").first().evaluate((video) => ({
    currentSrc: video.currentSrc,
    readyState: video.readyState,
    paused: video.paused,
    poster: video.poster
  }));
  await desktop.screenshot({ path: "docs/homepage-desktop-redesign.png", fullPage: false });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 30000 });
  await mobile.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await mobile.screenshot({ path: "docs/homepage-mobile-redesign.png", fullPage: false });
  await mobile.goto("http://localhost:3000/products/mp-sharbati-atta", { waitUntil: "domcontentloaded", timeout: 30000 });
  await mobile.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
  const pdpMobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  await mobile.screenshot({ path: "docs/pdp-mobile-redesign.png", fullPage: false });

  await browser.close();
  console.log(JSON.stringify({ videoState, mobileOverflow, pdpMobileOverflow }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
