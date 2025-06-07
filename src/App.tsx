import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import SimpleGraph from "./components/SimpleGraph";
import Sidebar from "./components/Sidebar";
import NodePanel from "./components/NodePanel";
import SearchBar from "./components/SearchBar";
import Toolbar from "./components/Toolbar";
import MarkdownEditor from "./components/MarkdownEditor";
import ResizablePanel from "./components/ResizablePanel";
import ReportGenerator from "./components/ReportGenerator";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

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

function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");
  const [showReportGenerator, setShowReportGenerator] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [nodesData, relationshipsData] = await Promise.all([
        invoke<Node[]>("get_all_nodes"),
        invoke<Relationship[]>("get_relationships")
      ]);
      console.log("Loaded nodes:", nodesData);
      console.log("Loaded relationships:", relationshipsData);
      setNodes(nodesData);
      setRelationships(relationshipsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNode = async (nodeData: {
    node_type: string;
    label: string;
    description?: string;
    tags: string[];
  }) => {
    try {
      setLoading(true);
      console.log("Creating node:", nodeData);
      const nodeId = await invoke("create_node", { request: nodeData });
      console.log("Created node with ID:", nodeId);
      await loadAllData();
      console.log("Data reloaded after node creation");
    } catch (error) {
      console.error("Failed to create node:", error);
      alert("Failed to create node: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRelationship = async (relationshipData: {
    source_id: string;
    target_id: string;
    relation_type: string;
    description?: string;
    confidence?: number;
    source?: string;
  }) => {
    try {
      setLoading(true);
      console.log("Creating relationship:", relationshipData);
      await invoke("create_relationship", { request: relationshipData });
      await loadAllData();
      console.log("Relationship created and data reloaded");
    } catch (error) {
      console.error("Failed to create relationship:", error);
      alert("Failed to create relationship: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    try {
      setLoading(true);
      console.log("Deleting relationship:", relationshipId);
      await invoke("delete_relationship", { id: relationshipId });
      await loadAllData();
      console.log("Relationship deleted and data reloaded");
    } catch (error) {
      console.error("Failed to delete relationship:", error);
      alert("Failed to delete relationship: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      setLoading(true);
      if (query.trim() === "") {
        await loadAllData();
      } else {
        const results = await invoke<Node[]>("search_nodes", { query });
        setNodes(results);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    setNodes([]);
    setRelationships([]);
    setSelectedNode(null);
    setSearchQuery("");
  };

  const handleMarkdownSave = (content: string) => {
    setMarkdownContent(content);
    setShowMarkdownEditor(false);
    // Here you could save the markdown to a specific node or project
    console.log("Saved markdown:", content);
  };

  return (
    <ErrorBoundary>
      <div className="app">
      <header className="app-header">
        <h1>OSINT Studio</h1>
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSearch={handleSearch}
          loading={loading}
        />
      </header>

      <Toolbar
        onRefresh={loadAllData}
        onNewProject={handleNewProject}
        onGenerateReport={() => setShowReportGenerator(true)}
      />
      
      <div className="app-body">
        <ResizablePanel side="left">
          <div className="sidebar">
            <Sidebar onCreateNode={handleCreateNode} />
          </div>
        </ResizablePanel>
        
        <div className="main-content">
          <SimpleGraph
            nodes={nodes}
            relationships={relationships}
            onNodeSelect={setSelectedNode}
            onCreateRelationship={handleCreateRelationship}
            onDeleteRelationship={handleDeleteRelationship}
            loading={loading}
          />
        </div>
        
        {selectedNode && (
          <ResizablePanel side="right">
            <div className="node-panel">
              <NodePanel
                nodeId={selectedNode}
                onClose={() => setSelectedNode(null)}
                onRefresh={loadAllData}
                onOpenMarkdown={() => setShowMarkdownEditor(true)}
              />
            </div>
          </ResizablePanel>
        )}
      </div>

      {showMarkdownEditor && (
        <MarkdownEditor
          initialValue={markdownContent}
          onSave={handleMarkdownSave}
          onCancel={() => setShowMarkdownEditor(false)}
          title="Investigation Notes"
        />
      )}

      {showReportGenerator && (
        <ReportGenerator
          nodes={nodes}
          relationships={relationships}
          onClose={() => setShowReportGenerator(false)}
        />
      )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
