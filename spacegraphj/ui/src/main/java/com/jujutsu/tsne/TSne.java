package com.jujutsu.tsne;

import com.jujutsu.tsne.barneshut.TSneConfiguration;
import com.jujutsu.tsne.matrix.MatrixOps;
import jcog.Util;
import jcog.WTF;
import jcog.pri.Prioritized;
import jcog.signal.FloatRange;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

import static com.jujutsu.tsne.matrix.MatrixOps.*;
import static jcog.Util.clamp;

/**
 * Original Author: Leif Jonsson (leif.jonsson@gmail.com)
 * <p>
 * This is a Java implementation of van der Maaten and Hintons t-sne
 * dimensionality reduction technique that is particularly well suited
 * for the visualization of high-dimensional datasets
 * <p>
 * http:
 * <p>
 * cost function parameters: perplexity Perp,
 * optimization parameters: number of iterations T, learning rate η, momentum α(
 */
public class TSne<X> {

    /**
     * The perplexity can be interpreted as a smooth measure of the effective number of neighbors. The
     * performance of SNE is fairly robust to changes in the perplexity, and typical values are between 5
     * and 50.
     */
    public final FloatRange perplexity = new FloatRange(10, 5, 50.0f);

    public final FloatRange alpha = new FloatRange(0.01f, 0, 1);

    double dYClip = 1.0;

    boolean pca = false;

    private double[][] P;
    public double[][] X;
    public double[][] Y;

    /** gradient */
    private double[][] dY;

    private double[][] iY;
    protected double[][] gains;

    static final double tolerance = 1.0e-4;

    static final int TRIES =
        //1;
        10;
        //50; //??

    private double[][] numMatrix;

    private Map<X, Integer> instanceToRowMap = new HashMap<>();
    private List<X> rowToInstanceList = new ArrayList<>();
    private int outDims;

    public double[][] reset(Map<X, double[]> instanceMap, TSneConfiguration config) {
        outDims = config.getOutputDims();
        int newSize = instanceMap.size();

        // Step 1: Create new matrices
        double[][] newX = new double[newSize][];
        double[][] newY = new double[newSize][outDims];
        double[][] newDY = new double[newSize][outDims];
        double[][] newIY = new double[newSize][outDims];
        double[][] newGains = new double[newSize][outDims];

        // Step 2: Prepare a map of old indices that can be reused
        Map<Integer, Integer> oldToNewIndexMap = new HashMap<>();
        Set<Integer> usedNewIndices = new HashSet<>();

        // First pass: identify reusable indices
        for (Map.Entry<X, double[]> entry : instanceMap.entrySet()) {
            X instance = entry.getKey();
            Integer oldIndex = instanceToRowMap.get(instance);
            if (oldIndex != null && oldIndex < newSize) {
                oldToNewIndexMap.put(oldIndex, oldIndex);
                usedNewIndices.add(oldIndex);
            }
        }

        // Step 3: Fill new matrices
        int nextAvailableIndex = 0;
        for (Map.Entry<X, double[]> entry : instanceMap.entrySet()) {
            X instance = entry.getKey();
            double[] instanceData = entry.getValue();

            Integer oldIndex = instanceToRowMap.get(instance);
            int newIndex;

            if (oldIndex != null) {
                newIndex = oldToNewIndexMap.get(oldIndex);
            } else {
                // Find the next available new index
                while (usedNewIndices.contains(nextAvailableIndex)) {
                    nextAvailableIndex++;
                }
                newIndex = nextAvailableIndex;
                usedNewIndices.add(newIndex);
            }

            newX[newIndex] = instanceData;

            if (oldIndex != null && Y != null && oldIndex < Y.length) {
                // Reuse old data
                System.arraycopy(Y[oldIndex], 0, newY[newIndex], 0, Math.min(outDims, Y[oldIndex].length));
                System.arraycopy(dY[oldIndex], 0, newDY[newIndex], 0, Math.min(outDims, dY[oldIndex].length));
                System.arraycopy(iY[oldIndex], 0, newIY[newIndex], 0, Math.min(outDims, iY[oldIndex].length));
                System.arraycopy(gains[oldIndex], 0, newGains[newIndex], 0, Math.min(outDims, gains[oldIndex].length));
            } else {
                // New instance or old data not available: initialize
                newY[newIndex] = rnorm(1, outDims, ThreadLocalRandom.current())[0];
                Arrays.fill(newDY[newIndex], 0);
                Arrays.fill(newIY[newIndex], 0);
                Arrays.fill(newGains[newIndex], 1);
            }

            // Ensure no rows are null by filling any remaining elements
            for (int i = 0; i < outDims; i++) {
                if (newY[newIndex][i] == 0) newY[newIndex][i] = ThreadLocalRandom.current().nextGaussian();
                if (newDY[newIndex][i] == 0) newDY[newIndex][i] = 0;
                if (newIY[newIndex][i] == 0) newIY[newIndex][i] = 0;
                if (newGains[newIndex][i] == 0) newGains[newIndex][i] = 1;
            }

            instanceToRowMap.put(instance, newIndex);
        }

        // Step 4: Replace old matrices with new ones
        X = newX;
        Y = newY;
        dY = newDY;
        iY = newIY;
        gains = newGains;

        // Step 5: Recalculate P
        P = p(X);
        numMatrix = null;

        return Y;
    }

