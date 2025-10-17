const puppeteer = require('puppeteer');

describe('Phase 1: Static Scene', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();
    });

    afterAll(async () => {
        await browser.close();
    });

    it('should render a static red cube', async () => {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        const container = await page.$('#spacegraph-container');
        const screenshot = await container.screenshot();

        expect(screenshot).toMatchImageSnapshot();
    });
});