const puppeteer = require('puppeteer');
const { toMatchImageSnapshot } = require('jest-image-snapshot');

expect.extend({ toMatchImageSnapshot });

describe('HTML Element Interaction and Lifecycle', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();

        // Log browser console messages to the terminal
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        await page.setViewport({ width: 800, height: 600 });

        // Go to the page and wait for it to be ready
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

        // Clear the container and initialize SpaceGraph for the tests
        await page.evaluate(() => {
            const container = document.getElementById('spacegraph-container');
            if (window.graph) {
                window.graph.destroy();
            }
            container.innerHTML = ''; // Clear content from previous runs
            const graph = new window.SpaceGraph(container, {
                elements: [
                    { id: 'box1', type: 'box', position: { x: -2, y: 0, z: 0 }, size: 1.5, color: 0xff0000 },
                    { id: 'html1', type: 'html', position: { x: 2, y: 1, z: 0 }, htmlContent: '<div id="my-html-element" style="color: cyan; padding: 10px; border-radius: 5px; background-color: rgba(0,20,40,0.8);">HTML Content</div>' }
                ]
            });
            window.graph = graph; // Expose for tests
        });
    });

    afterAll(async () => {
        await browser.close();
    });

    it('should render HTML elements correctly alongside geometric ones', async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow scene to settle
        const image = await page.screenshot();
        expect(image).toMatchImageSnapshot({
            failureThreshold: 0.02,
            failureThresholdType: 'percent',
            customSnapshotIdentifier: 'html-element-initial-render'
        });
    });

    it('should dispatch "element:click" event when an HTML element is clicked', async () => {
        // Add an event listener inside the browser that modifies the DOM on click.
        // This is more reliable than using exposeFunction for verifying events.
        await page.evaluate(() => {
            window.graph.on('element:click', (e) => {
                const el = document.getElementById('my-html-element');
                if (el) {
                    // Change the DOM to signal that the event was received.
                    el.textContent = `Event Received: ${e.id}`;
                }
            });
        });

        // Use page.click(selector) for a more reliable click simulation
        await page.click('#my-html-element');

        // Wait for the DOM change to apply
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify the DOM was changed as expected
        const newContent = await page.$eval('#my-html-element', el => el.textContent);
        expect(newContent).toBe('Event Received: html1');
    });

    it('should NOT trigger AutoZoom hover frame on HTML elements', async () => {
        // Move mouse over the HTML element
        await page.mouse.move(660, 240);
        await new Promise(resolve => setTimeout(resolve, 200));

        const imageAfterHtmlHover = await page.screenshot();
        // This snapshot should look identical to the initial render, with no hover frame
        expect(imageAfterHtmlHover).toMatchImageSnapshot({
            failureThreshold: 0.02,
            failureThresholdType: 'percent',
            customSnapshotIdentifier: 'html-element-initial-render'
        });
    });

    it('should trigger AutoZoom hover frame on geometric elements', async () => {
        // Move mouse over the Box element
        await page.mouse.move(260, 300);
        await new Promise(resolve => setTimeout(resolve, 200));

        const imageAfterBoxHover = await page.screenshot();
        // This snapshot SHOULD have a hover frame
        expect(imageAfterBoxHover).toMatchImageSnapshot({
            failureThreshold: 0.02,
            failureThresholdType: 'percent',
            customSnapshotIdentifier: 'box-element-hover'
        });
    });

    it('should properly destroy the graph and clean up the DOM', async () => {
        const containerContentBeforeDestroy = await page.$eval('#spacegraph-container', el => el.innerHTML);
        expect(containerContentBeforeDestroy).toContain('canvas');

        await page.evaluate(() => {
            window.graph.destroy();
        });

        const containerContentAfterDestroy = await page.$eval('#spacegraph-container', el => el.innerHTML);
        expect(containerContentAfterDestroy).toBe('');
    });
});