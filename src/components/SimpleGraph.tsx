import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { Link2, X, Grid, Circle, Zap, Layers, GitBranch } from "lucide-react";

interface Node {
  id: string;
  node_type: string;
  label: string;
  description?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  confidence: number;
}

interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: string;
  description?: string;
  weight: number;
  confidence: number;
  created_at: string;
  source?: string;
}

interface SimpleGraphProps {
  nodes: Node[];
  relationships: Relationship[];
  onNodeSelect: (nodeId: string) => void;
  onCreateRelationship?: (relationshipData: {
    source_id: string;
    target_id: string;
    relation_type: string;
    description?: string;
    confidence?: number;
    source?: string;
  }) => void;
  onDeleteRelationship?: (relationshipId: string) => void;
  loading: boolean;
}

const nodeTypeColors: Record<string, string> = {
  Person: "#3b82f6",
  Organization: "#ef4444", 
  CryptoWallet: "#f59e0b",
  SocialAccount: "#8b5cf6",
  Domain: "#10b981",
  IpAddress: "#6b7280",
  Email: "#ec4899",
  Phone: "#06b6d4",
  Document: "#84cc16",
  Event: "#f97316",
};

const relationshipTypes = [
  "Owns", "Controls", "TransactsWith", "MemberOf", 
  "ConnectedTo", "SameAs", "RelatedTo", "ParentOf", "ChildOf"
];

// Helper function to get confidence-based edge color
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return "#10b981"; // High confidence - green
  if (confidence >= 0.6) return "#f59e0b"; // Medium confidence - yellow
  if (confidence >= 0.4) return "#ef4444"; // Low confidence - red
  return "#6b7280"; // Very low confidence - gray
};

// Helper function to get confidence-based edge width
const getConfidenceWidth = (confidence: number): number => {
  if (confidence >= 0.8) return 4;
  if (confidence >= 0.6) return 3;
  if (confidence >= 0.4) return 2;
  return 1;
};

