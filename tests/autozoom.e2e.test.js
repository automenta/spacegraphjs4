const puppeteer = require('puppeteer');
const { toMatchImageSnapshot } = require('jest-image-snapshot');

expect.extend({ toMatchImageSnapshot });

describe('AutoZoom', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.goto('http://localhost:5173'); // Assuming Vite's default port
    });

    afterAll(async () => {
        await browser.close();
    });

    it('should render the initial scene', async () => {
        const image = await page.screenshot();
        expect(image).toMatchImageSnapshot();
    });

    it('should zoom to an element on click', async () => {
        await page.waitForSelector('#spacegraph-container');

        // Move mouse to the first node and click
        await page.mouse.move(300, 200); // Approximate position of node1
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for hover effect
        await page.mouse.click(300, 200);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for zoom animation

        const image = await page.screenshot();
        expect(image).toMatchImageSnapshot();
    });
});