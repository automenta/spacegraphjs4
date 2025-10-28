package spacegraph.util.vis;

import com.mxgraph.layout.hierarchical.mxHierarchicalLayout;
import com.mxgraph.swing.mxGraphComponent;
import com.mxgraph.util.mxConstants;
import com.mxgraph.view.mxCellState;
import com.mxgraph.view.mxGraph;
import com.mxgraph.view.mxGraphView;
import com.mxgraph.view.mxStylesheet;
import jdk.jfr.consumer.RecordedFrame;
import jdk.jfr.consumer.RecordingFile;

import javax.swing.*;
import java.awt.*;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * JFR (Java Flight Recorder) Execution Graph Visualizer
 *
 * TODO
 *   Verify that sequences of hidden nodes between visible nodes contribute to the importance of the call path
 *
 *   Adding more sophisticated node importance metrics:
 *      Method execution time
 *      Call stack depth
 *      Package/class hierarchy weighting
 *
 *
 *   Implementing hierarchical viewing:
 *      Group methods by package/class
 *      Expandable/collapsible node clusters
 *      Different zoom levels
 *
 *
 *    Adding search/filter capabilities:
 *      Filter by package/class name
 *      Highlight specific call paths
 *      Show/hide specific method types
 */
public class JFRAnalyzer extends JFrame {
    private final mxGraph graph;
    private final Map<String, Object> vertices;
    private final Map<String, Double> edgeWeights;
    private final Map<String, Integer> nodeWeights;
    private final JPanel controlPanel;
    private final Object graphParent;
    private int nodesVisible = 128; // Configurable max nodes to display
    private double edgeWeightVisThreshold = 0.0; // Dynamic threshold for edge visibility

    int eventCount = 0;
    int eventMax =
        //Integer.MAX_VALUE;
        1 * 1048;


    public JFRAnalyzer(String jfrFilePath) {
        super("JFR Control Flow Graph Analyzer");

        vertices = new HashMap<>();
        edgeWeights = new HashMap<>();
        nodeWeights = new HashMap<>();



        graph = new mxGraph();
        graph.setAllowLoops(false);
        graph.setMultigraph(false);

        var s = new mxStylesheet();
        s.getDefaultEdgeStyle().put(mxConstants.STYLE_NOLABEL, true);
        graph.setStylesheet(s);

        graph.setView(new mxGraphView(graph) {

            final Function<? super Object, ? extends mxCellState> stateCreator = this::createState;

            @Override
            public mxCellState getState(Object cell, boolean create) {
                if (cell == null)
                    return null;
                else if (create && graph.isCellVisible(cell))
                    return states.computeIfAbsent(cell, stateCreator);
                else
                    return states.get(cell);
            }

        });
        graphParent = graph.getDefaultParent();

        analyzeJFRFile(jfrFilePath);

        layoutGraph();


        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1200, 800);

        setLayout(new BorderLayout());

        controlPanel = new JPanel();
        setupControlPanel();
        add(controlPanel, BorderLayout.NORTH);


        var c = new mxGraphComponent(graph);
        c.setAntiAlias(true);
        //c.setExportEnabled(true);
        c.setTextAntiAlias(true);
        c.setPanning(true);
//        c.addMouseMotionListener(new MouseMotionAdapter() {
//            private Point lastPoint;
//
//            @Override
//            public void mouseDragged(MouseEvent e) {
//                c.getPanningHandler().mouseDragged(e);
//
////                if (lastPoint != null) {
////                    int dx = e.getX() - lastPoint.x;
////                    int dy = e.getY() - lastPoint.y;
////                    var t = c.getGraphControl().getTranslate();
////                    t.x += dx; t.y += dy;
////                    c.getGraphControl().setTranslate(t);
////                }
////                lastPoint = e.getPoint();
//            }
//
//            @Override
//            public void mouseMoved(MouseEvent e) {
//                lastPoint = null;
//            }
//        });

        c.addMouseWheelListener(e -> {
            if (e.getWheelRotation() < 0) c.zoomOut();
            else c.zoomIn();
        });

