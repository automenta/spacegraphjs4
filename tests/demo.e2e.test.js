import puppeteer from 'puppeteer';

const JEST_TIMEOUT = 60000; // 60 seconds
const VITE_PORT = 5173; // Default Vite port

describe('SpaceGraph.js Demo', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();

        // Adjust viewport to match the new layout
        await page.setViewport({ width: 1280, height: 720 });
    }, JEST_TIMEOUT);

    afterAll(async () => {
        await browser.close();
    });

    test('should display the initial demo scene', async () => {
        await page.goto(`http://localhost:${VITE_PORT}`);

        // Wait for the graph to be initialized and rendered
        await page.waitForSelector('#spacegraph-container canvas');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for animations to settle

        const image = await page.screenshot();

        expect(image).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });
    }, JEST_TIMEOUT);
});