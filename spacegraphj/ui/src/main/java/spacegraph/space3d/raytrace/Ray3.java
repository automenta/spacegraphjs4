package spacegraph.space3d.raytrace;

import jcog.math.v3d;

public class Ray3 {

    public v3d position, direction;

    Ray3(v3d position, v3d direction) {
        this.position = position;
        this.direction = direction;
    }
}
