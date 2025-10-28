package spacegraph.audio;

import com.jogamp.openal.AL;
import com.jogamp.openal.ALFactory;
import com.jogamp.openal.util.ALut;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.IntBuffer;

public class JOALAudio extends Audio implements Runnable {

    private static final int NUM_BUFFERS = 3;
    private AL al;
    private int source;
    private int[] buffers;
    private final ByteBuffer audioDataBuffer;
    private Thread thread;

    public JOALAudio(int polyphony) {
        super(polyphony);
        audioDataBuffer = newBuffer();
    }

    private ByteBuffer newBuffer() {
        return ByteBuffer.allocateDirect(bufferSamples * 4).order(ByteOrder.nativeOrder());
    }

    @Override
    public void start() {
        ALut.alutInit();
        al = ALFactory.getAL();

        IntBuffer buffer = IntBuffer.allocate(1);
        al.alGenSources(1, buffer);
        source = buffer.get(0);

        buffer = IntBuffer.allocate(NUM_BUFFERS);
        al.alGenBuffers(NUM_BUFFERS, buffer);
        buffers = new int[NUM_BUFFERS];
        buffer.get(buffers);

        for (int buf : buffers)
            queueBuffer(buf);

        al.alSourcePlay(source);

        thread = new Thread(this);
        thread.start();
    }

    @Override public void run() {
        while (alive) {
            updateAudio();
        }
    }

    private void queueBuffer(int buffer) {
        byte[] ba = tick(0);
        audioDataBuffer.clear();
        audioDataBuffer.put(ba);
        audioDataBuffer.flip();

        al.alBufferData(buffer, AL.AL_FORMAT_STEREO16, audioDataBuffer, audioDataBuffer.capacity(), rate);
        al.alSourceQueueBuffers(source, 1, new int[]{buffer}, 0);
    }

    private void updateAudio() {
        IntBuffer processed = IntBuffer.allocate(1);
        al.alGetSourcei(source, AL.AL_BUFFERS_PROCESSED, processed);
        int processedCount = processed.get(0);

        while (processedCount-- > 0) {
            IntBuffer buffer = IntBuffer.allocate(1);
            al.alSourceUnqueueBuffers(source, 1, buffer);
            queueBuffer(buffer.get(0));
        }

        IntBuffer state = IntBuffer.allocate(1);
        al.alGetSourcei(source, AL.AL_SOURCE_STATE, state);
        if (state.get(0) != AL.AL_PLAYING) {
            al.alSourcePlay(source);
        }
    }

    @Override
    public void close() {
        alive = false;
        super.close();

        al.alSourceStop(source);
        al.alDeleteSources(1, new int[]{source}, 0);
        al.alDeleteBuffers(NUM_BUFFERS, buffers, 0);

        ALut.alutExit();
        thread = null;
    }
}