
import time
from playwright.sync_api import sync_playwright, expect

def verify_toggle_button(page):
    # Capture console logs
    def handle_console_message(msg):
        try:
            print(f"Browser console: {msg.text}")
        except Exception as e:
            print(f"Error in console handler: {e}")
    page.on("console", handle_console_message)

    # Capture failed requests
    page.on("requestfailed", lambda request: print(f"Request failed: {request.url}"))

    # Go to the demo page
    page.goto("http://localhost:3000/demo/comprehensive-demo.html")

    # Wait for the page to be fully loaded
    page.wait_for_load_state("networkidle")

    # Click the 'UI Showcase' button to display the UI components
    ui_showcase_button = page.get_by_role("button", name="UI Showcase")
    expect(ui_showcase_button).to_be_visible()
    ui_showcase_button.click()

    # Wait for the new scene to render
    page.wait_for_timeout(1000)

    # Check if the button was created
    my_toggle_button_exists = page.evaluate("!!window.myToggleButton")
    print(f"window.myToggleButton exists: {my_toggle_button_exists}")
    assert my_toggle_button_exists, "ToggleButton was not created"

    # Assert initial state is off
    initial_toggled_state = page.evaluate("window.myToggleButton.toggled")
    assert initial_toggled_state is False, "ToggleButton should be off initially"

    # Click the toggle button using evaluate
    page.evaluate("window.myToggleButton.onToggle()")

    # Wait for the visual state to update
    page.wait_for_timeout(500)

    # Assert new state is on
    final_toggled_state = page.evaluate("window.myToggleButton.toggled")
    assert final_toggled_state is True, "ToggleButton should be on after clicking"

    # Take a screenshot to visually verify the color change
    page.screenshot(path="jules-scratch/verification/verification_toggle_button.png")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_toggle_button(page)
            print("Verification script for ToggleButton ran successfully.")
        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error_toggle_button.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
