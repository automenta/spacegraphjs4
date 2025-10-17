const puppeteer = require('puppeteer');
const { toMatchImageSnapshot } = require('jest-image-snapshot');

expect.extend({ toMatchImageSnapshot });

describe('AutoZoom Workflow', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();
        // Increase viewport size for more stable screenshots
        await page.setViewport({ width: 800, height: 600 });
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    });

    afterAll(async () => {
        await browser.close();
    });

    it('should correctly perform the entire zoom-in and zoom-out workflow', async () => {
        // 1. Initial Scene
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow scene to settle
        const initialImage = await page.screenshot();
        expect(initialImage).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
            customSnapshotIdentifier: 'initial-scene'
        });

        // 2. Zoom to an element on first click
        await page.waitForSelector('#spacegraph-container');
        // These coordinates should reliably be over an element.
        const clickX = 400;
        const clickY = 300;

        await page.mouse.move(clickX, clickY);
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for hover
        await page.mouse.click(clickX, clickY);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for zoom-in animation

        const zoomedInImage = await page.screenshot();
        expect(zoomedInImage).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
            customSnapshotIdentifier: 'zoomed-in-scene'
        });

        // 3. Zoom back out on second click
        // A second click on the same spot should trigger goBack().
        await page.mouse.click(clickX, clickY);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for zoom-out animation

        const zoomedOutImage = await page.screenshot();
        expect(zoomedOutImage).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
            customSnapshotIdentifier: 'zoomed-out-scene'
        });

        // The visual state should be extremely close to the initial state.
        // We rely on the snapshot comparison for this, as a direct buffer comparison
        // can be too brittle due to floating point inaccuracies in rendering.
        // By using the same snapshot identifier, we assert it returns to the initial state.
        expect(zoomedOutImage).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
            customSnapshotIdentifier: 'initial-scene'
        });
    });
});