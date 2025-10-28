package spacegraph.util.vis;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * UniversalVisualizer demonstrates:
 * 1. Recursively traversing any object's fields using reflection.
 * 2. Collecting numeric or "ordinal" values into a vector (snapshot).
 * 3. Passing snapshots of data to a (placeholder) dimension-reduction pipeline.
 * 4. Updating a hypothetical 2D or 3D visualization from the reduced embeddings.
 */
public class UniversalVisualizer {

    // ------------------------------------------
    // 1) Reflection-based field extraction
    // ------------------------------------------

    /**
     * Recursively extracts numeric/ordinal fields (Double, Float, Integer, Long, Short, Byte, Enum, Boolean)
     * from the given object and returns them as a list of doubles.
     *
     * @param obj the object to extract fields from
     * @return a list of doubles representing the object's numeric/ordinal fields
     */
    public static List<Double> extractFeatures(Object obj) {
        if (obj == null) {
            return Collections.emptyList();
        }

        Class<?> clazz = obj.getClass();

        // If the object is a primitive wrapper or enum, handle directly
        if (isNumericWrapperOrBoolean(clazz)) {
            return Collections.singletonList(convertToDouble(obj));
        } else if (clazz.isEnum()) {
            return Collections.singletonList((double) ((Enum<?>) obj).ordinal());
        }

        // If it's an array or Collection, flatten it
        if (clazz.isArray()) {
            List<Double> result = new ArrayList<>();
            int length = Array.getLength(obj);
            for (int i = 0; i < length; i++) {
                Object element = Array.get(obj, i);
                result.addAll(extractFeatures(element));
            }
            return result;
        } else if (obj instanceof Collection<?>) {
            List<Double> result = new ArrayList<>();
            for (Object element : (Collection<?>) obj) {
                result.addAll(extractFeatures(element));
            }
            return result;
        }

        // Otherwise, if it's a complex object, reflect on its fields
        List<Double> features = new ArrayList<>();
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true); // bypass private/protected

            // Skip static fields
            if (Modifier.isStatic(field.getModifiers())) {
                continue;
            }

