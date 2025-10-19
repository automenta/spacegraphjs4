import puppeteer from 'puppeteer';

const JEST_TIMEOUT = 60000; // 60 seconds
const VITE_PORT = 5173; // Default Vite port

describe('SpaceGraph.js Kitchen Sink', () => {
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

    test('should display the kitchen sink demo scene', async () => {
        await page.goto(`http://localhost:${VITE_PORT}`);
        await page.waitForSelector('#spacegraph-container canvas');

        // Click the "Kitchen Sink" demo link
        await page.evaluate(() => {
            const demos = Array.from(document.querySelectorAll('li'));
            const kitchenSinkDemo = demos.find(demo => demo.textContent === 'Kitchen Sink');
            if (kitchenSinkDemo) {
                kitchenSinkDemo.click();
            }
        });

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for animations

        const image = await page.screenshot();
        expect(image).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });
    }, JEST_TIMEOUT);

    test('should apply the fisheye effect', async () => {
        await page.goto(`http://localhost:${VITE_PORT}`);
        await page.waitForSelector('#spacegraph-container canvas');

        // Click the "Kitchen Sink" demo link
        await page.evaluate(() => {
            const demos = Array.from(document.querySelectorAll('li'));
            const kitchenSinkDemo = demos.find(demo => demo.textContent === 'Kitchen Sink');
            if (kitchenSinkDemo) {
                kitchenSinkDemo.click();
            }
        });

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for animations

        // Enable the fisheye effect
        await page.evaluate(() => {
            window.graph.config.fisheye.enabled = true;
            window.graph.config.fisheye.strength = 2.5;
            window.graph.config.fisheye.radius = 400;
        });

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for effect to apply

        const image = await page.screenshot();
        expect(image).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });
    }, JEST_TIMEOUT);
});
