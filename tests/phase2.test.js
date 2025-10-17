const puppeteer = require('puppeteer');
const { toMatchImageSnapshot } = require('jest-image-snapshot');

expect.extend({ toMatchImageSnapshot });

describe('Phase 2: Dynamic Scene', () => {
    let browser;
    let page;

    beforeEach(async () => {
        browser = await puppeteer.launch({ headless: true });
        page = await browser.newPage();
        await page.goto('http://localhost:5173');
    });

    afterEach(async () => {
        await page.close();
        await browser.close();
    });

    // Helper to get a screenshot of the container
    const getScreenshot = async () => {
        const container = await page.$('#spacegraph-container');
        return await container.screenshot();
    };

    it('should render the initial dynamic scene', async () => {
        const image = await getScreenshot();
        expect(image).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });
    });

    it('should add a new element to the scene', async () => {
        await page.evaluate(() => {
            window.graph.add({
                id: 'node3',
                type: 'box',
                position: { x: 0, y: 2, z: 0 },
                color: 0xffff00, // yellow
            });
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for render
        const image = await getScreenshot();
        expect(image).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });
    });

    it('should remove an element from the scene', async () => {
        // For automated testing, we'll use page.evaluate to call the remove method directly
        await page.evaluate(() => {
            window.graph.remove('node1');
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for render
        const image = await getScreenshot();
        expect(image).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });
    });

    it('should update an element in the scene', async () => {
        await page.evaluate(() => {
            window.graph.update('node2', { color: 0x0000ff }); // Change to blue
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for render
        const image = await getScreenshot();
        expect(image).toMatchImageSnapshot({
            failureThreshold: 0.01,
            failureThresholdType: 'percent',
        });
    });
});