
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: './',
    },
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/demo/visual-verification.html');

  // Wait for the UI components to be rendered
  await page.waitForTimeout(3000);

  // Click the button
  await page.click('canvas', { position: { x: 350, y: 250 } });

  // Click the toggle button
  await page.click('canvas', { position: { x: 550, y: 250 } });

  // Click the icon toggle button
  await page.click('canvas', { position: { x: 450, y: 350 } });

  await browser.close();
})();
