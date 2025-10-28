package spacegraph.space2d.container.time;

import jcog.signal.ITensor;
import jcog.signal.wave1d.FreqDomain;
import spacegraph.space2d.widget.meter.BitmapMatrixView;
import spacegraph.video.Draw;

import java.awt.image.BufferedImage;

public class FreqSpectrogram extends BitmapMatrixView implements BitmapMatrixView.BitmapPainter {

    final FreqDomain data;

    /** comptued frequency domain output for display */
    private ITensor freq;

    public FreqSpectrogram(int fftSize, int history) {
        super(fftSize, history, null);
        this.data = new FreqDomain(fftSize, history);
    }

    public FreqSpectrogram set(ITensor x) {
        freq = this.data.apply(x);
        update();
        return this;
    }

    @Override
    public void paint(BufferedImage buf, int[] pix) {
        int v = freq.volume();
        for (int i = 0; i < v; i++) {
            float x = freq.getAt(i);
            pix[i] =
                    //Draw.colorHSB(0.3f * (1 - x), 0.9f, x);
                    Draw.rgbInt(x,x,x);
        }
    }

//    @Override
//    protected void starting() {
//        super.starting();
//        off = this.in.wave.on(raw-> {
//            fft = freqDomain.next(raw);
//            updateIfShowing();
//        });
//    }


//
//    @Override
//    protected void stopping() {
//        off.close();
//        off = null;
//        super.stopping();
//    }
}
