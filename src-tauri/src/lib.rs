mod entities;
mod database;

use database::Database;
use entities::{Node, NodeType, Relationship, RelationType};
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;
use base64::prelude::*;

type AppState = Arc<Database>;

#[derive(serde::Serialize, serde::Deserialize)]
struct ProjectData {
    nodes: Vec<Node>,
    relationships: Vec<Relationship>,
    metadata: ProjectMetadata,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct ProjectMetadata {
    name: String,
    created_at: String,
    updated_at: String,
    version: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct AttachmentData {
    id: String,
    node_id: String,
    filename: String,
    file_type: String,
    content_base64: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct CreateNodeRequest {
    node_type: String,
    label: String,
    description: Option<String>,
    tags: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct UpdateNodeRequest {
    id: String,
    label: String,
    description: Option<String>,
    tags: Vec<String>,
    confidence: f64,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct CreateRelationshipRequest {
    source_id: String,
    target_id: String,
    relation_type: String,
    description: Option<String>,
    confidence: Option<f32>,
    source: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct UpdateRelationshipRequest {
    id: String,
    relation_type: String,
    description: Option<String>,
    weight: f64,
    confidence: Option<f32>,
    source: Option<String>,
}

#[tauri::command]
fn create_node(state: State<AppState>, request: CreateNodeRequest) -> Result<String, String> {
    let node_type = match request.node_type.as_str() {
        "Person" => NodeType::Person,
        "Organization" => NodeType::Organization,
        "CryptoWallet" => NodeType::CryptoWallet,
        "SocialAccount" => NodeType::SocialAccount,
        "Domain" => NodeType::Domain,
        "IpAddress" => NodeType::IpAddress,
        "Email" => NodeType::Email,
        "Phone" => NodeType::Phone,
        "Document" => NodeType::Document,
        "Event" => NodeType::Event,
        _ => return Err("Invalid node type".to_string()),
    };

    let mut node = Node::new(node_type, request.label);
    
    if let Some(desc) = request.description {
        node = node.with_description(desc);
    }
    
    if !request.tags.is_empty() {
        node = node.with_tags(request.tags);
    }

    match state.create_node(node) {
        Ok(id) => Ok(id.to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn get_all_nodes(state: State<AppState>) -> Result<Vec<Node>, String> {
    state.get_all_nodes().map_err(|e| e.to_string())
}

#[tauri::command]
fn search_nodes(state: State<AppState>, query: String) -> Result<Vec<Node>, String> {
    state.search_nodes(&query).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_node(state: State<AppState>, id: String) -> Result<Option<Node>, String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    state.get_node(uuid).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_node(state: State<AppState>, request: UpdateNodeRequest) -> Result<(), String> {
    let uuid = Uuid::parse_str(&request.id).map_err(|e| e.to_string())?;
    
    // Get the existing node
    let mut node = state.get_node(uuid)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Node not found".to_string())?;
    
    // Update fields
    node.label = request.label;
    node.description = request.description;
    node.tags = request.tags;
    node.confidence = request.confidence as f32;
    node.updated_at = chrono::Utc::now();
    
    state.update_node(node).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_node(state: State<AppState>, id: String) -> Result<bool, String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    state.delete_node(uuid).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_relationship(state: State<AppState>, request: CreateRelationshipRequest) -> Result<String, String> {
    let source_id = Uuid::parse_str(&request.source_id).map_err(|e| e.to_string())?;
    let target_id = Uuid::parse_str(&request.target_id).map_err(|e| e.to_string())?;
    
    let relation_type = match request.relation_type.as_str() {
        "Owns" => RelationType::Owns,
        "Controls" => RelationType::Controls,
        "TransactsWith" => RelationType::TransactsWith,
        "MemberOf" => RelationType::MemberOf,
        "ConnectedTo" => RelationType::ConnectedTo,
        "SameAs" => RelationType::SameAs,
        "RelatedTo" => RelationType::RelatedTo,
        "ParentOf" => RelationType::ParentOf,
        "ChildOf" => RelationType::ChildOf,
        _ => return Err("Invalid relationship type".to_string()),
    };

    let mut relationship = Relationship::new(source_id, target_id, relation_type);
    
    // Set confidence if provided
    if let Some(confidence) = request.confidence {
        relationship = relationship.with_confidence(confidence);
    }
    
    // Set source if provided
    if let Some(source) = request.source {
        relationship = relationship.with_source(source);
    }
    
    // Set description if provided
    if let Some(description) = request.description {
        relationship.description = Some(description);
    }
    
    match state.create_relationship(relationship) {
        Ok(id) => Ok(id.to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn get_relationships(state: State<AppState>) -> Result<Vec<Relationship>, String> {
    state.get_relationships().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_node_relationships(state: State<AppState>, node_id: String) -> Result<Vec<Relationship>, String> {
    let uuid = Uuid::parse_str(&node_id).map_err(|e| e.to_string())?;
    state.get_node_relationships(uuid).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_relationship(state: State<AppState>, request: UpdateRelationshipRequest) -> Result<(), String> {
    let uuid = Uuid::parse_str(&request.id).map_err(|e| e.to_string())?;
    
    // Get the existing relationship
    let relationships = state.get_relationships().map_err(|e| e.to_string())?;
    let mut relationship = relationships.into_iter()
        .find(|r| r.id == uuid)
        .ok_or_else(|| "Relationship not found".to_string())?;
    
    // Parse the relation type
    let relation_type = match request.relation_type.as_str() {
        "Owns" => RelationType::Owns,
        "Controls" => RelationType::Controls,
        "TransactsWith" => RelationType::TransactsWith,
        "MemberOf" => RelationType::MemberOf,
        "ConnectedTo" => RelationType::ConnectedTo,
        "SameAs" => RelationType::SameAs,
        "RelatedTo" => RelationType::RelatedTo,
        "ParentOf" => RelationType::ParentOf,
        "ChildOf" => RelationType::ChildOf,
        _ => return Err("Invalid relationship type".to_string()),
    };
    
    // Update fields
    relationship.relation_type = relation_type;
    relationship.description = request.description;
    relationship.weight = request.weight as f32;
    relationship.updated_at = chrono::Utc::now();
    
    state.update_relationship(relationship).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_relationship(state: State<AppState>, id: String) -> Result<bool, String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    state.delete_relationship(uuid).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_project(state: State<AppState>, file_path: String, project_name: String) -> Result<(), String> {
    let nodes = state.get_all_nodes().map_err(|e| e.to_string())?;
    let relationships = state.get_relationships().map_err(|e| e.to_string())?;
    
    let project_data = ProjectData {
        nodes,
        relationships,
        metadata: ProjectMetadata {
            name: project_name,
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
            version: "1.0.0".to_string(),
        },
    };
    
    let json_data = serde_json::to_string_pretty(&project_data).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, json_data).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn load_project(state: State<AppState>, file_path: String) -> Result<ProjectMetadata, String> {
    let json_data = std::fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let project_data: ProjectData = serde_json::from_str(&json_data).map_err(|e| e.to_string())?;
    
    // Clear existing data first
    state.clear_all().map_err(|e| e.to_string())?;
    
    // Load nodes
    for node in project_data.nodes {
        state.create_node(node).map_err(|e| e.to_string())?;
    }
    
    // Load relationships
    for relationship in project_data.relationships {
        state.create_relationship(relationship).map_err(|e| e.to_string())?;
    }
    
    Ok(project_data.metadata)
}

#[tauri::command]
fn export_csv(state: State<AppState>, file_path: String) -> Result<(), String> {
    let nodes = state.get_all_nodes().map_err(|e| e.to_string())?;
    let relationships = state.get_relationships().map_err(|e| e.to_string())?;
    
    let mut csv_content = String::new();
    
    // Nodes CSV
    csv_content.push_str("Type,ID,Label,NodeType,Description,Tags,Confidence,CreatedAt\n");
    for node in &nodes {
        csv_content.push_str(&format!(
            "Node,{},{},{},{},{},{},{}\n",
            node.id,
            node.label.replace(',', ";"),
            format!("{:?}", node.node_type),
            node.description.as_ref().unwrap_or(&String::new()).replace(',', ";"),
            node.tags.join(";"),
            node.confidence,
            node.created_at.to_rfc3339()
        ));
    }
    
    csv_content.push_str("\n");
    
    // Relationships CSV
    csv_content.push_str("Type,ID,SourceID,TargetID,RelationType,Description,Weight,Confidence,Source,CreatedAt\n");
    for rel in &relationships {
        csv_content.push_str(&format!(
            "Relationship,{},{},{},{},{},{},{},{},{}\n",
            rel.id,
            rel.source_id,
            rel.target_id,
            format!("{:?}", rel.relation_type),
            rel.description.as_ref().unwrap_or(&String::new()).replace(',', ";"),
            rel.weight,
            rel.confidence,
            rel.source.as_ref().unwrap_or(&String::new()).replace(',', ";"),
            rel.created_at.to_rfc3339()
        ));
    }
    
    std::fs::write(&file_path, csv_content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn export_graphml(state: State<AppState>, file_path: String) -> Result<(), String> {
    let nodes = state.get_all_nodes().map_err(|e| e.to_string())?;
    let relationships = state.get_relationships().map_err(|e| e.to_string())?;
    
    let mut graphml = String::new();
    graphml.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    graphml.push_str("<graphml xmlns=\"http://graphml.graphdrawing.org/xmlns\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd\">\n");
    
    // Define keys for attributes
    graphml.push_str("  <key id=\"label\" for=\"node\" attr.name=\"label\" attr.type=\"string\"/>\n");
    graphml.push_str("  <key id=\"nodeType\" for=\"node\" attr.name=\"nodeType\" attr.type=\"string\"/>\n");
    graphml.push_str("  <key id=\"confidence\" for=\"node\" attr.name=\"confidence\" attr.type=\"double\"/>\n");
    graphml.push_str("  <key id=\"relationType\" for=\"edge\" attr.name=\"relationType\" attr.type=\"string\"/>\n");
    graphml.push_str("  <key id=\"weight\" for=\"edge\" attr.name=\"weight\" attr.type=\"double\"/>\n");
    graphml.push_str("  <key id=\"edgeConfidence\" for=\"edge\" attr.name=\"edgeConfidence\" attr.type=\"double\"/>\n");
    graphml.push_str("  <key id=\"source\" for=\"edge\" attr.name=\"source\" attr.type=\"string\"/>\n");
    
    graphml.push_str("  <graph id=\"G\" edgedefault=\"directed\">\n");
    
    // Add nodes
    for node in &nodes {
        graphml.push_str(&format!("    <node id=\"{}\">\n", node.id));
        graphml.push_str(&format!("      <data key=\"label\">{}</data>\n", node.label));
        graphml.push_str(&format!("      <data key=\"nodeType\">{:?}</data>\n", node.node_type));
        graphml.push_str(&format!("      <data key=\"confidence\">{}</data>\n", node.confidence));
        graphml.push_str("    </node>\n");
    }
    
    // Add edges
    for rel in &relationships {
        graphml.push_str(&format!("    <edge id=\"{}\" source=\"{}\" target=\"{}\">\n", rel.id, rel.source_id, rel.target_id));
        graphml.push_str(&format!("      <data key=\"relationType\">{:?}</data>\n", rel.relation_type));
        graphml.push_str(&format!("      <data key=\"weight\">{}</data>\n", rel.weight));
        graphml.push_str(&format!("      <data key=\"edgeConfidence\">{}</data>\n", rel.confidence));
        if let Some(source) = &rel.source {
            graphml.push_str(&format!("      <data key=\"source\">{}</data>\n", source));
        }
        graphml.push_str("    </edge>\n");
    }
    
    graphml.push_str("  </graph>\n");
    graphml.push_str("</graphml>\n");
    
    std::fs::write(&file_path, graphml).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn export_json(state: State<AppState>, file_path: String) -> Result<(), String> {
    let nodes = state.get_all_nodes().map_err(|e| e.to_string())?;
    let relationships = state.get_relationships().map_err(|e| e.to_string())?;
    
    let project_data = ProjectData {
        nodes,
        relationships,
        metadata: ProjectMetadata {
            name: "Exported Data".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
            version: "1.0.0".to_string(),
        },
    };
    
    let json_data = serde_json::to_string_pretty(&project_data).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, json_data).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn write_report(file_path: String, content: String) -> Result<(), String> {
    std::fs::write(&file_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn save_attachment(node_id: String, filename: String, content_base64: String) -> Result<String, String> {
    // Create attachments directory if it doesn't exist
    let attachments_dir = "./attachments";
    std::fs::create_dir_all(attachments_dir).map_err(|e| e.to_string())?;
    
    // Decode base64 content
    let content = base64::prelude::BASE64_STANDARD.decode(&content_base64).map_err(|e| e.to_string())?;
    
    // Generate unique filename
    let attachment_id = Uuid::new_v4().to_string();
    let file_extension = std::path::Path::new(&filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("bin");
    let stored_filename = format!("{}_{}.{}", attachment_id, node_id, file_extension);
    let file_path = format!("{}/{}", attachments_dir, stored_filename);
    
    // Save file
    std::fs::write(&file_path, content).map_err(|e| e.to_string())?;
    
    Ok(attachment_id)
}

#[tauri::command]
fn list_attachments(node_id: String) -> Result<Vec<AttachmentData>, String> {
    let attachments_dir = "./attachments";
    let mut attachments = Vec::new();
    
    if let Ok(entries) = std::fs::read_dir(attachments_dir) {
        for entry in entries.flatten() {
            if let Some(filename) = entry.file_name().to_str() {
                if filename.contains(&format!("_{}", node_id)) {
                    // Parse filename to extract attachment ID and original name
                    let parts: Vec<&str> = filename.split('_').collect();
                    if parts.len() >= 2 {
                        let attachment_id = parts[0].to_string();
                        let file_extension = std::path::Path::new(filename)
                            .extension()
                            .and_then(|ext| ext.to_str())
                            .unwrap_or("bin");
                        
                        // Read file content and encode as base64
                        if let Ok(content) = std::fs::read(entry.path()) {
                            let content_base64 = base64::prelude::BASE64_STANDARD.encode(&content);
                            
                            attachments.push(AttachmentData {
                                id: attachment_id,
                                node_id: node_id.clone(),
                                filename: format!("attachment.{}", file_extension),
                                file_type: file_extension.to_string(),
                                content_base64,
                            });
                        }
                    }
                }
            }
        }
    }
    
    Ok(attachments)
}

#[tauri::command]
fn delete_attachment(attachment_id: String, node_id: String) -> Result<(), String> {
    let attachments_dir = "./attachments";
    
    if let Ok(entries) = std::fs::read_dir(attachments_dir) {
        for entry in entries.flatten() {
            if let Some(filename) = entry.file_name().to_str() {
                if filename.starts_with(&attachment_id) && filename.contains(&format!("_{}", node_id)) {
                    std::fs::remove_file(entry.path()).map_err(|e| e.to_string())?;
                    return Ok(());
                }
            }
        }
    }
    
    Err("Attachment not found".to_string())
}

#[tauri::command]
fn clear_all_data(state: State<AppState>) -> Result<(), String> {
    state.clear_all().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let database = Arc::new(Database::new());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(database)
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            create_node,
            get_all_nodes,
            search_nodes,
            get_node,
            update_node,
            delete_node,
            create_relationship,
            update_relationship,
            delete_relationship,
            get_relationships,
            get_node_relationships,
            save_project,
            load_project,
            export_csv,
            export_graphml,
            export_json,
            write_report,
            save_attachment,
            list_attachments,
            delete_attachment,
            clear_all_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
