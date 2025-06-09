//! # In-Memory Database
//!
//! This module provides a simple in-memory database for storing and managing
//! investigation nodes and relationships. The database is thread-safe and
//! supports concurrent access through Arc<Mutex<>> wrappers.
//!
//! ## Design
//!
//! The database uses:
//! - `HashMap<Uuid, Node>` for fast node lookups by ID
//! - `Vec<Relationship>` for relationship storage (allows duplicates)
//! - Thread-safe access through Arc<Mutex<>> for multi-threaded operations
//!
//! ## Performance
//!
//! - Node operations: O(1) for create, read, update, delete
//! - Relationship operations: O(n) for searches, O(1) for append
//! - Search operations: O(n) linear scan through collections
//!
//! ## Thread Safety
//!
//! All operations are thread-safe. The database can be shared across
//! multiple threads and accessed concurrently without data races.

use crate::entities::{Node, Relationship};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use anyhow::Result;

/// In-memory database for OSINT investigation data
///
/// Provides thread-safe storage and operations for nodes and relationships.
/// The database is designed for fast access and concurrent usage in the
/// Tauri application environment.
///
/// # Examples
///
/// ```rust
/// use osint_studio::database::Database;
/// use osint_studio::entities::{Node, NodeType};
///
/// let db = Database::new();
/// let node = Node::new(NodeType::Person, "John Doe".to_string());
/// let node_id = db.create_node(node).unwrap();
/// ```
#[derive(Debug, Clone)]
pub struct Database {
    /// Thread-safe storage for nodes, indexed by UUID
    nodes: Arc<Mutex<HashMap<Uuid, Node>>>,
    /// Thread-safe storage for relationships
    relationships: Arc<Mutex<Vec<Relationship>>>,
}