        add(c, BorderLayout.CENTER);
    }

    private static String methodID(RecordedFrame frame) {
        var m = frame.getMethod();
        return m.getType().getName() +
               '.' +
               m.getName() + m.getDescriptor()
                //+ ":" + frame.getLineNumber()
        ;
    }

    static final String _file = "/home/me/IdeaSnapshots/Tetris_Tetris_Classic__1__2024_12_28_093036.jfr";

    public static void main(String[] args) {
//        if (args.length != 1) {
//            System.out.println("Usage: java JFRAnalyzer <jfr-file-path>");
//            System.exit(1);
//        }
//        String file = args[0];


        SwingUtilities.invokeLater(() -> new JFRAnalyzer(_file).setVisible(true));
    }

    private void processStackTrace(List<RecordedFrame> frames) {
        var n = frames.size() - 1;
        for (var i = 0; i < n; i++) {
            var currentFrame = frames.get(i);
            var nextFrame = frames.get(i + 1);

            var currentMethod = methodID(currentFrame);
            var nextMethod = methodID(nextFrame);

            // Update node weights (frequency of method appearances)
            nodeWeights.merge(currentMethod, 1, Integer::sum);
            nodeWeights.merge(nextMethod, 1, Integer::sum);

            // Update edge weights as before
            var edgeKey = currentMethod + "->" + nextMethod;
            edgeWeights.merge(edgeKey, 1.0, Double::sum);
        }
    }

    private void renderFilteredGraph() {
        graph.getModel().beginUpdate();
        try {
            graph.removeCells(graph.getChildVertices(graphParent));

            // Get top N nodes by weight
            var importantNodes = nodeWeights.entrySet()
                    .stream()
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .limit(nodesVisible)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toSet());

            // Calculate weight threshold (optional: use percentile instead of fixed threshold)
            var maxWeight = edgeWeights.values().stream()
                    .mapToDouble(Double::doubleValue)
                    .max()
                    .orElse(1.0);
            //edgeWeightVisThreshold = maxWeight * 0.05; // Show edges with >5% of max weight

            // Add vertices for important nodes
            importantNodes.forEach(this::addVertex);

            // Add edges between important nodes that meet weight threshold
            edgeWeights.forEach((edgeKey, weight) -> {
                var methods = arrow.split(edgeKey);
                if (weight >= edgeWeightVisThreshold &&
                        importantNodes.contains(methods[0]) &&
                        importantNodes.contains(methods[1])) {

                    var edge = graph.insertEdge(
                            graphParent,
                            null,
                            edgeKey,
                            vertices.get(methods[1]),
                            vertices.get(methods[0]));

                    // Set edge style based on normalized weight
                    var normalizedThickness = Math.min(5, Math.log(weight / edgeWeightVisThreshold) + 1);
                    graph.setCellStyle("strokeWidth=" + normalizedThickness, new Object[]{edge});
                }
            });

            layoutGraph();
        } finally {
            graph.getModel().endUpdate();
        }
    }

    // Add slider to control number of nodes
    private void setupControlPanel() {
        controlPanel.setLayout(new FlowLayout());

        var nodeSlider = new JSlider(JSlider.HORIZONTAL, 10, 200, nodesVisible);
        nodeSlider.setMajorTickSpacing(50);
        nodeSlider.setMinorTickSpacing(10);
        nodeSlider.setPaintTicks(true);
        nodeSlider.setPaintLabels(true);
        nodeSlider.addChangeListener(e -> {
            if (!nodeSlider.getValueIsAdjusting()) {
                nodesVisible = nodeSlider.getValue();
                renderFilteredGraph();
            }
        });

        // Weight threshold slider
        var weightSlider = new JSlider(JSlider.HORIZONTAL, 0, 100, 0);
        weightSlider.setMajorTickSpacing(20);
        weightSlider.setMinorTickSpacing(5);
        weightSlider.setPaintTicks(true);
        weightSlider.setPaintLabels(true);
        weightSlider.addChangeListener(e -> {
            if (!weightSlider.getValueIsAdjusting()) {
                var maxWeight = edgeWeights.values().stream()
                        .mapToDouble(Double::doubleValue)
                        .max()
                        .orElse(1.0);
                edgeWeightVisThreshold = maxWeight * (weightSlider.getValue() / 100.0);
                renderFilteredGraph();
            }
        });

        controlPanel.add(new JLabel("Max Nodes:"));
        controlPanel.add(nodeSlider);
        controlPanel.add(new JLabel("Min Weight %:"));
        controlPanel.add(weightSlider);
    }

    // Method to analyze entire file first, then render
    public synchronized void analyzeJFRFile(String jfrFilePath) {
        eventCount = 0;
        try (var rec = new RecordingFile(Paths.get(jfrFilePath))) {
            // First pass: collect all weights
            while (rec.hasMoreEvents() && analyzeEvent(rec));

            // Then render the filtered graph
            renderFilteredGraph();

        } catch (Exception e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(this,
                    "Error analyzing JFR file: " + e.getMessage(),
                    "Error",
                    JOptionPane.ERROR_MESSAGE);
        }
    }

    // Optional: Add method importance scoring
    private double calculateNodeImportance(String method) {
        // Base importance on:
        // 1. How frequently the method appears (node weight)
        double frequencyScore = nodeWeights.getOrDefault(method, 0);

        // 2. Sum of incoming edge weights (how often it's called)
        var incomingWeight = edgeWeights.entrySet().stream()
                .filter(e -> e.getKey().split("->")[1].equals(method))
                .mapToDouble(Map.Entry::getValue)
                .sum();

        // 3. Sum of outgoing edge weights (how often it calls others)
        var outgoingWeight = edgeWeights.entrySet().stream()
                .filter(e -> e.getKey().split("->")[0].equals(method))
                .mapToDouble(Map.Entry::getValue)
                .sum();

        // Combine scores (adjust weights as needed)
        return frequencyScore * 0.4 + incomingWeight * 0.3 + outgoingWeight * 0.3;
    }

    private boolean analyzeEvent(RecordingFile rec) throws IOException {
        var e = rec.readEvent();
        if ("jdk.ExecutionSample".equals(e.getEventType().getName())) {
            var s = e.getStackTrace();

            if (s != null) {
                var frames = s.getFrames();
                System.out.println(eventCount + ": " + methodID(frames.getLast()) + ":" + frames.getLast().getLineNumber());
                eventCount++;
                if (eventCount > eventMax) return false;
                processStackTrace(frames);
            }
        }
        return true;
    }

