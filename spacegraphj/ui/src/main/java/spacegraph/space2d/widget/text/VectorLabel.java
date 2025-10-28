package spacegraph.space2d.widget.text;

import com.jogamp.opengl.GL2;
import spacegraph.space2d.ReSurface;
import spacegraph.video.Draw;
import spacegraph.video.font.HersheyFont;

public class VectorLabel extends AbstractLabel {

    static final float MIN_PIXELS_TO_BE_VISIBLE = 1.5f;

    static final float MIN_THICK = 0.75f;
    static final float THICKNESSES_PER_PIXEL = 1 / 20.0f;
    static final float MAX_THICK = 24.0f;


    protected float textScaleX = 1, textScaleY = 1;

    protected float textY;

    protected boolean outline = true;
    static final float OUTLINE_THICKNESS_RATIO = 2;  // Outline is 2x thicker than main text
    static final float OUTLINE_ALPHA = 0.3f;  // Semi-transparent outline

    public VectorLabel() {
        this("");
    }

    public VectorLabel(String s) {
        text(s);
    }

    public VectorLabel withOutline(boolean enable) {
        this.outline = enable;
        return this;
    }

    @Override
    protected void doLayout(float dtS) {
        int len = text.length();
        if (len == 0) {
            textScaleX = textScaleY = 0;
            return;
        }

        float tw = w(), th = h();
        float visAspect = th / tw;

        // Improved text scaling calculation
        this.textScaleX = Math.min(1.0f / len, 1.0f);
            this.textScaleY = textScaleX / visAspect;

        // Ensure text doesn't exceed bounds
        if (textScaleY > 1) {
            textScaleX = 1 / (len * textScaleY);
            textScaleY = 1;
        }

        // Center text vertically
        textY = 0.5f - textScaleY / 2;
    }
    
    @Override
    protected void renderContent(ReSurface r) {
        float p = r.visP(bounds.scale(textScaleX, textScaleY), MIN_PIXELS_TO_BE_VISIBLE);
        if (p <= 0) {
            LabelRenderer.LineBox.accept(this, r.gl);
        } else {
            var textThickness = Math.min(p * THICKNESSES_PER_PIXEL + MIN_THICK, MAX_THICK);
            Draw.bounds(bounds, r.gl, (g) -> {
                if (outline) {
                    g.glLineWidth(textThickness * OUTLINE_THICKNESS_RATIO);
                    fgColor.applyWithAlpha(OUTLINE_ALPHA, g);
                    renderText(g);
                }

                g.glLineWidth(textThickness);
                fgColor.apply(g);
                renderText(g);
            });
        }
    }
    private void renderText(GL2 g) {
        HersheyFont.hersheyText(g, this.text, this.textScaleX, this.textScaleY,
                0, this.textY, 0, Draw.TextAlignment.Left);
    }

}