const SimpleGraph = ({ nodes, relationships, onNodeSelect, onCreateRelationship, onDeleteRelationship, loading }: SimpleGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isRelationshipMode, setIsRelationshipMode] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState("ConnectedTo");
  const [relationshipDescription, setRelationshipDescription] = useState("");
  const [relationshipConfidence, setRelationshipConfidence] = useState(70);
  const [relationshipSource, setRelationshipSource] = useState("");
  const [layoutMode, setLayoutMode] = useState<"circle" | "grid" | "cose" | "breadthfirst" | "force">("circle");

  // Initialize cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    console.log("Initializing cytoscape with nodes:", nodes.length, "relationships:", relationships.length);

    const cy = cytoscape({
      container: containerRef.current,
      zoom: 0.5,
      pan: { x: 0, y: 0 },
      minZoom: 0.1,
      maxZoom: 2,
      style: [
        {
          selector: "node",
          style: {
            "background-color": (ele: any) => nodeTypeColors[ele.data("type")] || "#666",
            "label": "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "color": "#fff",
            "font-size": "12px",
            "text-outline-width": 1,
            "text-outline-color": "#000",
            "width": "60px",
            "height": "60px",
            "font-weight": "bold",
            "text-wrap": "wrap",
            "text-max-width": "50px",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#fff",
          },
        },
        {
          selector: "node.multi-selected",
          style: {
            "border-width": 4,
            "border-color": "#ff6b6b",
            "border-opacity": 1,
          },
        },
        {
          selector: "edge",
          style: {
            "width": (ele: any) => getConfidenceWidth(ele.data("confidence") || 0.5),
            "line-color": (ele: any) => getConfidenceColor(ele.data("confidence") || 0.5),
            "target-arrow-color": (ele: any) => getConfidenceColor(ele.data("confidence") || 0.5),
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "label": (ele: any) => {
              const rel = ele.data("relationship");
              const conf = ele.data("confidence");
              const percentage = conf ? Math.round(conf * 100) : 50;
              return `${rel} (${percentage}%)`;
            },
            "font-size": "10px",
            "color": "#ccc",
            "text-background-color": "rgba(0,0,0,0.7)",
            "text-background-opacity": 1,
            "text-background-padding": "2px",
            "source-distance-from-node": 10,
            "target-distance-from-node": 10,
          },
        },
        {
          selector: "edge:selected",
          style: {
            "line-color": "#ef4444",
            "target-arrow-color": "#ef4444",
            "width": 4,
          },
        },
      ],
    });

    // Handle node clicks - we'll use a ref to access current isRelationshipMode
    const handleNodeTap = (event: any) => {
      const nodeId = event.target.id();
      
      // Access current state directly from the component
      const currentMode = cyRef.current?.scratch('_relationshipMode') || false;
      
      if (currentMode) {
        // Multi-select mode for relationships
        event.target.toggleClass("multi-selected");
        setSelectedNodes(prev => {
          if (prev.includes(nodeId)) {
            return prev.filter(id => id !== nodeId);
          } else if (prev.length < 2) {
            return [...prev, nodeId];
          } else {
            // Replace first selection with new one
            return [prev[1], nodeId];
          }
        });
      } else {
        // Normal selection mode
        cy.$("node").removeClass("multi-selected");
        setSelectedNodes([]);
        onNodeSelect(nodeId);
      }
    };

    // Handle edge clicks
    const handleEdgeTap = (event: any) => {
      const currentMode = cyRef.current?.scratch('_relationshipMode') || false;
      if (!currentMode) {
        const edgeId = event.target.id();
        console.log("Edge clicked:", edgeId);
        event.target.select();
      }
    };

    // Handle background clicks
    const handleBackgroundTap = (event: any) => {
      if (event.target === cy) {
        cy.$("node").removeClass("multi-selected");
        cy.$("edge").unselect();
        setSelectedNodes([]);
        const currentMode = cyRef.current?.scratch('_relationshipMode') || false;
        if (!currentMode) {
          onNodeSelect("");
        }
      }
    };

    cy.on("tap", "node", handleNodeTap);
    cy.on("tap", "edge", handleEdgeTap);
    cy.on("tap", handleBackgroundTap);

    // Handle delete key for selected relationships
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && onDeleteRelationship) {
        const selectedEdges = cy.$("edge:selected");
        if (selectedEdges.length > 0) {
          const edgeId = selectedEdges[0].id();
          if (confirm("Are you sure you want to delete this relationship?")) {
            onDeleteRelationship(edgeId);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    cyRef.current = cy;

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cy.destroy();
    };
  }, [onNodeSelect]);

  // Update selectedNodes when switching modes
  useEffect(() => {
    if (cyRef.current) {
      // Store mode in cytoscape scratch data so event handlers can access it
      cyRef.current.scratch('_relationshipMode', isRelationshipMode);
      
      if (!isRelationshipMode) {
        setSelectedNodes([]);
        cyRef.current.$("node").removeClass("multi-selected");
      }
    }
  }, [isRelationshipMode]);

  // Show relationship modal when 2 nodes selected
  useEffect(() => {
    if (selectedNodes.length === 2) {
      setShowRelationshipModal(true);
    } else {
      setShowRelationshipModal(false);
    }
  }, [selectedNodes]);

  // Update graph data
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;
    
    console.log("Updating graph with nodes:", nodes.length, "relationships:", relationships.length);
    console.log("Node data:", nodes);

    // Convert nodes to cytoscape format
    const cyNodes = nodes.map(node => ({
      data: {
        id: node.id,
        label: node.label,
        type: node.node_type,
      },
    }));

    // Convert relationships to cytoscape format, filtering out relationships with missing nodes
    const nodeIds = new Set(nodes.map(node => node.id));
    const validRelationships = relationships.filter(rel => 
      nodeIds.has(rel.source_id) && nodeIds.has(rel.target_id)
    );
    
    const cyEdges = validRelationships.map(rel => ({
      data: {
        id: rel.id,
        source: rel.source_id,
        target: rel.target_id,
        relationship: rel.relation_type,
        confidence: rel.confidence || 0.5, // Default to 50% if not specified
        weight: rel.weight,
        description: rel.description,
        source_info: rel.source,
      },
    }));

    console.log("Converted cyNodes:", cyNodes.length, "cyEdges:", cyEdges.length);
    
    // Filter out invalid relationships
    if (validRelationships.length < relationships.length) {
      console.warn(`Filtered out ${relationships.length - validRelationships.length} orphaned relationships`);
    }

    // Clear and add all elements with error handling
    try {
      cy.elements().remove();
      if (cyNodes.length > 0) {
        cy.add(cyNodes);
      }
      if (cyEdges.length > 0) {
        cy.add(cyEdges);
      }
    } catch (error) {
      console.error("Error updating graph elements:", error);
      // Try to recover by just adding nodes without edges
      try {
        cy.elements().remove();
        if (cyNodes.length > 0) {
          cy.add(cyNodes);
        }
      } catch (fallbackError) {
        console.error("Failed to recover graph state:", fallbackError);
      }
    }

    console.log("Added elements, current nodes in graph:", cy.nodes().length);

    // Apply simple layout
    if (cyNodes.length > 0) {
      cy.layout({
        name: 'circle',
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 20,
        radius: Math.min(200, 50 + cyNodes.length * 10),
      }).run();
    }

  }, [nodes, relationships]);

  // Apply layout when mode changes
  useEffect(() => {
    if (!cyRef.current) return;

    const applyLayout = () => {
      let layoutOptions: any = { animate: true, animationDuration: 500 };

      switch (layoutMode) {
        case "circle":
          layoutOptions = {
            ...layoutOptions,
            name: "circle",
            fit: true,
            padding: 20,
            radius: Math.min(200, 50 + nodes.length * 10),
          };
          break;
        
        case "grid":
          layoutOptions = {
            ...layoutOptions,
            name: "grid",
            fit: true,
            padding: 20,
            rows: Math.ceil(Math.sqrt(nodes.length)),
          };
          break;
        
        case "cose":
          layoutOptions = {
            ...layoutOptions,
            name: "cose",
            fit: true,
            padding: 20,
            nodeRepulsion: () => 400000,
            nodeOverlap: 20,
            idealEdgeLength: () => 50,
            componentSpacing: 100,
          };
          break;
        
        case "breadthfirst":
          layoutOptions = {
            ...layoutOptions,
            name: "breadthfirst",
            fit: true,
            padding: 20,
            directed: true,
            spacingFactor: 1.5,
          };
          break;
        
        case "force":
          layoutOptions = {
            ...layoutOptions,
            name: "cose",
            fit: true,
            padding: 20,
            nodeRepulsion: () => 200000,
            nodeOverlap: 4,
            idealEdgeLength: () => 32,
            edgeElasticity: () => 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0,
          };
          break;
      }

      cyRef.current?.layout(layoutOptions).run();
    };

    applyLayout();
  }, [layoutMode, nodes.length]);


  const handleCreateRelationship = () => {
    if (selectedNodes.length === 2 && onCreateRelationship) {
      onCreateRelationship({
        source_id: selectedNodes[0],
        target_id: selectedNodes[1],
        relation_type: selectedRelationType,
        description: relationshipDescription.trim() || undefined,
        confidence: relationshipConfidence / 100, // Convert percentage to decimal
        source: relationshipSource.trim() || undefined,
      });
      
      // Reset state
      setSelectedNodes([]);
      setRelationshipDescription("");
      setRelationshipConfidence(70);
      setRelationshipSource("");
      setShowRelationshipModal(false);
      if (cyRef.current) {
        cyRef.current.$("node").removeClass("multi-selected");
      }
    }
  };

  const cancelRelationship = () => {
    setSelectedNodes([]);
    setRelationshipDescription("");
    setShowRelationshipModal(false);
    if (cyRef.current) {
      cyRef.current.$("node").removeClass("multi-selected");
    }
  };

  return (
    <div className="graph-container">
      {loading && (
        <div className="graph-loading">
          <div className="loading-spinner" />
          <span>Loading graph...</span>
        </div>
      )}

      {/* Relationship Mode Toggle */}
      {onCreateRelationship && (
        <div className="graph-controls">
          <button
            className={`relationship-mode-btn ${isRelationshipMode ? 'active' : ''}`}
            onClick={() => setIsRelationshipMode(!isRelationshipMode)}
          >
            <Link2 size={16} />
            {isRelationshipMode ? 'Exit Link Mode' : 'Link Entities'}
          </button>
          
          {isRelationshipMode && (
            <div className="relationship-help">
              Click two entities to create a relationship
            </div>
          )}
        </div>
      )}

      <div className="layout-controls">
        <label>Layout:</label>
        <div className="layout-buttons">
          <button
            className={`layout-btn ${layoutMode === 'circle' ? 'active' : ''}`}
            onClick={() => setLayoutMode('circle')}
            title="Circle Layout"
          >
            <Circle size={16} />
          </button>
          <button
            className={`layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
            onClick={() => setLayoutMode('grid')}
            title="Grid Layout"
          >
            <Grid size={16} />
          </button>
          <button
            className={`layout-btn ${layoutMode === 'cose' ? 'active' : ''}`}
            onClick={() => setLayoutMode('cose')}
            title="Force-Directed (COSE)"
          >
            <Zap size={16} />
          </button>
          <button
            className={`layout-btn ${layoutMode === 'breadthfirst' ? 'active' : ''}`}
            onClick={() => setLayoutMode('breadthfirst')}
            title="Hierarchical Layout"
          >
            <GitBranch size={16} />
          </button>
          <button
            className={`layout-btn ${layoutMode === 'force' ? 'active' : ''}`}
            onClick={() => setLayoutMode('force')}
            title="Organic Force Layout"
          >
            <Layers size={16} />
          </button>
        </div>
      </div>

      {/* Relationship Creation Modal */}
      {showRelationshipModal && (
        <div className="relationship-modal">
          <div className="relationship-modal-content">
            <div className="relationship-modal-header">
              <h3>Create Relationship</h3>
              <button onClick={cancelRelationship} className="close-btn">
                <X size={16} />
              </button>
            </div>
            
            <div className="relationship-form">
              <div className="form-group">
                <label>Relationship Type</label>
                <select 
                  value={selectedRelationType}
                  onChange={(e) => setSelectedRelationType(e.target.value)}
                >
                  {relationshipTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={relationshipDescription}
                  onChange={(e) => setRelationshipDescription(e.target.value)}
                  placeholder="Add details about this relationship..."
                />
              </div>

              <div className="form-group">
                <label>Confidence Level: {relationshipConfidence}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={relationshipConfidence}
                  onChange={(e) => setRelationshipConfidence(Number(e.target.value))}
                  className="confidence-slider"
                />
                <div className="confidence-labels">
                  <span>Low (0%)</span>
                  <span>Medium (50%)</span>
                  <span>High (100%)</span>
                </div>
              </div>

              <div className="form-group">
                <label>Source (Optional)</label>
                <input
                  type="text"
                  value={relationshipSource}
                  onChange={(e) => setRelationshipSource(e.target.value)}
                  placeholder="Data source or reference..."
                />
              </div>
              
              <div className="form-actions">
                <button onClick={handleCreateRelationship} className="create-btn">
                  Create Relationship
                </button>
                <button onClick={cancelRelationship} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="cytoscape-container" />
      
      {nodes.length === 0 && !loading && (
        <div className="empty-graph">
          <h3>No entities found</h3>
          <p>Create your first entity using the sidebar to get started</p>
        </div>
      )}
      
      <div className="graph-instructions">
        <p>
          {isRelationshipMode 
            ? "🔗 Link Mode: Click entities to connect them"
            : "📌 Click to select • Scroll to zoom • Drag to move"
          }
        </p>
      </div>
    </div>
  );
};

export default SimpleGraph;