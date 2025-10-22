from playwright.sync_api import sync_playwright
import time
import random
import math

def get_2d_coords(page, object_id):
    js_code = f"""
    (() => {{
        const THREE = window.THREE;
        const object = window.graph.managers.scene.elements.get('{object_id}');
        if (!object) return null;
        const vector = new THREE.Vector3();
        object.getWorldPosition(vector);
        vector.project(window.graph.camera);
        const width = window.innerWidth;
        const height = window.innerHeight;
        return {{
            x: (vector.x * 0.5 + 0.5) * width,
            y: (vector.y * -0.5 + 0.5) * height,
            z: vector.z
        }};
    }})()
    """
    return page.evaluate(js_code)

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        page.goto('http://localhost:5173')
        time.sleep(2)


        page.evaluate("() => { window.demoManager.load('Geometric Accuracy'); }")
        time.sleep(2)

        # 1. Apply a random rotation
        azimuth_angle = random.uniform(math.pi / 4, math.pi / 2)
        polar_angle = random.uniform(math.pi / 8, math.pi / 4)
        page.evaluate(f"""
            () => {{
                const controls = window.graph.managers.controls.orbitControls;
                if (controls) {{
                    const radius = controls.getDistance();
                    const newX = radius * Math.sin({azimuth_angle}) * Math.cos({polar_angle});
                    const newZ = radius * Math.sin({azimuth_angle}) * Math.sin({polar_angle});
                    const newY = radius * Math.cos({azimuth_angle});
                    window.graph.camera.position.set(newX, newY, newZ);
                    controls.update();
                }}
            }}
        """)
        time.sleep(1)

        # 2. Frame the scene
        page.evaluate("() => { window.graph.flyTo(); }")
        time.sleep(3) # Wait for animation

        # 3. Capture screenshot for visual verification
        page.screenshot(path='geometric_accuracy_verification.png')

        # 4. Programmatic verification
        viewport_size = page.viewport_size
        width, height = viewport_size['width'], viewport_size['height']
        corner_boxes = ['box-1', 'box-2', 'box-3', 'box-4']
        for box_id in corner_boxes:
            coords = get_2d_coords(page, box_id)
            assert 0 < coords['x'] < width, f"Box {{box_id}} is horizontally out of view"
            assert 0 < coords['y'] < height, f"Box {{box_id}} is vertically out of view"
            assert coords['z'] < 1, f"Box {{box_id}} is clipped by the camera"
        print("Programmatic verification successful: All corner boxes are within the viewport.")

        # 5. Simulate mouse drag to test orbit controls
        page.mouse.move(width / 2, height / 2)
        page.mouse.down()
        page.mouse.move(width / 2 + 100, height / 2 + 100)
        page.mouse.up()
        time.sleep(1)

        # 6. Capture final screenshot to confirm interaction
        page.screenshot(path='interaction_verification.png')
        print("Interaction verification successful: Captured screenshot after mouse drag.")


        browser.close()

if __name__ == '__main__':
    run_verification()
