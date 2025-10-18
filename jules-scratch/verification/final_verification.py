import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:5173")

        # Wait for the graph to initialize
        await page.wait_for_function("window.graph && window.graph.sceneManager.nodes.size > 0")

        # Wait for the layout simulation to stabilize
        await page.wait_for_timeout(3000)

        await page.screenshot(path="jules-scratch/verification/final_screenshot.png")
        await browser.close()

asyncio.run(main())