//    private void processStackTrace(List<RecordedFrame> frames) {
//        var n = frames.size() - 1;
//        for (var i = 0; i < n; i++) {
//            var currentFrame = frames.get(i);
////            if (!currentFrame.isJavaFrame())
////                break;
//            var nextFrame = frames.get(i + 1);
//
//            var currentMethod = methodID(currentFrame);
//            var nextMethod = methodID(nextFrame);
//
//            // Add vertices if they don't exist
//            if (i == 0 && !vertices.containsKey(currentMethod))
//                addVertex(currentMethod);
//
//            if (!vertices.containsKey(nextMethod))
//                addVertex(nextMethod);
//
//            // Update edge weight
//            double w =
//                    1;
//            //stackTrace.getDuration(...);
//            var edgeKey = currentMethod + "->" + nextMethod;
//            edgeWeights.merge(edgeKey, w, Double::sum);
//
//            // Create or update edge
//            var edge = graph.insertEdge(
//                    graphParent,
//                    null,
//                    edgeKey, //String.format("%.0f calls", edgeWeights.get(edgeKey)),
//                    vertices.get(currentMethod),
//                    vertices.get(nextMethod));
//
//            // Set edge style based on weight
//            var thickness = Math.min(5, Math.log(edgeWeights.get(edgeKey)) + 1);
//            graph.setCellStyle("strokeWidth=" + thickness, new Object[]{edge});
//        }
//
//    }

    private void addVertex(String method) {
        vertices.put(method, graph.insertVertex(
                graphParent, null, method,
                0, 0, 50, 50));
    }

    private void layoutGraph() {
        //var l = new mxOrganicLayout(graph);

//        var l = new mxFastOrganicLayout(graph);
//        l.setForceConstant(50);  // Increase spacing between vertices
//        l.setMaxIterations(l.getMaxIterations()*100);
//        l.setMinDistanceLimit(0.1f);
        var l = new mxHierarchicalLayout(graph);
        l.setFineTuning(true);
        l.execute(graphParent);
    }

    private static final Pattern arrow = Pattern.compile("->");

}