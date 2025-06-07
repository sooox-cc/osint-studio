use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeType {
    Person,
    Organization,
    CryptoWallet,
    SocialAccount,
    Domain,
    IpAddress,
    Email,
    Phone,
    Document,
    Event,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: Uuid,
    pub node_type: NodeType,
    pub label: String,
    pub description: Option<String>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub confidence: f32,
    pub tags: Vec<String>,
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RelationType {
    Owns,
    Controls,
    TransactsWith,
    MemberOf,
    ConnectedTo,
    SameAs,
    RelatedTo,
    ParentOf,
    ChildOf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relationship {
    pub id: Uuid,
    pub source_id: Uuid,
    pub target_id: Uuid,
    pub relation_type: RelationType,
    pub description: Option<String>,
    pub weight: f32,
    pub confidence: f32, // Confidence score from 0.0 to 1.0
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: serde_json::Value,
    pub source: Option<String>, // Data source for the relationship
}

impl Node {
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

    pub fn with_description(mut self, description: String) -> Self {
        self.description = Some(description);
        self
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = tags;
        self
    }

}

impl Relationship {
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

    pub fn with_confidence(mut self, confidence: f32) -> Self {
        self.confidence = confidence.clamp(0.0, 1.0);
        self
    }

    pub fn with_source(mut self, source: String) -> Self {
        self.source = Some(source);
        self
    }
}