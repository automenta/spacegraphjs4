package spacegraph.space2d.widget.text;


import com.jogamp.opengl.GL2;
import jcog.Util;
import jcog.tree.rtree.rect.RectF;
import spacegraph.space2d.ReSurface;
import spacegraph.space2d.widget.console.AbstractConsoleSurface;
import spacegraph.space2d.widget.textedit.view.TextureProvider;
import spacegraph.util.math.Color4f;
import spacegraph.video.Tex;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferInt;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * renders a matrix of characters to a texture
 */
public abstract class BitmapTextGrid extends AbstractConsoleSurface {

    /**
     * pixel scale of each rendered character bitmap
     */
    private static final int DEFAULT_FONT_SCALE = 32;
    static final float CHARACTER_ASPECT = Util.PHIf;

    //TODO use a combined state machine
    @Deprecated private final AtomicBoolean invalidBmp = new AtomicBoolean(false);
    @Deprecated private final AtomicBoolean invalidTex = new AtomicBoolean(false);


    /** antialias probably more important than quality to be enabled */
    boolean antialias;
    boolean quality;
    private float alpha = 1;

    @Deprecated private final Color cursorColor = new Color(255, 200, 0, 127);
    public int cursorCol;
    public int cursorRow;
    protected int fontWidth;
    protected int fontHeight;
    private transient BufferedImage backbuffer;
    private final transient Tex tex;
    private transient Font font;
    private transient Graphics2D g;

    @Override
    public boolean delete() {

        tex.delete();
        font = null;

        Graphics2D b = g;
        g = null;
        if (b!=null)
            b.dispose();

        backbuffer = null;


        return super.delete();
    }

    protected BitmapTextGrid(boolean mipmap, boolean antialias) {
         this.tex = new Tex().mipmap(mipmap);
         this.antialias = antialias;
         this.quality = antialias;
    }


    private void allocate(int pw, int ph) {

        BufferedImage bPrev = this.backbuffer;
        if (bPrev != null) {
            if (bPrev.getWidth() == pw && bPrev.getHeight() == ph)
                return; //re-use same size

            this.g.dispose();
            this.backbuffer = null;
            this.g = null;
        }



        BufferedImage next = new BufferedImage(pw, ph, BufferedImage.TYPE_INT_ARGB);
        //next.setAccelerationPriority(1);

        Graphics2D nextGraphics = next.createGraphics();

        nextGraphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,
                antialias ? RenderingHints.VALUE_TEXT_ANTIALIAS_ON :
                            RenderingHints.VALUE_TEXT_ANTIALIAS_OFF
        );
        nextGraphics.setRenderingHint(RenderingHints.KEY_ALPHA_INTERPOLATION,
                quality ? RenderingHints.VALUE_ALPHA_INTERPOLATION_QUALITY :
                          RenderingHints.VALUE_ALPHA_INTERPOLATION_SPEED
                //RenderingHints.VALUE_ALPHA_INTERPOLATION_DEFAULT
                //RenderingHints.VALUE_ALPHA_INTERPOLATION_SPEED
        );

//        next.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, quality ?
//            RenderingHints.VALUE_FRACTIONALMETRICS_ON :
//            RenderingHints.VALUE_FRACTIONALMETRICS_OFF);

        nextGraphics.setRenderingHint(RenderingHints.KEY_RENDERING, quality ?
            RenderingHints.VALUE_RENDER_QUALITY :
            RenderingHints.VALUE_RENDER_SPEED
//          RenderingHints.VALUE_RENDER_DEFAULT
        );

