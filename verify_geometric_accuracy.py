from playwright.sync_api import sync_playwright
import time

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the local dev server
        page.goto('http://localhost:5173')

        # Wait for the UI to load
        time.sleep(2)

        # Select the "Geometric Accuracy" demo from the dropdown
        page.evaluate("""
            () => {
                const demoManager = window.demoManager;
                if (demoManager) {
                    demoManager.load('Geometric Accuracy');
                }
            }
        """)

        # Wait for the demo to load
        time.sleep(2)

        # Trigger the autozoom to the central sphere
        page.evaluate("""
            () => {
                const graph = window.graph;
                if (graph) {
                    graph.flyTo('center-sphere');
                }
            }
        """)

        # Wait for the camera animation to complete
        time.sleep(3)

        # Capture a screenshot
        page.screenshot(path='geometric_accuracy_verification.png')

        browser.close()

if __name__ == '__main__':
    run_verification()
