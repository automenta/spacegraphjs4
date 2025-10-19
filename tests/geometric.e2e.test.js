import puppeteer from 'puppeteer';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

const JEST_TIMEOUT = 60000; // 60 seconds
const VITE_PORT = process.env.VITE_PORT || 5173;

describe('SpaceGraph.js Geometric Demo', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
    }, JEST_TIMEOUT);

    afterAll(async () => {
        await browser.close();
    });

    test('should auto-zoom to fit the geometric demo scene', async () => {
        await page.goto(`http://localhost:${VITE_PORT}`);
        await page.waitForSelector('#spacegraph-container canvas');

        // Click the "Geometric" demo link
        await page.evaluate(() => {
            const demoLink = Array.from(document.querySelectorAll('#demo-list li')).find(el => el.textContent === 'Geometric');
            if (demoLink) {
                demoLink.click();
            }
        });

        // Wait for the demo to load and camera to settle
        await new Promise(resolve => setTimeout(resolve, 2000));

        // The flyTo() is called by default on load, so we just need to take a screenshot
        const image = await page.screenshot();

        expect(image).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });
    }, JEST_TIMEOUT);
});
