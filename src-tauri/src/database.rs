use crate::entities::{Node, Relationship};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use anyhow::Result;

#[derive(Debug, Clone)]
pub struct Database {
    nodes: Arc<Mutex<HashMap<Uuid, Node>>>,
    relationships: Arc<Mutex<Vec<Relationship>>>,
}

impl Database {
    pub fn new() -> Self {
        Self {
            nodes: Arc::new(Mutex::new(HashMap::new())),
            relationships: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn create_node(&self, node: Node) -> Result<Uuid> {
        let node_id = node.id;
        let mut nodes = self.nodes.lock().unwrap();
        nodes.insert(node_id, node);
        Ok(node_id)
    }

    pub fn get_node(&self, id: Uuid) -> Result<Option<Node>> {
        let nodes = self.nodes.lock().unwrap();
        Ok(nodes.get(&id).cloned())
    }

    pub fn get_all_nodes(&self) -> Result<Vec<Node>> {
        let nodes = self.nodes.lock().unwrap();
        Ok(nodes.values().cloned().collect())
    }

    pub fn search_nodes(&self, query: &str) -> Result<Vec<Node>> {
        let nodes = self.nodes.lock().unwrap();
        let query_lower = query.to_lowercase();
        
        let results: Vec<Node> = nodes
            .values()
            .filter(|node| {
                node.label.to_lowercase().contains(&query_lower) ||
                node.description.as_ref().map_or(false, |desc| desc.to_lowercase().contains(&query_lower)) ||
                node.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect();
            
        Ok(results)
    }

    pub fn update_node(&self, node: Node) -> Result<()> {
        let mut nodes = self.nodes.lock().unwrap();
        nodes.insert(node.id, node);
        Ok(())
    }

    pub fn delete_node(&self, id: Uuid) -> Result<bool> {
        let mut nodes = self.nodes.lock().unwrap();
        let node_existed = nodes.remove(&id).is_some();
        
        if node_existed {
            // Also remove all relationships involving this node to prevent orphaned references
            let mut relationships = self.relationships.lock().unwrap();
            relationships.retain(|rel| rel.source_id != id && rel.target_id != id);
        }
        
        Ok(node_existed)
    }

    pub fn create_relationship(&self, relationship: Relationship) -> Result<Uuid> {
        let relationship_id = relationship.id;
        let mut relationships = self.relationships.lock().unwrap();
        relationships.push(relationship);
        Ok(relationship_id)
    }

    pub fn get_relationships(&self) -> Result<Vec<Relationship>> {
        let relationships = self.relationships.lock().unwrap();
        Ok(relationships.clone())
    }

    pub fn get_node_relationships(&self, node_id: Uuid) -> Result<Vec<Relationship>> {
        let relationships = self.relationships.lock().unwrap();
        let results: Vec<Relationship> = relationships
            .iter()
            .filter(|rel| rel.source_id == node_id || rel.target_id == node_id)
            .cloned()
            .collect();
        Ok(results)
    }

    pub fn update_relationship(&self, relationship: Relationship) -> Result<()> {
        let mut relationships = self.relationships.lock().unwrap();
        if let Some(pos) = relationships.iter().position(|r| r.id == relationship.id) {
            relationships[pos] = relationship;
        }
        Ok(())
    }

    pub fn delete_relationship(&self, id: Uuid) -> Result<bool> {
        let mut relationships = self.relationships.lock().unwrap();
        if let Some(pos) = relationships.iter().position(|r| r.id == id) {
            relationships.remove(pos);
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub fn clear_all(&self) -> Result<()> {
        let mut nodes = self.nodes.lock().unwrap();
        let mut relationships = self.relationships.lock().unwrap();
        nodes.clear();
        relationships.clear();
        Ok(())
    }
}