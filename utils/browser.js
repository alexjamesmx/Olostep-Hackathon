const { chromium } = require("playwright");

async function initializeBrowser() {
  const browser = await chromium.launch();

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    bypassCSP: true,
  });

  return { browser, context };
}

module.exports = { initializeBrowser };
