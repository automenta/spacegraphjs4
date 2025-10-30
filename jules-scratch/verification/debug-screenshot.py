from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"file://{os.getcwd()}/demo/debug-text.html")
        page.screenshot(path="jules-scratch/verification/debug-screenshot.png")
        browser.close()

run()