impl Database {
    /// Creates a new empty database instance
    ///
    /// # Returns
    /// A new Database with empty node and relationship collections
    pub fn new() -> Self {
        Self {
            nodes: Arc::new(Mutex::new(HashMap::new())),
            relationships: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Creates a new node in the database
    ///
    /// # Arguments
    /// * `node` - The node to store
    ///
    /// # Returns
    /// * `Ok(Uuid)` - The UUID of the created node
    /// * `Err(anyhow::Error)` - If the operation fails
    pub fn create_node(&self, node: Node) -> Result<Uuid> {
        let node_id = node.id;
        let mut nodes = self.nodes.lock().unwrap();
        nodes.insert(node_id, node);
        Ok(node_id)
    }

    /// Retrieves a node by its UUID
    ///
    /// # Arguments
    /// * `id` - The UUID of the node to retrieve
    ///
    /// # Returns
    /// * `Ok(Some(Node))` - The node if found
    /// * `Ok(None)` - If no node exists with the given ID
    /// * `Err(anyhow::Error)` - If the operation fails
    pub fn get_node(&self, id: Uuid) -> Result<Option<Node>> {
        let nodes = self.nodes.lock().unwrap();
        Ok(nodes.get(&id).cloned())
    }

    /// Retrieves all nodes from the database
    ///
    /// # Returns
    /// * `Ok(Vec<Node>)` - Vector containing all nodes
    /// * `Err(anyhow::Error)` - If the operation fails
    pub fn get_all_nodes(&self) -> Result<Vec<Node>> {
        let nodes = self.nodes.lock().unwrap();
        Ok(nodes.values().cloned().collect())
    }

    /// Searches for nodes matching a query string
    ///
    /// Performs case-insensitive search across node labels, descriptions, and tags
    ///
    /// # Arguments
    /// * `query` - Search query string
    ///
    /// # Returns
    /// * `Ok(Vec<Node>)` - Vector of nodes matching the query
    /// * `Err(anyhow::Error)` - If the operation fails
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

    /// Updates an existing node in the database
    ///
    /// Replaces the existing node with the same UUID
    ///
    /// # Arguments
    /// * `node` - The updated node data
    ///
    /// # Returns
    /// * `Ok(())` - If the update succeeds
    /// * `Err(anyhow::Error)` - If the operation fails
    pub fn update_node(&self, node: Node) -> Result<()> {
        let mut nodes = self.nodes.lock().unwrap();
        nodes.insert(node.id, node);
        Ok(())
    }

    /// Deletes a node and all its relationships
    ///
    /// Removes the node from storage and cleans up any relationships
    /// that reference this node to prevent orphaned references
    ///
    /// # Arguments
    /// * `id` - UUID of the node to delete
    ///
    /// # Returns
    /// * `Ok(true)` - If the node was found and deleted
    /// * `Ok(false)` - If no node existed with the given ID
    /// * `Err(anyhow::Error)` - If the operation fails
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

    /// Creates a new relationship in the database
    ///
    /// # Arguments
    /// * `relationship` - The relationship to store
    ///
    /// # Returns
    /// * `Ok(Uuid)` - The UUID of the created relationship
    /// * `Err(anyhow::Error)` - If the operation fails
    pub fn create_relationship(&self, relationship: Relationship) -> Result<Uuid> {
        let relationship_id = relationship.id;
        let mut relationships = self.relationships.lock().unwrap();
        relationships.push(relationship);
        Ok(relationship_id)
    }

    /// Retrieves all relationships from the database
    ///
    /// # Returns
    /// * `Ok(Vec<Relationship>)` - Vector containing all relationships
    /// * `Err(anyhow::Error)` - If the operation fails
    pub fn get_relationships(&self) -> Result<Vec<Relationship>> {
        let relationships = self.relationships.lock().unwrap();
        Ok(relationships.clone())
    }

    /// Retrieves all relationships involving a specific node
    ///
    /// Returns relationships where the node is either source or target
    ///
    /// # Arguments
    /// * `node_id` - UUID of the node to find relationships for
    ///
    /// # Returns
    /// * `Ok(Vec<Relationship>)` - Vector of relationships involving the node
    /// * `Err(anyhow::Error)` - If the operation fails
    pub fn get_node_relationships(&self, node_id: Uuid) -> Result<Vec<Relationship>> {
        let relationships = self.relationships.lock().unwrap();
        let results: Vec<Relationship> = relationships
            .iter()
            .filter(|rel| rel.source_id == node_id || rel.target_id == node_id)
            .cloned()
            .collect();
        Ok(results)
    }

    /// Updates an existing relationship in the database
    ///
    /// Finds the relationship by UUID and replaces it with new data
    ///
    /// # Arguments
    /// * `relationship` - The updated relationship data
    ///
    /// # Returns
    /// * `Ok(())` - If the update succeeds
    /// * `Err(anyhow::Error)` - If the operation fails
    pub fn update_relationship(&self, relationship: Relationship) -> Result<()> {
        let mut relationships = self.relationships.lock().unwrap();
        if let Some(pos) = relationships.iter().position(|r| r.id == relationship.id) {
            relationships[pos] = relationship;
        }
        Ok(())
    }

    /// Deletes a relationship from the database
    ///
    /// # Arguments
    /// * `id` - UUID of the relationship to delete
    ///
    /// # Returns
    /// * `Ok(true)` - If the relationship was found and deleted
    /// * `Ok(false)` - If no relationship existed with the given ID
    /// * `Err(anyhow::Error)` - If the operation fails
    pub fn delete_relationship(&self, id: Uuid) -> Result<bool> {
        let mut relationships = self.relationships.lock().unwrap();
        if let Some(pos) = relationships.iter().position(|r| r.id == id) {
            relationships.remove(pos);
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Clears all data from the database
    ///
    /// Removes all nodes and relationships, effectively resetting
    /// the database to an empty state
    ///
    /// # Returns
    /// * `Ok(())` - If the clear operation succeeds
    /// * `Err(anyhow::Error)` - If the operation fails
    pub fn clear_all(&self) -> Result<()> {
        let mut nodes = self.nodes.lock().unwrap();
        let mut relationships = self.relationships.lock().unwrap();
        nodes.clear();
        relationships.clear();
        Ok(())
    }
}