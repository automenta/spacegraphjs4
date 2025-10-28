package spacegraph.util.vis;

import jdk.jfr.consumer.RecordedFrame;
import jdk.jfr.consumer.RecordingFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * A concrete viewer that reads a JFR file and builds a 3D graph of method samples,
 * optionally collapsing to the top-N most active edges with accumulated aggregation.
 */
public class JFRGraph3D extends AbstractGraph3DViewer {

    private final Path jfrPath;
    private RecordingFile recordingFile;
    private int eventCap = Integer.MAX_VALUE; // limit total events
    private final int topNEdgesToKeep;        // if > 0, keep only top N edges

    /**
     * Constructor that loads the entire JFR file and optionally collapses
     * to the topNEdges most active edges (with accumulated activity).
     *
     * @param jfrFilePath      Path to the JFR file
     * @param eventCap         Maximum number of events to load
     * @param topNEdgesToKeep  Number of edges to keep by activity (<= 0 means keep all)
     */
    public JFRGraph3D(String jfrFilePath, int eventCap, int topNEdgesToKeep) {
        this.jfrPath = Paths.get(jfrFilePath);
        this.eventCap = eventCap;
        this.topNEdgesToKeep = topNEdgesToKeep;

        // Perform an initial one-shot load of the data
        loadData(eventCap);

        // If user wants only the top N edges, collapse the rest
        if (topNEdgesToKeep > 0) collapseEdges(topNEdgesToKeep);

        // Filter step as needed (here we default to no threshold)
        filterByActivity(0, 0);

        // Then build edgesForRendering + layout
        computeMaxActivities();
        buildEdgesForRendering();
    }

    /**
     * Optional shorter constructor if you want to keep all edges:
     */
    public JFRGraph3D(String jfrFilePath, int eventCap) {
        this(jfrFilePath, eventCap, 0);
    }

    /**
     * Optionally, you could open the file but only read a chunk of events at a time.
     */
    public void openFileForProgressiveLoad() throws IOException {
        if (recordingFile == null) recordingFile = new RecordingFile(jfrPath);
    }

    public void loadNextChunk(int chunkSize) throws IOException {
        if (recordingFile == null)
            openFileForProgressiveLoad();

        long count = 0;
        while (count < chunkSize && recordingFile.hasMoreEvents() && count < eventCap) {
            var e = recordingFile.readEvent();
            if ("jdk.ExecutionSample".equals(e.getEventType().getName())) {
                var st = e.getStackTrace();
                if (st != null)
                    processStackTrace(st.getFrames());
            }
            count++;
        }
    }

