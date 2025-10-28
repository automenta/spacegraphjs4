package spacegraph.space2d.container.layout;

import jcog.Util;
import jcog.data.list.Lst;
import jcog.tree.rtree.rect.RectF;
import spacegraph.space2d.container.graph.Graph2D;
import spacegraph.util.MutableRectFloat;

import java.util.*;

/**
 * Implements the Squarified Treemap layout published by
 * Mark Bruls, Kees Huizing, and Jarke J. van Wijk
 * <p>
 * Squarified Treemaps
 * https://www.win.tue.nl/~vanwijk/stm.pdf
 * <p>
 * adapted from:https://github.com/peterdmv/treemap/
 * <p>
 * https://github.com/tasubo/javafx-chart-treemap/blob/master/src/main/java/javafx/scene/chart/treemap/TreemapLayout.java
 * http://www.win.tue.nl/~vanwijk/stm.pdf
 *
 * @author Tadas Subonis <tadas.subonis@gmail.com>
 */
public class TreeMap2D<X> extends DynamicLayout2D<X> {
    private double areaPerPri;

    private float updateRate = 1;

    private static final boolean sort = true;

    @Override
    protected void layout(Graph2D<X> g, float dtS) {
        RectF b = g.bounds;
        double width = b.w, height = b.h;
        heightRemain = height;
        widthRemain = width;
//        this.width = width; this.height = height;
        this.left = b.x;
        this.top = b.y;

        layoutOrient = width > height ? LayoutOrient.VERTICAL : LayoutOrient.HORIZONTAL;

        areaPerPri = (width * height) / totalPri(nodes);

        layoutSquare(sort ? sort(nodes) : nodes, EMPTY_DEQUE, minimumSide());

        for (var x : nodes)
            x.commitLerp(updateRate);
    }

    private static <X> List<MutableRectFloat<X>> sort(Iterable<MutableRectFloat<X>> nodes) {
        var l = new Lst<>(nodes);
        l.sortThisByFloat(z -> -z.node.pri, true);
        return l;
    }

    enum LayoutOrient {
        VERTICAL, HORIZONTAL
    }

    private double heightRemain;
    private double widthRemain;
    //    private double width, height;
    private double left = 0.0;
    private double top = 0.0;
    private LayoutOrient layoutOrient = LayoutOrient.VERTICAL;


    private void layoutSquare(Collection<MutableRectFloat<X>> children, Deque<MutableRectFloat<X>> row, double w) {

        Deque<MutableRectFloat<X>> concatRow = new ArrayDeque<>(row);

        boolean cl = children instanceof List l;
        Collection<MutableRectFloat<X>> remaining =
                cl ? ((List)children).subList(1, children.size()) :
                new ArrayDeque<>(children.size() - 1);

        int i = 0;
        for (Iterator<MutableRectFloat<X>> iterator = children.iterator(); iterator.hasNext(); i++) {
            MutableRectFloat<X> c = iterator.next();
            if (i == 0)
                concatRow.add(c);
            else {
                if (!cl)
                    remaining.add(c);
            }
        }

        double worstConcat = worst(concatRow, w);
        double worstRow = worst(row, w);

        if (row.isEmpty() || worstRow > worstConcat || equals(worstRow, worstConcat)) {
            if (remaining.isEmpty())
                layoutRow(concatRow, w);
            else
                layoutSquare(remaining, concatRow, w);
        } else {
            layoutRow(row, w);
            layoutSquare(children, EMPTY_DEQUE, minimumSide());
        }
    }

//    @NotNull
//    private static Deque<MutableRectFloat<X>> deque(Iterable<MutableRectFloat<X>> children) {
//        Deque<MutableRectFloat<X>> remainPopped = new ArrayDeque<>(children instanceof Collection c ? c.size() : 0);
//        Iterables.addAll(remainPopped, children);
//        return remainPopped;
//    }

    private static final Deque EMPTY_DEQUE = new ArrayDeque(0);

    private double worst(Iterable<MutableRectFloat<X>> ch, double w) {

        double areaSum = 0, maxArea = Double.NEGATIVE_INFINITY, minArea = Double.POSITIVE_INFINITY;
        for (MutableRectFloat<X> item : ch) {
            double area = area(item);
            areaSum += area;
            minArea = Math.min(minArea, area);
            maxArea = Math.max(maxArea, area);
        }
        if (areaSum == 0)
            return Double.POSITIVE_INFINITY;

        double sqw = w * w;
        double sqAreaSum = areaSum * areaSum;
        return Math.max(sqw * maxArea / sqAreaSum, sqAreaSum / (sqw * minArea));
    }

    private double area(MutableRectFloat<X> item) {
        return item.node.pri * areaPerPri;
    }

    private void layoutRow(Iterable<MutableRectFloat<X>> row, double w) {
        double totalArea = totalArea(row);
        if (layoutOrient == LayoutOrient.VERTICAL)
            layoutVertical(row, w, totalArea);
        else
            layoutHorizontal(row, w, totalArea);

    }

    private void layoutHorizontal(Iterable<MutableRectFloat<X>> row, double w, double totalArea) {
        double rowHeight = totalArea / w;
        double dx = 0;

        for (MutableRectFloat<X> item : row) {
            double area = area(item);
            double W = area / rowHeight;
            item.setX0Y0WH((float) (left + dx), (float) top, (float) W, (float) rowHeight);
            dx += W;
        }

        this.heightRemain -= rowHeight;
        this.top += rowHeight;

        double minimumSide = minimumSide();
        if (!equals(minimumSide, widthRemain))
            changeLayout();
    }

    private void layoutVertical(Iterable<MutableRectFloat<X>> row, double w, double totalArea) {
        double rowWidth = totalArea / w;
        double dy = 0;

        for (MutableRectFloat<X> item : row) {
            double area = area(item);
            double H = area / rowWidth;
            item.setX0Y0WH((float) left, (float) (top + dy), (float) rowWidth, (float) H);
            dy += H;
        }
        this.widthRemain -= rowWidth;

        this.left += rowWidth;
        double minimumSide = minimumSide();
        if (!equals(minimumSide, heightRemain))
            changeLayout();
    }

    private static <X> double totalPri(Iterable<MutableRectFloat<X>> x) {
        double y = 0;
        for (var item : x)
            y += item.node.pri;
        return y;
    }

    private double totalArea(Iterable<MutableRectFloat<X>> x) {
        double y = 0;
        for (var item : x)
            y += area(item);
        return y;
    }

    private void changeLayout() {
        layoutOrient = layoutOrient == LayoutOrient.HORIZONTAL ? LayoutOrient.VERTICAL : LayoutOrient.HORIZONTAL;
    }

    private static final double epsilon =
            //0.1f;
            //0.01f;
            0.00001f;

    private static boolean equals(double x, double y) {
        return Util.equals(x, y, epsilon);
    }

    private double minimumSide() {
        return Math.min(heightRemain, widthRemain);
    }

}