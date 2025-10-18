class TooltipManager {
    constructor(container, config) {
        this.container = container;
        this.config = config;
        this.tooltipElement = null;

        if (this.config.enabled) {
            this.createTooltipElement();
        }
    }

    createTooltipElement() {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = this.config.className;
        this.tooltipElement.style.position = 'absolute';
        this.tooltipElement.style.display = 'none';
        this.tooltipElement.style.pointerEvents = 'none'; // So it doesn't interfere with mouse events on the canvas
        this.container.appendChild(this.tooltipElement);
    }

    show(content, x, y) {
        if (!this.tooltipElement) return;

        this.tooltipElement.innerHTML = content;
        this.tooltipElement.style.left = `${x + this.config.offset.x}px`;
        this.tooltipElement.style.top = `${y + this.config.offset.y}px`;
        this.tooltipElement.style.display = 'block';
    }

    hide() {
        if (!this.tooltipElement) return;

        this.tooltipElement.style.display = 'none';
    }

    destroy() {
        if (this.tooltipElement && this.tooltipElement.parentNode === this.container) {
            this.container.removeChild(this.tooltipElement);
        }
        this.tooltipElement = null;
    }
}

export default TooltipManager;