    /**
     * Loads the data one-shot (up to eventCap).
     */
    @Override
    protected void loadData(int eventCap) {
        long count = 0;
        try (var rec = new RecordingFile(jfrPath)) {
            while (rec.hasMoreEvents() && count < eventCap) {
                var e = rec.readEvent();
                if ("jdk.ExecutionSample".equals(e.getEventType().getName())) {
                    var st = e.getStackTrace();
                    if (st != null) processStackTrace(st.getFrames());
                }
                count++;
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        System.out.println("Loaded events: " + count);
    }

    /**
     * Collapses the graph so that only the topN most active edges remain.
     * All other edges are removed, but their activity is added to whichever kept
     * edge shares a node (source or target), picking the kept edge with the largest
     * existing activity.
     *
     * Additionally, it removes any nodes that are no longer connected by any edge.
     *
     * @param topN Number of top edges to keep
     */
    private void collapseEdges(int topN) {
        // 1) Sort all edges by descending activity
        List<GraphEdge> sortedEdges = new ArrayList<>(edgeMap.values());
        sortedEdges.sort(Comparator.comparingInt(GraphEdge::getActivity).reversed());

        // 2) Keep top N in a Set
        Set<GraphEdge> keep = new HashSet<>(sortedEdges.subList(0, Math.min(topN, sortedEdges.size())));

        // 3) For edges outside the top N, accumulate their activity into
        //    whichever kept edge shares a node (source or target), picking
        //    the kept edge with the greatest current activity.
        for (var i = topN; i < sortedEdges.size(); i++) {
            var discardEdge = sortedEdges.get(i);
            var bestMatch = findBestMatchAmongKept(discardEdge, keep);
            if (bestMatch != null) bestMatch.activity += discardEdge.activity;
        }

        // 4) Remove all edges that are not in 'keep'
        edgeMap.values().removeIf(e -> !keep.contains(e));

        // 5) Remove nodes that are no longer connected by any edge
        removeOrphanNodes();
    }

    /**
     * Finds the best-matching edge in 'keep' that shares a node
     * with 'discardEdge'. If multiple match, pick the one with
     * the greatest current activity.
     *
     * @param discardEdge The edge to find matches for
     * @param keep        The set of kept edges
     * @return The best matching kept edge, or null if none found
     */
    private GraphEdge findBestMatchAmongKept(GraphEdge discardEdge, Set<GraphEdge> keep) {
        var dSrc = discardEdge.source;
        var dTgt = discardEdge.target;

        GraphEdge best = null;
        var bestActivity = -1;

        // Share a node?
        for (var candidate : keep)
            if (candidate.source.equals(dSrc) || candidate.source.equals(dTgt)
                    || candidate.target.equals(dSrc) || candidate.target.equals(dTgt)) {
                var candActivity = candidate.activity;
                if (candActivity > bestActivity) {
                    bestActivity = candActivity;
                    best = candidate;
                }
            }
        return best;
    }

    /**
     * Removes nodes that are not connected by any edge.
     * This ensures no orphaned nodes are left in the graph.
     */
    private void removeOrphanNodes() {
        // Collect all nodes that are part of any edge
        Set<GraphNode> connectedNodes = new HashSet<>();
        for (var edge : edgeMap.values()) {
            connectedNodes.add(edge.source);
            connectedNodes.add(edge.target);
        }

        // Remove nodes that are not connected
        nodes.values().removeIf(node -> !connectedNodes.contains(node));
    }

    /**
     * Process a stack trace and increment node/edge activity.
     */
    private void processStackTrace(List<RecordedFrame> frames) {
        var n = frames.size();
        // For each consecutive pair in the call stack
        for (var i = 0; i < n - 1; i++) {
            var curMethodKey = methodKey(frames.get(i));
            var nextMethodKey = methodKey(frames.get(i + 1));

            var sourceNode = nodeOrNew(curMethodKey, extractMethodName(frames.get(i)));
            var targetNode = nodeOrNew(nextMethodKey, extractMethodName(frames.get(i + 1)));
            sourceNode.activity++;
            targetNode.activity++;

            var edge = edgeOrNew(curMethodKey, nextMethodKey, sourceNode, targetNode);
            edge.activity++;
        }
    }

    /**
     * Generates a key for the method (for node map).
     */
    private String methodKey(RecordedFrame frame) {
        var m = frame.getMethod();
        if (m == null || m.getType() == null) return "UnknownMethod";
        // For uniqueness, consider full signature
        return m.getType().getName() + "." + m.getName() + m.getDescriptor();
    }

    /**
     * Extract a friendly method name for display in the node.
     */
    private String extractMethodName(RecordedFrame frame) {
        var m = frame.getMethod();
        if (m == null) return "UnknownMethod";
        return m.getType().getName() + "." + m.getName();
    }

    /**
     * Make a "cool" color gradient from Blue → Green → Red.
     *  - ratio < 0.5: interpolate from Blue (0,0,1) to Green (0,1,0)
     *  - ratio >= 0.5: interpolate from Green (0,1,0) to Red (1,0,0)
     */
    @Override
    protected float[] valueColor(int value, int maxVal) {
        if (maxVal <= 0) return new float[]{0f, 0f, 1f}; // default to blue if no activity
        var ratio = (float) value / (float) maxVal;
        if (ratio < 0) ratio = 0;
        if (ratio > 1) ratio = 1;

        // We split the gradient at 0.5
        if (ratio < 0.5f) {
            // 0.0 -> 0.5: Blue (0,0,1) to Green (0,1,0)
            var local = ratio / 0.5f; // scales 0..0.5 to 0..1
            var r = 0f;
            var g = local;         // from 0 to 1
            var b = 1f - local;    // from 1 down to 0
            return new float[]{r, g, b};
        } else {
            // 0.5 -> 1.0: Green (0,1,0) to Red (1,0,0)
            var local = (ratio - 0.5f) / 0.5f; // scale 0.5..1 to 0..1
            var r = local;        // from 0 to 1
            var g = 1f - local;   // from 1 down to 0
            var b = 0f;
            return new float[]{r, g, b};
        }
    }

    // ------------------------------------------------------------------------
    // Main
    // ------------------------------------------------------------------------
    public static void main(String[] args) {
        // Example usage: keep only top 50 edges, accumulate all others into them
        var surface = new JFRGraph3D(
                "/home/me/IdeaSnapshots/Tetris_Tetris_Classic__1__2024_12_30_152001.jfr",
                400_000,
                512
        );
        // Launch a window
        spacegraph.SpaceGraph.window(surface, 1600, 1000);
    }
}
