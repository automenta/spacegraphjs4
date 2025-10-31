
import time
from playwright.sync_api import sync_playwright, expect

def verify_icon_toggle_button(page):
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

    # Check if the other buttons were created
    my_button_exists = page.evaluate("!!window.myButton")
    print(f"window.myButton exists: {my_button_exists}")

    my_toggle_button_exists = page.evaluate("!!window.myToggleButton")
    print(f"window.myToggleButton exists: {my_toggle_button_exists}")

    my_icon_toggle_button_exists = page.evaluate("!!window.myIconToggleButton")
    print(f"window.myIconToggleButton exists: {my_icon_toggle_button_exists}")


    # Assert initial state is off
    initial_toggled_state = page.evaluate("window.myIconToggleButton.toggled")
    assert initial_toggled_state is False, "IconToggleButton should be off initially"

    # Click the toggle button using evaluate
    page.evaluate("window.myIconToggleButton.onToggle()")

    # Wait for the visual state to update
    page.wait_for_timeout(500)

    # Assert new state is on
    final_toggled_state = page.evaluate("window.myIconToggleButton.toggled")
    assert final_toggled_state is True, "IconToggleButton should be on after clicking"

    # Take a screenshot to visually verify the color change
    page.screenshot(path="jules-scratch/verification/verification_icon.png")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_icon_toggle_button(page)
            print("Verification script for IconToggleButton ran successfully.")
        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error_icon.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
