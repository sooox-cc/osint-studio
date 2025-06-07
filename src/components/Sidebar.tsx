import { useState } from "react";
import { 
  User, 
  Building, 
  Wallet, 
  Smartphone, 
  Globe, 
  Monitor, 
  Mail, 
  Phone, 
  FileText, 
  Calendar,
  Plus,
  X
} from "lucide-react";

interface SidebarProps {
  onCreateNode: (nodeData: {
    node_type: string;
    label: string;
    description?: string;
    tags: string[];
  }) => void;
}

const nodeTypes = [
  { type: "Person", icon: User, color: "#3b82f6" },
  { type: "Organization", icon: Building, color: "#ef4444" },
  { type: "CryptoWallet", icon: Wallet, color: "#f59e0b" },
  { type: "SocialAccount", icon: Smartphone, color: "#8b5cf6" },
  { type: "Domain", icon: Globe, color: "#10b981" },
  { type: "IpAddress", icon: Monitor, color: "#6b7280" },
  { type: "Email", icon: Mail, color: "#ec4899" },
  { type: "Phone", icon: Phone, color: "#06b6d4" },
  { type: "Document", icon: FileText, color: "#84cc16" },
  { type: "Event", icon: Calendar, color: "#f97316" },
];

const Sidebar = ({ onCreateNode }: SidebarProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({
    label: "",
    description: "",
    tags: "",
  });

  const handleCreateClick = (type: string) => {
    setSelectedType(type);
    setShowCreateForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) return;

    const nodeData = {
      node_type: selectedType,
      label: formData.label.trim(),
      description: formData.description.trim() || undefined,
      tags: formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean),
    };

    onCreateNode(nodeData);
    setFormData({ label: "", description: "", tags: "" });
    setShowCreateForm(false);
  };

  const handleCancel = () => {
    setFormData({ label: "", description: "", tags: "" });
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    const selectedNodeType = nodeTypes.find(nt => nt.type === selectedType);
    const IconComponent = selectedNodeType?.icon || User;

    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="node-type-header">
            <IconComponent 
              size={24} 
              style={{ color: selectedNodeType?.color }} 
            />
            <h2>Create {selectedType}</h2>
          </div>
          <button className="close-button" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label htmlFor="label">Label *</label>
            <input
              id="label"
              type="text"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="Enter a descriptive label"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add notes or details..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="tag1, tag2, tag3"
            />
            <small>Separate tags with commas</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="create-button">
              <Plus size={16} />
              Create
            </button>
            <button type="button" className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Add Entities</h2>
      </div>
      
      <div className="node-types">
        {nodeTypes.map((nodeType) => {
          const IconComponent = nodeType.icon;
          return (
            <button
              key={nodeType.type}
              className="node-type-button"
              onClick={() => handleCreateClick(nodeType.type)}
              style={{ borderLeft: `4px solid ${nodeType.color}` }}
            >
              <IconComponent size={20} style={{ color: nodeType.color }} />
              <span>{nodeType.type}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;