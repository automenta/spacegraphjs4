package spacegraph.audio;

import jcog.Util;
import spacegraph.audio.sample.SamplePlayer;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;

public abstract class Audio {

    public static final Audio the =
        //new JSoundAudio(32);
        new JOALAudio(32);

    static {
        the.start();
    }

    protected final SoundMixer mixer;
    protected final ByteBuffer soundBuffer;
    private final float[] left, right;

    static final int rate = 44100;

    /**
     * TODO make dynamically reconfigurable
     */
    int bufferSamples;
    protected boolean alive = true;

    protected Audio(int polyphony) {
        this(polyphony, rate /
                20 /* = 50ms */
        //10 /* = 100ms */
        );
    }

    protected Audio(int polyphony, int bufferSamples) {
        this.bufferSamples = bufferSamples;
        soundBuffer = ByteBuffer.allocate(bufferSamples * 2 * 2)
                .order(ByteOrder.LITTLE_ENDIAN);
        mixer = new SoundMixer(polyphony);

        left = new float[bufferSamples];
        right = new float[bufferSamples];

        setListener(SoundSource.center);
    }

    /**
     * the default audio system
     */
    public static Audio the() {
        return the;
    }

    abstract public void start();

    public void setListener(SoundSource soundSource) {
        mixer.setSoundListener(soundSource);
    }

    public void close() {
        alive = false;
    }

    public int bufferSizeInFrames() {
        return bufferSamples;
    }

    public <S extends SoundProducer> Sound<S> play(S p) {
        return play(p, 1, 1, 0);
    }

    public Sound play(float[] buffer, int rate) {
        return play((SoundProducer) new SamplePlayer(buffer, rate));
    }

    public <S extends SoundProducer> Sound<S> play(S p, float volume, float priority, float balance) {
        return play(p, new Audio.DefaultSource(balance), volume, priority);
    }


    protected synchronized byte[] tick(float alpha) {
        mixer.update(alpha);

        Arrays.fill(left, 0);
        Arrays.fill(right, 0);
        mixer.read(left, right, rate);

        soundBuffer.clear();
        byte[] ba = soundBuffer.array();

        for (int i = 0; i < bufferSamples; i++) {
            writeShort(ba, i * 2, left[i]);
            writeShort(ba, i * 2 + 1, right[i]);
        }

        return ba;
    }

    private static void writeShort(byte[] out, int s, float in) {
        int l = (int) Util.clampSafe(in * Short.MAX_VALUE, -Short.MAX_VALUE, Short.MAX_VALUE);
        int n = s * 2;
        out[n++] = (byte) (l & 0x00ff);
        out[n] = (byte) (l >> 8);
    }





    public <S extends SoundProducer> Sound<S> play(S p, SoundSource soundSource, float volume, float priority) {
        return mixer.add(p, soundSource, volume, priority);
    }

    public static class DefaultSource implements SoundSource {

        static final float distanceFactor = 1;
        private final float balance;

        DefaultSource(float balance) {
            this.balance = balance;
        }

        @Override
        public float getY(float alpha) {
            return 0 + (1.0f /*- producer.amp()*/) * distanceFactor;
        }

        @Override
        public float getX(float alpha) {
            return balance;
        }
    }
}