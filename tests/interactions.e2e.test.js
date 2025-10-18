import puppeteer from 'puppeteer';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

const JEST_TIMEOUT = 60000; // 60 seconds
const VITE_PORT = 5173; // Default Vite port

describe('SpaceGraph.js Interactions', () => {
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

    test('should show tooltip on hover and zoom on scroll', async () => {
        await page.goto(`http://localhost:${VITE_PORT}`);
        await page.waitForSelector('#spacegraph-container canvas');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for layout to settle

        // Find a position to hover over a node (approximate center of the view)
        const hoverX = 1280 / 2 - 150; // Adjusting for sidebar
        const hoverY = 720 / 2;

        // --- 1. Test Tooltip ---
        await page.mouse.move(hoverX, hoverY);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for tooltip

        let image = await page.screenshot();
        expect(image).toMatchImageSnapshot({
            customSnapshotIdentifier: 'tooltip-visible',
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });

        // --- 2. Test AutoZoom ---
        await page.mouse.wheel({ deltaY: -100 }); // Zoom in
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for zoom

        image = await page.screenshot();
        expect(image).toMatchImageSnapshot({
            customSnapshotIdentifier: 'zoomed-in',
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });
    }, JEST_TIMEOUT);
});
