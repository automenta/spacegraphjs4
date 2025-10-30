const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

test.describe('Visual Regression Tests', () => {
    const demos = [
        'comprehensive-demo.html',
        'component-demos.html',
        'use-case-demos.html'
    ];

    for (const demo of demos) {
        test(`should take a screenshot of ${demo}`, async ({ page }) => {
            await page.goto(`file://${path.join(__dirname, '..', 'demo', demo)}`);
            await page.screenshot({ path: path.join(screenshotsDir, `${demo}.png`) });
        });
    }
});
