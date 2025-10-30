from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the comprehensive demo
        page.goto(f"file://{os.getcwd()}/demo/comprehensive-demo.html")
        page.screenshot(path="jules-scratch/verification/comprehensive-demo.png")

        # Navigate to the component demos
        page.goto(f"file://{os.getcwd()}/demo/component-demos.html")
        page.screenshot(path="jules-scratch/verification/component-demos.png")

        # Navigate to the use-case demos
        page.goto(f"file://{os.getcwd()}/demo/use-case-demos.html")
        page.screenshot(path="jules-scratch/verification/use-case-demos.png")

        browser.close()

run()
