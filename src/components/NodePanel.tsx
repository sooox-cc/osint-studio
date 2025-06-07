import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, Edit, Save, Tag, Calendar, Target, FileText, Image, Paperclip, Trash2, Edit3 } from "lucide-react";
import AttachmentManager from "./AttachmentManager";

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
  created_at: string;
}

interface NodePanelProps {
  nodeId: string;
  onClose: () => void;
  onRefresh: () => void;
  onOpenMarkdown?: () => void;
}

const NodePanel = ({ nodeId, onClose, onRefresh, onOpenMarkdown }: NodePanelProps) => {
  const [node, setNode] = useState<Node | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    label: "",
    description: "",
    tags: "",
    confidence: 1.0,
  });
  const [relationshipEditForm, setRelationshipEditForm] = useState({
    relation_type: "",
    description: "",
    weight: 1.0,
  });

  useEffect(() => {
    loadNodeData();
  }, [nodeId]);

  const loadNodeData = async () => {
    try {
      setLoading(true);
      const [nodeData, relationshipsData] = await Promise.all([
        invoke<Node | null>("get_node", { id: nodeId }),
        invoke<Relationship[]>("get_node_relationships", { nodeId })
      ]);
      
      if (nodeData) {
        setNode(nodeData);
        setEditForm({
          label: nodeData.label,
          description: nodeData.description || "",
          tags: nodeData.tags.join(", "),
          confidence: nodeData.confidence,
        });
      }
      setRelationships(relationshipsData);
    } catch (error) {
      console.error("Failed to load node data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!node) return;
    
    try {
      await invoke("update_node", {
        request: {
          id: node.id,
          label: editForm.label,
          description: editForm.description || null,
          tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
          confidence: editForm.confidence,
        }
      });
      setIsEditing(false);
      // Reload the node data immediately to update the view
      await loadNodeData();
      onRefresh();
    } catch (error) {
      console.error("Failed to update node:", error);
      alert("Failed to update node: " + error);
    }
  };

  const handleDelete = async () => {
    if (!node) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete "${node.label}"? This will also remove all relationships connected to this entity. This action cannot be undone.`);
    if (!confirmDelete) return;
    
    try {
      console.log(`Deleting node: ${node.label} (${node.id})`);
      await invoke("delete_node", { id: node.id });
      console.log("Node deleted successfully");
      onClose(); // Close the panel
      onRefresh(); // Refresh the graph
    } catch (error) {
      console.error("Failed to delete node:", error);
      alert("Failed to delete node: " + error);
    }
  };

  const handleEditRelationship = (relationship: Relationship) => {
    setEditingRelationship(relationship.id);
    setRelationshipEditForm({
      relation_type: relationship.relation_type,
      description: relationship.description || "",
      weight: relationship.weight,
    });
  };

  const handleSaveRelationship = async (relationshipId: string) => {
    try {
      await invoke("update_relationship", {
        request: {
          id: relationshipId,
          relation_type: relationshipEditForm.relation_type,
          description: relationshipEditForm.description || null,
          weight: relationshipEditForm.weight,
        }
      });
      setEditingRelationship(null);
      await loadNodeData();
      onRefresh();
    } catch (error) {
      console.error("Failed to update relationship:", error);
      alert("Failed to update relationship: " + error);
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this relationship?");
    if (!confirmDelete) return;

    try {
      await invoke("delete_relationship", { id: relationshipId });
      await loadNodeData();
      onRefresh();
    } catch (error) {
      console.error("Failed to delete relationship:", error);
      alert("Failed to delete relationship: " + error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "#10b981";
    if (confidence >= 0.6) return "#f59e0b";
    return "#ef4444";
  };

  if (loading) {
    return (
      <div className="node-panel">
        <div className="node-panel-header">
          <h2>Loading...</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="loading-content">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="node-panel">
        <div className="node-panel-header">
          <h2>Node not found</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="node-panel">
      <div className="node-panel-header">
        <div className="node-title">
          <h2>{node.label}</h2>
          <span className="node-type">{node.node_type}</span>
        </div>
        <div className="panel-actions">
          {isEditing ? (
            <button className="save-button" onClick={handleSave}>
              <Save size={16} />
            </button>
          ) : (
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              <Edit size={16} />
            </button>
          )}
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="node-panel-content">
        <div className="node-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label>Label</label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.label}
                onChange={(e) => 
                  setEditForm({ ...editForm, label: e.target.value })
                }
              />
            ) : (
              <p>{node.label}</p>
            )}
          </div>

          <div className="form-group">
            <label>Description</label>
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
              />
            ) : (
              <p>{node.description || "No description"}</p>
            )}
          </div>

          <div className="form-group">
            <label>
              <Tag size={16} />
              Tags
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) =>
                  setEditForm({ ...editForm, tags: e.target.value })
                }
                placeholder="tag1, tag2, tag3"
              />
            ) : (
              <div className="tags-container">
                {node.tags.length > 0 ? (
                  node.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="no-tags">No tags</span>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              <Target size={16} />
              Confidence
            </label>
            {isEditing ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={editForm.confidence}
                  onChange={(e) =>
                    setEditForm({ ...editForm, confidence: parseFloat(e.target.value) })
                  }
                  style={{ flex: 1 }}
                />
                <span className="confidence-text">
                  {(editForm.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ) : (
              <div className="confidence-container">
                <div 
                  className="confidence-bar"
                  style={{ 
                    width: `${node.confidence * 100}%`,
                    backgroundColor: getConfidenceColor(node.confidence)
                  }}
                />
                <span className="confidence-text">
                  {(node.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="node-section">
          <h3>
            <Calendar size={16} />
            Timeline
          </h3>
          <div className="timeline-item">
            <label>Created</label>
            <p>{formatDate(node.created_at)}</p>
          </div>
          <div className="timeline-item">
            <label>Last Updated</label>
            <p>{formatDate(node.updated_at)}</p>
          </div>
        </div>

        <div className="node-section">
          <h3>Actions</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {isEditing ? (
              <>
                <button
                  className="button"
                  onClick={handleSave}
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  className="button secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button className="button" onClick={() => setIsEditing(true)}>
                <Edit size={16} />
                Edit
              </button>
            )}
            
            {onOpenMarkdown && (
              <button className="button secondary" onClick={onOpenMarkdown}>
                <FileText size={16} />
                Notes
              </button>
            )}
            
            <button 
              className="button secondary"
              onClick={() => setShowFileManager(true)}
            >
              <Paperclip size={16} />
              Files
            </button>
            
            <button 
              className="button secondary"
              onClick={() => setShowImageManager(true)}
            >
              <Image size={16} />
              Images
            </button>
            
            <button 
              className="button secondary" 
              onClick={handleDelete}
              style={{ 
                backgroundColor: "#ef4444", 
                borderColor: "#ef4444" 
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        <div className="node-section">
          <h3>Relationships ({relationships.length})</h3>
          {relationships.length > 0 ? (
            <div className="relationships-list">
              {relationships.map((rel) => (
                <div key={rel.id} className="relationship-item">
                  {editingRelationship === rel.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <select
                        value={relationshipEditForm.relation_type}
                        onChange={(e) => setRelationshipEditForm({
                          ...relationshipEditForm,
                          relation_type: e.target.value
                        })}
                        style={{ backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "4px", padding: "0.25rem", color: "#fff" }}
                      >
                        <option value="Owns">Owns</option>
                        <option value="Controls">Controls</option>
                        <option value="TransactsWith">TransactsWith</option>
                        <option value="MemberOf">MemberOf</option>
                        <option value="ConnectedTo">ConnectedTo</option>
                        <option value="SameAs">SameAs</option>
                        <option value="RelatedTo">RelatedTo</option>
                        <option value="ParentOf">ParentOf</option>
                        <option value="ChildOf">ChildOf</option>
                      </select>
                      <input
                        type="text"
                        value={relationshipEditForm.description}
                        onChange={(e) => setRelationshipEditForm({
                          ...relationshipEditForm,
                          description: e.target.value
                        })}
                        placeholder="Description"
                        style={{ backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "4px", padding: "0.25rem", color: "#fff" }}
                      />
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="button"
                          onClick={() => handleSaveRelationship(rel.id)}
                          style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                        >
                          <Save size={14} />
                        </button>
                        <button
                          className="button secondary"
                          onClick={() => setEditingRelationship(null)}
                          style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div className="relationship-type">{rel.relation_type}</div>
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          <button
                            className="button secondary"
                            onClick={() => handleEditRelationship(rel)}
                            style={{ fontSize: "0.7rem", padding: "0.2rem 0.4rem" }}
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            className="button secondary"
                            onClick={() => handleDeleteRelationship(rel.id)}
                            style={{ 
                              fontSize: "0.7rem", 
                              padding: "0.2rem 0.4rem",
                              backgroundColor: "#ef4444",
                              borderColor: "#ef4444"
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="relationship-target">
                        {rel.source_id === nodeId ? 
                          `→ ${rel.target_id}` : 
                          `← ${rel.source_id}`
                        }
                      </div>
                      {rel.description && (
                        <div className="relationship-description">
                          {rel.description}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-relationships">
              No relationships found. Connect this entity to others in the graph.
            </p>
          )}
        </div>
      </div>

      {showFileManager && (
        <AttachmentManager
          nodeId={nodeId}
          onClose={() => setShowFileManager(false)}
          title="File Attachments"
          fileTypes="files"
        />
      )}

      {showImageManager && (
        <AttachmentManager
          nodeId={nodeId}
          onClose={() => setShowImageManager(false)}
          title="Image Attachments"
          fileTypes="images"
        />
      )}
    </div>
  );
};

export default NodePanel;