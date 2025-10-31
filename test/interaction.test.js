const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

test.describe('Interaction Tests', () => {
    test('Button component should respond to clicks', async ({ page }) => {
        await page.goto(`file://${path.join(__dirname, '..', 'demo', 'comprehensive-demo.html')}`);
        await page.click('#uiShowcaseDemoBtn');

        // Wait for the button to be available on the window object
        await page.waitForFunction(() => window.myButton);

        // Check initial state
        const initialState = await page.evaluate(() => {
            return {
                pressed: window.myButton.pressed,
                color: window.myButton.color,
                originalColor: window.myButton.originalColor
            };
        });
        expect(initialState.pressed).toBe(false);

        // Simulate pointer down
        await page.evaluate(() => {
            window.myButton.onPointerDown({ stopPropagation: () => {} });
        });

        // Check pressed state
        const pressedState = await page.evaluate(() => {
            return {
                pressed: window.myButton.pressed,
                color: window.myButton.color,
                pressedColor: window.myButton.pressedColor
            };
        });
        expect(pressedState.pressed).toBe(true);
        expect(pressedState.color).toBe(pressedState.pressedColor);

        // Take a screenshot of the pressed state
        await page.screenshot({ path: path.join(screenshotsDir, 'button-pressed.png') });

        // Simulate pointer up
        await page.evaluate(() => {
            window.myButton.onPointerUp({ stopPropagation: () => {}, data: { x: 0, y: 0 } });
        });

        // Check final state
        const finalState = await page.evaluate(() => {
            return {
                pressed: window.myButton.pressed,
                color: window.myButton.color,
                originalColor: window.myButton.originalColor
            };
        });
        expect(finalState.pressed).toBe(false);
        expect(finalState.color).toBe(finalState.originalColor);
    });

    test('ToggleButton component should toggle its state', async ({ page }) => {
        await page.goto(`file://${path.join(__dirname, '..', 'demo', 'comprehensive-demo.html')}`);
        await page.click('#uiShowcaseDemoBtn');

        // Wait for the toggle button to be available on the window object
        await page.waitForFunction(() => window.myToggleButton);

        // Check initial state
        const initialToggledState = await page.evaluate(() => window.myToggleButton.toggled);
        expect(initialToggledState).toBe(false);

        // Simulate a click to toggle on
        await page.evaluate(() => {
            window.myToggleButton.onToggle();
        });

        // Check toggled state
        const toggledOnState = await page.evaluate(() => {
            return {
                toggled: window.myToggleButton.toggled,
                color: window.myToggleButton.color,
                toggledColor: window.myToggleButton.toggledColor
            };
        });
        expect(toggledOnState.toggled).toBe(true);
        expect(toggledOnState.color).toBe(toggledOnState.toggledColor);

        // Take a screenshot of the toggled on state
        await page.screenshot({ path: path.join(screenshotsDir, 'toggle-button-on.png') });

        // Simulate a click to toggle off
        await page.evaluate(() => {
            window.myToggleButton.onToggle();
        });

        // Check final state
        const finalToggledState = await page.evaluate(() => {
            return {
                toggled: window.myToggleButton.toggled,
                color: window.myToggleButton.color,
                originalColor: window.myToggleButton.originalColor
            };
        });
        expect(finalToggledState.toggled).toBe(false);
        expect(finalToggledState.color).toBe(finalToggledState.originalColor);
    });

    test('IconToggleButton component should toggle its state', async ({ page }) => {
        await page.goto(`file://${path.join(__dirname, '..', 'demo', 'comprehensive-demo.html')}`);
        await page.click('#uiShowcaseDemoBtn');

        // Wait for the icon toggle button to be available on the window object
        await page.waitForFunction(() => window.myIconToggleButton);

        // Check initial state
        const initialIconToggledState = await page.evaluate(() => window.myIconToggleButton.toggled);
        expect(initialIconToggledState).toBe(false);

        // Simulate a click to toggle on
        await page.evaluate(() => {
            window.myIconToggleButton.onToggle();
        });

        // Check toggled state
        const iconToggledOnState = await page.evaluate(() => window.myIconToggleButton.toggled);
        expect(iconToggledOnState).toBe(true);

        // Take a screenshot of the toggled on state
        await page.screenshot({ path: path.join(screenshotsDir, 'icon-toggle-button-on.png') });

        // Simulate a click to toggle off
        await page.evaluate(() => {
            window.myIconToggleButton.onToggle();
        });

        // Check final state
        const finalIconToggledState = await page.evaluate(() => window.myIconToggleButton.toggled);
        expect(finalIconToggledState).toBe(false);
    });

    test('Label component should display the correct text', async ({ page }) => {
        await page.goto(`file://${path.join(__dirname, '..', 'demo', 'comprehensive-demo.html')}`);
        await page.click('#uiShowcaseDemoBtn');

        // Wait for the label to be available on the window object
        await page.waitForFunction(() => window.myLabel);

        // Check initial state
        const labelState = await page.evaluate(() => {
            return {
                text: window.myLabel.text,
                color: window.myLabel.color
            };
        });

        expect(labelState.text).toBe('This is a label');

        // Take a screenshot of the label
        await page.screenshot({ path: path.join(screenshotsDir, 'label.png') });
    });
});