            try {
                Object value = field.get(obj);
                features.addAll(extractFeatures(value));
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            }
        }
        return features;
    }

    /**
     * Checks if the given class is a numeric wrapper type (Double, Float, Integer, etc.) or Boolean.
     */
    private static boolean isNumericWrapperOrBoolean(Class<?> clazz) {
        return Number.class.isAssignableFrom(clazz) || clazz == Boolean.class;
    }

    /**
     * Converts a numeric or boolean object to double, or returns 0.0 if unsupported.
     */
    private static double convertToDouble(Object obj) {
        if (obj instanceof Number) {
            return ((Number) obj).doubleValue();
        } else if (obj instanceof Boolean) {
            return (Boolean) obj ? 1.0 : 0.0;
        }
        return 0.0;
    }

    // ------------------------------------------
    // 2) Taking snapshots of an object's state
    // ------------------------------------------

    /**
     * Takes multiple snapshots of an object's state (if it changes over time).
     * For illustration, this method just calls {@link #extractFeatures(Object)} repeatedly.
     * In a real system, you might have a loop that checks the object state over time,
     * or uses a listener/observer pattern.
     *
     * @param obj                the object to snapshot
     * @param numberOfSnapshots  how many snapshots to collect
     * @return a list of double[] arrays, each representing the object's state at a moment in time
     */
    public static List<double[]> collectStateOverTime(Object obj, int numberOfSnapshots) {
        List<double[]> snapshots = new ArrayList<>();
        for (int i = 0; i < numberOfSnapshots; i++) {
            // In a real scenario, you might wait or do something in between snapshots.
            List<Double> featureList = extractFeatures(obj);
            double[] featureArray = featureList.stream().mapToDouble(d -> d).toArray();
            snapshots.add(featureArray);

            // (Optional) Simulate changes in the object for demonstration
            simulateObjectChange(obj, i);
        }
        return snapshots;
    }

    /**
     * A dummy method to simulate changes to the object over time.
     * In real usage, you'd rely on your actual application logic
     * to change object state.
     */
    private static void simulateObjectChange(Object obj, int iteration) {
        // Example: if obj has a field named 'someNumber', increment it, etc.
        // This is entirely application-specific. 
    }

    // ------------------------------------------
    // 3) Dimension Reduction (Placeholder)
    // ------------------------------------------

    /**
     * Placeholder for dimension reduction via T-SNE, UMAP, Autoencoder, etc.
     * This example just returns the original high-dimensional vectors.
     * In practice, call your favorite library here.
     *
     * @param highDimData a list of double[] snapshots
     * @return a list of 2D or 3D points corresponding to the dimension-reduced data
     */
    public static List<double[]> reduceDimensions(List<double[]> highDimData) {
        // Example: do T-SNE or UMAP or Autoencoder here.
        // For demonstration, we'll just pick the first two dimensions
        // and pretend it's a 2D embedding.
        return highDimData.stream()
                .map(vec -> {
                    if (vec.length >= 2) {
                        return new double[]{ vec[0], vec[1] };
                    } else if (vec.length == 1) {
                        return new double[]{ vec[0], 0.0 };
                    } else {
                        return new double[]{ 0.0, 0.0 };
                    }
                })
                .collect(Collectors.toList());
    }

    // ------------------------------------------
    // 4) Visualization / Animation
    // ------------------------------------------

    /**
     * Illustrates how you might iterate over snapshots, reduce them, and then
     * pass them to a plotting/visualization system (GUI, JavaFX, etc.).
     */
    public static void visualizeOverTime(Object obj, int snapshots) {
        // 1. Collect raw high-dimensional snapshots
        List<double[]> highDimSnapshots = collectStateOverTime(obj, snapshots);

        // 2. Reduce dimensionality
        List<double[]> reduced = reduceDimensions(highDimSnapshots);

        // 3. Animate or plot over time.
        //    In a real implementation, you would:
        //    - Create a window/canvas
        //    - For each snapshot, draw a point at reduced[i]
        //    - Possibly connect them with lines or show a transition
        for (int i = 0; i < reduced.size(); i++) {
            double[] xy = reduced.get(i);
            System.out.printf("Snapshot %d -> (x=%.3f, y=%.3f)%n", i, xy[0], xy[1]);

            // For an actual GUI:
            //    - Clear or update the canvas
            //    - Draw the data points
            //    - Use Thread.sleep(...) or timeline to animate
        }
    }

    // ------------------------------------------
    // Example usage / main
    // ------------------------------------------

    public static void main(String[] args) {
        // Example domain object
        TestObject test = new TestObject();
        test.setSomeNumber(42);
        test.setSomeBoolean(true);
        test.setSomeEnum(TestEnum.MEDIUM);

        // Visualize snapshots of this object's state
        visualizeOverTime(test, 5);
    }

    // ------------------------------------------
    // Example data classes
    // ------------------------------------------

    public static class TestObject {
        private int someNumber;
        private boolean someBoolean;
        private TestEnum someEnum;
        private double[] someArray = {1.1, 2.2, 3.3};

        public int getSomeNumber() {
            return someNumber;
        }

        public void setSomeNumber(int someNumber) {
            this.someNumber = someNumber;
        }

        public boolean isSomeBoolean() {
            return someBoolean;
        }

        public void setSomeBoolean(boolean someBoolean) {
            this.someBoolean = someBoolean;
        }

        public TestEnum getSomeEnum() {
            return someEnum;
        }

        public void setSomeEnum(TestEnum someEnum) {
            this.someEnum = someEnum;
        }
    }

    public enum TestEnum {
        LOW,
        MEDIUM,
        HIGH
    }
}