        nextGraphics.setFont(font);
        this.g = nextGraphics;
        this.backbuffer = next;
    }

    protected void clearBackground() {
        Arrays.fill(intData(), 0);
    }

    private int[] intData() {
        return ((DataBufferInt) backbuffer.getRaster().getDataBuffer()).getData();
    }

    public BitmapTextGrid alpha(float alpha) {
        this.alpha = alpha;
        return this;
    }

    @Override
    protected void renderContent(ReSurface r) {
        if (font == null) {
            Font defaultFont = TextureProvider.the.font;
            if (defaultFont == null)
                return;

            font(defaultFont);
        }

        if (this.cols == 0 || this.rows == 0)
            return;

        int pw = pixelWidth();
        if (pw > 0) {
            int ph = pixelHeight();
            if (ph > 0 && Util.enterAlone(invalidBmp)){
                try {
                    allocate(pw, ph);
                    renderText(r);
                } finally {
                    Util.exitAlone(invalidTex);
                }
            }
        }
    }

    @Override
    protected final void paintIt(GL2 gl, ReSurface r) {
        if (Util.enterAlone(invalidTex)) {
            if (!tex.set(backbuffer, gl))
                Util.exitAlone(invalidTex); //try again later
        }
        tex.paint(gl, textBounds(), alpha);
    }

    protected RectF textBounds() {
        return bounds;
    }

    public BitmapTextGrid font(String fontName) {
        font(new Font(fontName, font.getStyle(), font.getSize()));
        return this;
    }

    public BitmapTextGrid font(InputStream i) {
        try {
            font(Font.createFont(Font.TRUETYPE_FONT, i).deriveFont(font.getStyle(), font.getSize()));
        } catch (FontFormatException | IOException e) {
            e.printStackTrace();
        }
        return this;
    }

    public BitmapTextGrid fontStyle(int style) {
        font(this.font.deriveFont(style));
        return this;
    }

    public BitmapTextGrid fontSize(float s) {
        return font(this.font.deriveFont(s));
    }

    public synchronized BitmapTextGrid font(Font f) {
        f = f.deriveFont((float) DEFAULT_FONT_SCALE);

        if (!f.equals(this.font)) {

            this.font = f;

            //TODO do this once per font
            int s = font.getSize();
            this.fontWidth = (int) Math.ceil(s / CHARACTER_ASPECT);
            this.fontHeight = s;

            if (g != null)
                g.setFont(font);

            invalidate();
        }
        return this;
    }

    private int pixelWidth() {
        return fontWidth * cols;
    }

    private int pixelHeight() {
        return fontHeight * rows;
    }

    /**
     * render text to texture, invokes redraw method appropriately
     * @param r
     */
    @Deprecated protected boolean renderText(ReSurface r) {
        return false;
    }

    public final void redraw(char c, int columnIndex, int rowIndex, Color4f foregroundColor, Color4f backgroundColor) {
        redraw(c, columnIndex, rowIndex, foregroundColor, backgroundColor, false, false);
    }

    public synchronized void redraw(char c, int columnIndex, int rowIndex, Color4f fg, Color4f backgroundColor, boolean underlined, boolean crossedOut) {
        if (columnIndex<0 || columnIndex >= this.cols) return;
        if (rowIndex<0 ||rowIndex >= this.rows) return;

        if (g == null)
            return;
        Font f = this.font;
        if (f == null)
            return;  //??

        charAt(columnIndex, rowIndex, c);

        int x = columnIndex * fontWidth;
        int y = rowIndex * fontHeight;

        Color bg = backgroundColor.toAWT();
        if (bg.getAlpha()>0) {
            g.setColor(bg);
            g.fillRect(x, y, fontWidth, fontHeight);
        }

        g.setColor(fg.toAWT());

        int descent = f.getSize() / 4; //estimate
        if (c != ' ')
            g.drawChars(new char[] { c }, 0, 1, x, y + fontHeight + 1 - descent);

        if (crossedOut) {
            int lineStartY = y + fontHeight / 2;
            int lineEndX = x + fontWidth;
            g.drawLine(x, lineStartY, lineEndX, lineStartY);
        }

        if (underlined) {
            int lineStartY = y + fontHeight - descent + 1;
            int lineEndX = x + fontWidth;
            g.drawLine(x, lineStartY, lineEndX, lineStartY);
        }

        boolean drawCursor = (columnIndex == cursorCol) && (rowIndex == cursorRow);
        if (drawCursor) {
            g.setColor(cursorColor);
            g.fillRect(x, y + 1, fontWidth, fontHeight - 2);
        }
    }



    protected void charAt(int x, int y, char c) {

    }

    public final void invalidate() {
        Util.exitAlone(invalidBmp);
    }

}