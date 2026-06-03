const { chromium } = require("./node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errs = [];
  page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  page.on("requestfailed", r => errs.push("FAIL: " + r.url() + " - " + r.failure().errorText));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4200/", { timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log("ERRORS:", JSON.stringify(errs.slice(0,10)));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
