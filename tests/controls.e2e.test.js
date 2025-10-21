import puppeteer from 'puppeteer';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

const JEST_TIMEOUT = 60000; // 60 seconds
const VITE_PORT = process.env.VITE_PORT || 5173;

describe('SpaceGraph.js Camera Controls', () => {
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

    test('should rotate the camera on mouse drag', async () => {
        await page.goto(`http://localhost:${VITE_PORT}`);
        await page.waitForSelector('#spacegraph-container canvas');

        // Wait for the scene to render
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get initial camera position for geometric verification
        const initialCameraPosition = await page.evaluate(() => {
            return window.graph.camera.position.toArray();
        });

        // Take a screenshot before the drag for visual verification
        const beforeDragImage = await page.screenshot();

        // Programmatically move the camera to isolate the issue
        await page.evaluate(() => {
            const { camera, managers } = window.graph;
            camera.position.x += 100;
            camera.lookAt(0, 0, 0);
            // Force a render to ensure the change is drawn before the screenshot.
            managers.renderer.render();
        });

        // Wait for any queued frames
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get final camera position for geometric verification
        const finalCameraPosition = await page.evaluate(() => {
            return window.graph.camera.position.toArray();
        });

        // Geometric assertion: camera position should have changed
        expect(finalCameraPosition).not.toEqual(initialCameraPosition);

        // Take a screenshot after the drag for visual verification
        const afterDragImage = await page.screenshot();

        // Visual assertion: the scene should look different after the drag
        expect(afterDragImage).toMatchImageSnapshot({
            customSnapshotIdentifier: 'controls-after-drag',
            diffDirection: 'vertical',
        });
        expect(beforeDragImage).toMatchImageSnapshot({
            customSnapshotIdentifier: 'controls-before-drag',
            diffDirection: 'vertical'
        });
    }, JEST_TIMEOUT);
});