    private double[][] p(double[][] X) {
        var P = x2p(X, tolerance, perplexity.getAsDouble()).P;
        P = plus(P, transpose(P));
        P = divScalar(P, Util.sum(P));
        P = mulScalar(P, 4);
        P = maximum(P, Double.MIN_NORMAL);
        return P;
    }

    public final double[][] next(int iter) {
        for (int i = 0; i < iter; i++)
            next();
        return Y;
    }

    public double[][] next() {
        int n = X.length;
        if (n == 0)
            return Y;

        double[][] sum_Y = transpose(sum(square(Y), 1));

        numMatrix = scalarInverse(
                plusScalar(addRow(transpose(addRow(mulScalar(
                times(Y, transpose(Y)),
                -2),
                sum_Y)),
                sum_Y),
                1), numMatrix);

        int[] rn = range(n);
        if (numMatrix.length < rn.length)
            throw new WTF();
        assignAtIndex(numMatrix, rn, rn, 0);
        double[][] Q = divScalar(numMatrix, Util.sum(numMatrix));

        double epsilon = 1e-8;//1e-12;
        Q = maximum(Q, epsilon);

        double[][] L = mulScalar(minus(P, Q), numMatrix);
        dY = mulScalar(times(minus(diag(sum(L, 1)), L), Y), 4);

        clamp(dY, -dYClip, dYClip);

        gains = plus(mulScalar(plusScalar(gains, 0.2), abs(negate(equal(biggerThan(dY, 0.0), biggerThan(iY, 0.0))))),
                mulScalar(mulScalar(gains, 0.8), abs(equal(biggerThan(dY, 0.0), biggerThan(iY, 0.0)))));

        //Double.MIN_NORMAL;
        double min_gain = Prioritized.EPSILON;
        assignAllLessThan(gains, min_gain, min_gain);


        double pri = alpha.getAsDouble();
        double priAccel = pri, priVel = 1;
        //float priAccel = 1, priVel = pri;

        iY = minus(iY, mulScalar(mulScalar(gains, dY), priAccel * n));

//        iY = scalarMult(iY,  (1-momentum.getAsDouble()));
//        Y = plus(Y, iY);


        ///float m = momentum.asFloat();
        for (int j = 0, yLength = Y.length; j < yLength; j++) {
            for (int i = 0; i < Y[j].length; i++)
                Y[j][i] += iY[j][i] * priVel;
                //yy[i] = Util.lerpSafe(m,
        }

        Y = minus(Y, tile(mean(Y, 0), n, 1));

        MatrixOps.replaceNaN(Y, 0 /* TODO random */);
        MatrixOps.replaceNaN(iY, 0);
        MatrixOps.replaceNaN(dY, 0);

//        if (logger.isDebugEnabled()) {
//            double error = sum(scalarMultiply(P, replaceNaN(log(scalarDivide(P, Q)),
//                    0
//            )));
//            //logger.debug("error={}", error);
//        }

        return Y;
    }

    /** Computes the entropy and P-values for a given distance matrix and precision */
    private static R Hbeta(double[][] D, double beta) {
        double[][] P = exp(mulScalar(mulScalar(D, beta), -1));
        double sumP = Util.sum(P);
        R r = new R();
        r.P = divScalar(P, sumP);
        r.H = Math.log(sumP) + beta * Util.sum(mulScalar(D, P)) / sumP;
        return r;
    }

    protected boolean inputChanged(double[][] newX) {
        if (X == null || X.length != newX.length)
            return true;
        for (int i = 0; i < X.length; i++)
            if (X[i].length != newX[i].length)
                return true;
        return false;
    }

    /**  Computes the perplexity and P-values for the input data */
    private static R x2p(double[][] X, double tol, double perplexity) {
        int n = X.length;
        double[][] sum_X = sum(square(X), 1);
        double[][] times = mulScalar(times(X, transpose(X)), -2);
        double[][] prodSum = addColumn(transpose(times), sum_X);
        double[][] D = addRow(prodSum, transpose(sum_X));

        double[][] P = fill(n, n, 0);
        double[] beta = fill(n, n, 1)[0];
        double logU = Math.log(perplexity);
        for (int i = 0; i < n; i++) {
//            if (i % 500 == 0) System.out.println("Computing P-values for point " + i + " of " + n + "...");
            double betamin = Double.NEGATIVE_INFINITY, betamax = Double.POSITIVE_INFINITY;
            double[][] Di = rowValues(D, i, concatenate(range(0, i), range(i + 1, n)));

            R hbeta = Hbeta(Di, beta[i]);
            double H = hbeta.H;
            double[][] thisP = hbeta.P;


            double Hdiff = H - logU;
            int tries = 0;
            while (Math.abs(Hdiff) > tol && tries++ < TRIES) {
                if (Hdiff > 0) {
                    betamin = beta[i];
                    if (Double.isInfinite(betamax))
                        beta[i] *= 2;
                    else
                        beta[i] = (beta[i] + betamax) / 2;
                } else {
                    betamax = beta[i];
                    if (Double.isInfinite(betamin))
                        beta[i] /= 2;
                    else
                        beta[i] = (beta[i] + betamin) / 2;
                }

                hbeta = Hbeta(Di, beta[i]);
                thisP = hbeta.P;
                H = hbeta.H;
                Hdiff = H - logU;
            }
            assignValuesToRow(P, i, concatenate(range(0, i), range(i + 1, n)), thisP[0]);
        }

        R r = new R();
        r.P = P;
        r.beta = beta;
        return r;
    }

    static class R {
        double[][] P;
        double[] beta;
        double H;
    }
}