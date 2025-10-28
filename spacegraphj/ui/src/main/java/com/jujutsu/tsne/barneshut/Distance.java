package com.jujutsu.tsne.barneshut;

import jcog.Util;
import org.hipparchus.linear.ArrayRealVector;

@FunctionalInterface
public interface Distance {
	double distance(ArrayRealVector d1, ArrayRealVector d2);

	default double distanceSq(ArrayRealVector d1, ArrayRealVector d2) {
		return Util.sqr(distance(d1, d2));
	}
}
