//! # Entity Definitions
//!
//! This module contains the core data structures for OSINT investigations:
//! nodes and relationships that form the graph data model.
//!
//! ## Node Types
//!
//! The system supports various entity types commonly used in OSINT investigations:
//! - **Person**: Individual people
//! - **Organization**: Companies, groups, institutions
//! - **CryptoWallet**: Cryptocurrency wallet addresses
//! - **SocialAccount**: Social media profiles and accounts
//! - **Domain**: Internet domain names
//! - **IpAddress**: IP addresses and network infrastructure
//! - **Email**: Email addresses
//! - **Phone**: Phone numbers
//! - **Document**: Files, reports, evidence
//! - **Event**: Time-based occurrences
//!
//! ## Relationship Types
//!
//! Relationships describe how entities are connected:
//! - **Owns**: Ownership relationships
//! - **Controls**: Control or authority relationships
//! - **TransactsWith**: Financial or transactional relationships
//! - **MemberOf**: Membership relationships
//! - **ConnectedTo**: General connections
//! - **SameAs**: Identity relationships (same entity)
//! - **RelatedTo**: General relationships
//! - **ParentOf/ChildOf**: Hierarchical relationships

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Types of entities that can be investigated
///
/// Each node type represents a different kind of entity commonly found
/// in OSINT investigations. The type determines how the entity should
/// be displayed and what operations are available.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeType {
    /// Individual person
    Person,
    /// Company, group, or institution
    Organization,
    /// Cryptocurrency wallet address
    CryptoWallet,
    /// Social media profile or account
    SocialAccount,
    /// Internet domain name
    Domain,
    /// IP address or network infrastructure
    IpAddress,
    /// Email address
    Email,
    /// Phone number
    Phone,
    /// Document, file, or evidence
    Document,
    /// Time-based event or occurrence
    Event,
}

/// Investigation node representing an entity in the graph
///
/// Nodes are the primary entities in OSINT investigations. Each node
/// represents a person, organization, technical asset, or other entity
/// that investigators want to track and analyze.
///
/// # Examples
///
/// ```rust
/// use osint_studio::entities::{Node, NodeType};
///
/// let node = Node::new(NodeType::Person, "John Doe".to_string())
///     .with_description("Suspected individual".to_string())
///     .with_tags(vec!["suspect".to_string(), "investigation".to_string()]);
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    /// Unique identifier for this node
    pub id: Uuid,
    /// Type of entity this node represents
    pub node_type: NodeType,
    /// Display name/label for the entity
    pub label: String,
    /// Optional detailed description
    pub description: Option<String>,
    /// Additional structured metadata (JSON)
    pub metadata: serde_json::Value,
    /// When this node was created
    pub created_at: DateTime<Utc>,
    /// When this node was last updated
    pub updated_at: DateTime<Utc>,
    /// Confidence score (0.0 to 1.0) for this entity's reliability
    pub confidence: f32,
    /// Tags for categorization and searching
    pub tags: Vec<String>,
    /// Optional source reference for where this information came from
    pub source: Option<String>,
}

/// Types of relationships between entities
///
/// Relationships define how different entities are connected to each other.
/// Each type has specific semantic meaning in the context of investigations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RelationType {
    /// Entity owns another entity (property, account, etc.)
    Owns,
    /// Entity has control or authority over another
    Controls,
    /// Entities have financial or business transactions
    TransactsWith,
    /// Entity is a member of an organization or group
    MemberOf,
    /// General connection between entities
    ConnectedTo,
    /// Entities refer to the same real-world entity
    SameAs,
    /// General relationship between entities
    RelatedTo,
    /// Hierarchical parent relationship
    ParentOf,
    /// Hierarchical child relationship
    ChildOf,
}

/// Relationship between two nodes in the investigation graph
///
/// Relationships represent connections between entities. They can have
/// confidence scores, weights, and metadata to capture the strength
/// and reliability of the connection.
///
/// # Examples
///
/// ```rust
/// use osint_studio::entities::{Relationship, RelationType};
/// use uuid::Uuid;
///
/// let source_id = Uuid::new_v4();
/// let target_id = Uuid::new_v4();
///
/// let relationship = Relationship::new(source_id, target_id, RelationType::Owns)
///     .with_confidence(0.8)
///     .with_source("Bank records".to_string());
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relationship {
    /// Unique identifier for this relationship
    pub id: Uuid,
    /// ID of the source node
    pub source_id: Uuid,
    /// ID of the target node
    pub target_id: Uuid,
    /// Type of relationship
    pub relation_type: RelationType,
    /// Optional description of the relationship
    pub description: Option<String>,
    /// Weight/strength of the relationship (0.0 to 1.0+)
    pub weight: f32,
    /// Confidence score for this relationship (0.0 to 1.0)
    pub confidence: f32,
    /// When this relationship was created
    pub created_at: DateTime<Utc>,
    /// When this relationship was last updated
    pub updated_at: DateTime<Utc>,
    /// Additional structured metadata (JSON)
    pub metadata: serde_json::Value,
    /// Optional source reference for where this information came from
    pub source: Option<String>,
}

impl Node {
    /// Creates a new node with the specified type and label
    ///
    /// # Arguments
    /// * `node_type` - The type of entity this node represents
    /// * `label` - Display name for the entity
    ///
    /// # Returns
    /// A new Node with default values and current timestamp
    pub fn new(node_type: NodeType, label: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            node_type,
            label,
            description: None,
            metadata: serde_json::Value::Object(serde_json::Map::new()),
            created_at: now,
            updated_at: now,
            confidence: 1.0,
            tags: Vec::new(),
            source: None,
        }
    }

    /// Sets the description for this node
    ///
    /// # Arguments
    /// * `description` - Detailed description of the entity
    ///
    /// # Returns
    /// Self for method chaining
    pub fn with_description(mut self, description: String) -> Self {
        self.description = Some(description);
        self
    }

    /// Sets tags for this node
    ///
    /// Tags are used for categorization and searching
    ///
    /// # Arguments
    /// * `tags` - Vector of tag strings
    ///
    /// # Returns
    /// Self for method chaining
    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = tags;
        self
    }

}

impl Relationship {
    /// Creates a new relationship between two nodes
    ///
    /// # Arguments
    /// * `source_id` - UUID of the source node
    /// * `target_id` - UUID of the target node
    /// * `relation_type` - Type of relationship
    ///
    /// # Returns
    /// A new Relationship with default confidence and weight values
    pub fn new(source_id: Uuid, target_id: Uuid, relation_type: RelationType) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            source_id,
            target_id,
            relation_type,
            description: None,
            weight: 1.0,
            confidence: 0.7, // Default confidence score
            created_at: now,
            updated_at: now,
            metadata: serde_json::Value::Object(serde_json::Map::new()),
            source: None,
        }
    }

    /// Sets the confidence score for this relationship
    ///
    /// Confidence is automatically clamped to the range 0.0 to 1.0
    ///
    /// # Arguments
    /// * `confidence` - Confidence score (will be clamped to 0.0-1.0)
    ///
    /// # Returns
    /// Self for method chaining
    pub fn with_confidence(mut self, confidence: f32) -> Self {
        self.confidence = confidence.clamp(0.0, 1.0);
        self
    }

    /// Sets the source reference for this relationship
    ///
    /// # Arguments
    /// * `source` - Source description (e.g., "Bank records", "Social media")
    ///
    /// # Returns
    /// Self for method chaining
    pub fn with_source(mut self, source: String) -> Self {
        self.source = Some(source);
        self
    }
}