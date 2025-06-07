import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { 
  Save, 
  FolderOpen, 
  FileText, 
  Database, 
  Trash2,
  Plus,
  FileJson,
  FileBarChart
} from "lucide-react";

interface ToolbarProps {
  onRefresh: () => void;
  onNewProject: () => void;
  onGenerateReport?: () => void;
}

const Toolbar = ({ onRefresh, onNewProject, onGenerateReport }: ToolbarProps) => {
  const [loading, setLoading] = useState(false);

  const handleSaveProject = async () => {
    try {
      setLoading(true);
      console.log("Starting project save...");
      
      const filePath = await save({
        defaultPath: "osint-project.json",
        filters: [
          {
            name: "OSINT Project",
            extensions: ["json"]
          }
        ]
      });

      console.log("Save dialog returned:", filePath, "Type:", typeof filePath);

      if (filePath) {
        const projectName = prompt("Enter project name:") || "Untitled Project";
        const pathString = typeof filePath === 'string' ? filePath : String(filePath);
        
        console.log("Calling save_project with path:", pathString, "name:", projectName);
        
        const result = await invoke("save_project", { 
          filePath: pathString, 
          projectName: projectName 
        });
        
        console.log("Save result:", result);
        alert("Project saved successfully!");
      } else {
        console.log("No file path selected for save");
      }
    } catch (error) {
      console.error("Failed to save project:", error);
      console.error("Save error details:", JSON.stringify(error));
      alert("Failed to save project: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProject = async () => {
    try {
      setLoading(true);
      const filePath = await open({
        multiple: false,
        filters: [
          {
            name: "OSINT Project",
            extensions: ["json"]
          }
        ]
      });

      if (filePath) {
        console.log("Loading project from:", filePath);
        const pathString = typeof filePath === 'string' ? filePath : String(filePath);
        const metadata = await invoke("load_project", { filePath: pathString });
        console.log("Loaded project:", metadata);
        onRefresh();
        alert("Project loaded successfully!");
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      alert("Failed to load project: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      console.log("Starting CSV export...");
      
      const filePath = await save({
        defaultPath: "osint-export.csv",
        filters: [
          {
            name: "CSV File",
            extensions: ["csv"]
          }
        ]
      });

      console.log("File dialog returned:", filePath, "Type:", typeof filePath);

      if (filePath) {
        const pathString = typeof filePath === 'string' ? filePath : String(filePath);
        console.log("Calling export_csv with path:", pathString);
        
        const result = await invoke("export_csv", { filePath: pathString });
        console.log("Export result:", result);
        
        alert("Data exported to CSV successfully!");
      } else {
        console.log("No file path selected");
      }
    } catch (error) {
      console.error("Failed to export CSV:", error);
      console.error("Error details:", JSON.stringify(error));
      alert("Failed to export CSV: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportGraphML = async () => {
    try {
      setLoading(true);
      const filePath = await save({
        defaultPath: "osint-graph.graphml",
        filters: [
          {
            name: "GraphML File",
            extensions: ["graphml"]
          }
        ]
      });

      if (filePath) {
        console.log("Exporting GraphML to:", filePath);
        const pathString = typeof filePath === 'string' ? filePath : String(filePath);
        await invoke("export_graphml", { filePath: pathString });
        alert("Graph exported to GraphML successfully!");
      }
    } catch (error) {
      console.error("Failed to export GraphML:", error);
      alert("Failed to export GraphML: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setLoading(true);
      const filePath = await save({
        defaultPath: "osint-data.json",
        filters: [
          {
            name: "JSON File",
            extensions: ["json"]
          }
        ]
      });

      if (filePath) {
        console.log("Exporting JSON to:", filePath);
        const pathString = typeof filePath === 'string' ? filePath : String(filePath);
        await invoke("export_json", { filePath: pathString });
        alert("Data exported to JSON successfully!");
      }
    } catch (error) {
      console.error("Failed to export JSON:", error);
      alert("Failed to export JSON: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = async () => {
    if (confirm("This will clear all current data. Are you sure?")) {
      try {
        setLoading(true);
        await invoke("clear_all_data");
        onNewProject();
        alert("New project created!");
      } catch (error) {
        console.error("Failed to create new project:", error);
        alert("Failed to create new project: " + error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm("This will permanently delete all entities and relationships. Are you sure?")) {
      try {
        setLoading(true);
        await invoke("clear_all_data");
        onRefresh();
        alert("All data cleared!");
      } catch (error) {
        console.error("Failed to clear data:", error);
        alert("Failed to clear data: " + error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Project</h3>
        <div className="toolbar-buttons">
          <button 
            onClick={handleNewProject}
            disabled={loading}
            className="toolbar-btn"
            title="New Project"
          >
            <Plus size={16} />
            New
          </button>
          <button 
            onClick={handleSaveProject}
            disabled={loading}
            className="toolbar-btn"
            title="Save Project"
          >
            <Save size={16} />
            Save
          </button>
          <button 
            onClick={handleLoadProject}
            disabled={loading}
            className="toolbar-btn"
            title="Load Project"
          >
            <FolderOpen size={16} />
            Load
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Export</h3>
        <div className="toolbar-buttons">
          <button 
            onClick={handleExportJSON}
            disabled={loading}
            className="toolbar-btn"
            title="Export to JSON"
          >
            <FileJson size={16} />
            JSON
          </button>
          <button 
            onClick={handleExportCSV}
            disabled={loading}
            className="toolbar-btn"
            title="Export to CSV"
          >
            <FileText size={16} />
            CSV
          </button>
          <button 
            onClick={handleExportGraphML}
            disabled={loading}
            className="toolbar-btn"
            title="Export to GraphML"
          >
            <Database size={16} />
            GraphML
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Reports</h3>
        <div className="toolbar-buttons">
          <button 
            onClick={onGenerateReport}
            disabled={loading}
            className="toolbar-btn"
            title="Generate Investigation Report"
          >
            <FileBarChart size={16} />
            Report
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Actions</h3>
        <div className="toolbar-buttons">
          <button 
            onClick={handleClearAll}
            disabled={loading}
            className="toolbar-btn danger"
            title="Clear All Data"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>

      {loading && (
        <div className="toolbar-loading">
          <div className="loading-spinner-small" />
          Processing...
        </div>
      )}
    </div>
  );
};

export default Toolbar;