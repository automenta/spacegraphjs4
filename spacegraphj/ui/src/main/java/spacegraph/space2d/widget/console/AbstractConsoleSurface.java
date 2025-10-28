package spacegraph.space2d.widget.console;

import spacegraph.space2d.container.EmptyContainer;

public abstract class AbstractConsoleSurface extends EmptyContainer {
    public int rows, cols;

    public boolean resize(int cols, int rows) {
//        System.out.println("resize: " + cols + "," + rows);
        if (this.cols!=cols || this.rows!=rows) {
            this.cols = cols;
            this.rows = rows;
            //invalidate();
            return true;
        }
        return false;
    }

    @Override
    public final int childrenCount() {
        return 1; //HACK prevent hiding of empty containers
    }

    public abstract void invalidate();

}