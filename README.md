# OSINT Studio

An open-source desktop application for OSINT investigations with graph visualization, confidence scoring, and automated reporting. Built with Rust and React because good FOSS alternatives were hard to find!

![OSINT Studio](https://img.shields.io/badge/Status-Stable-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Rust](https://img.shields.io/badge/Backend-Rust-orange)
![React](https://img.shields.io/badge/Frontend-React-blue)
![Tauri](https://img.shields.io/badge/Framework-Tauri%202.0-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Features

### Core Functionality
- **Interactive Graph Visualization**: Advanced drag-and-drop interface with multiple layout algorithms
- **Multi-Entity Support**: People, organizations, cryptocurrency wallets, social accounts, domains, and more
- **Confidence-Based Relationships**: Color-coded arrows with percentage scores and source attribution
- **Advanced Search**: Full-text search across all entities and metadata
- **Rich Metadata**: Attach descriptions, tags, confidence scores, and investigative notes
- **Automated Reporting**: Generate investigation reports with multiple templates

### OSINT Capabilities
- **Entity Types**: Person, Organization, CryptoWallet, SocialAccount, Domain, IpAddress, Email, Phone, Document, Event
- **Relationship Types**: Owns, Controls, TransactsWith, MemberOf, ConnectedTo, SameAs, RelatedTo, ParentOf, ChildOf
- **Visual Analysis**: Color-coded nodes, confidence-based arrows, and multiple graph layouts
- **Data Management**: Efficient in-memory storage with comprehensive export/import capabilities

### User Interface
- **Dark Theme**: Clean dark interface optimized for long research sessions
- **Three-Panel Layout**: Sidebar for entity creation, main graph view, detailed node panel
- **Responsive Design**: Optimized for desktop use with keyboard shortcuts
- **Real-time Updates**: Live graph updates as you create entities and relationships
- **Multiple Layout Modes**: Circle, Grid, Force-Directed, Hierarchical, and Organic layouts

### Advanced Features
- **Confidence Scoring**: Visual confidence indicators (0-100%) on all relationships
- **Report Generation**: Investigation reports, executive summaries, and timeline analysis
- **Export Formats**: JSON, CSV, GraphML for integration with other tools
- **File Attachments**: Evidence management with base64 encoding
- **Error Recovery**: Robust error handling with graceful degradation

## 🛠 Technology Stack

### Backend (Rust)
- **Tauri 2.0**: Cross-platform desktop framework
- **Serde**: JSON serialization for data exchange
- **UUID**: Unique entity identification
- **Chrono**: Date and time handling
- **Anyhow**: Error handling

### Frontend (React/TypeScript)
- **React 18**: Modern UI framework with hooks
- **TypeScript**: Type-safe development
- **Cytoscape.js**: Interactive graph visualization
- **Lucide React**: Modern icon library
- **Vite**: Fast build tool and development server

## 📋 Prerequisites

- **Rust** (latest stable version)
- **Node.js** (18+ recommended)
- **npm** or **yarn**

## 🚀 Getting Started

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/sooox-cc/osint-studio.git
cd osint-studio

# Install frontend dependencies
npm install

# Install Tauri CLI (if not already installed)
cargo install tauri-cli
```

### 2. Development

#### Standard Method
```bash
npm run tauri dev
```

#### Linux Users (Wayland/Graphics Compatibility)
If you experience graphics issues or are using Wayland, use the compatibility script:
```bash
# Make script executable (first time only)
chmod +x run-osint.sh

# Run with compatibility settings
./run-osint.sh
```

This will:
- Start the Vite development server for the frontend
- Compile and run the Rust backend with graphics compatibility
- Open the desktop application with proper environment variables

### 3. Building for Production
Create a production build:
```bash
npm run tauri build
```

**Note**: On some Linux distributions, the AppImage bundling may fail with `linuxdeploy` errors. This is a known issue with certain build environments and doesn't affect the core application functionality. The application binary will still be created successfully in `src-tauri/target/release/`.

## 📖 Usage Guide

### Creating Entities
1. **Use the Sidebar**: Click on any entity type (Person, Organization, etc.)
2. **Fill the Form**: Add label, description, and tags
3. **Create**: Entity appears in the graph visualization

### Building Relationships
1. **Multi-select**: Hold Ctrl/Cmd and click two nodes
2. **Create Relationship**: Click "Create Relationship" when prompted
3. **Choose Type**: Select from 9 relationship types
4. **Visualize**: Relationship appears as an edge in the graph

### Searching and Analysis
1. **Search Bar**: Use the top search bar to find entities
2. **Node Panel**: Click any node to view detailed information
3. **Graph Navigation**: Drag to pan, scroll to zoom
4. **Interactive Selection**: Click nodes to select, Ctrl+click to multi-select

### Example Workflow: Cryptocurrency Investigation
1. Create a **Person** entity for the subject
2. Add **CryptoWallet** entities for known addresses
3. Create **TransactsWith** relationships between wallets
4. Add **Organization** entities for exchanges or services
5. Use **Controls** relationships to show wallet ownership
6. Search and filter to identify patterns

## 🔧 Project Structure

```
osint-studio/
├── src-tauri/                 # Rust backend
│   ├── src/
│   │   ├── lib.rs            # Main application logic with Tauri commands
│   │   ├── entities.rs       # Data models (Node, Relationship types)
│   │   ├── database.rs       # In-memory data storage
│   │   └── main.rs           # Application entry point
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── src/                     # React frontend
│   ├── components/
│   │   ├── GraphVisualization.tsx  # Cytoscape.js integration
│   │   ├── Sidebar.tsx            # Entity creation panel
│   │   ├── NodePanel.tsx          # Detailed entity view
│   │   └── SearchBar.tsx          # Search functionality
│   ├── App.tsx              # Main application component
│   └── App.css              # Application styling
├── package.json             # Frontend dependencies
└── README.md               # This file
```

## 🚧 Current Status

### ✅ Current Features
- ✅ Complete project setup with Tauri 2.0 + React 18
- ✅ Entity creation for all 10 types with confidence scoring
- ✅ Interactive graph visualization with 5 layout algorithms
- ✅ Advanced relationship creation with confidence and source tracking
- ✅ Full-text search functionality
- ✅ Comprehensive node editing and management
- ✅ Clean dark theme UI with responsive design
- ✅ Robust in-memory data storage with error recovery
- ✅ Complete TypeScript interfaces and error handling
- ✅ Export functionality (JSON, CSV, GraphML)
- ✅ Automated report generation (Investigation, Summary, Timeline)
- ✅ File attachment management with evidence storage
- ✅ Confidence-based visual indicators and color coding

### 🔄 Future Enhancements
- 🔄 SQLite database integration for enhanced persistence
- 🔄 Advanced analysis algorithms (clustering, path finding, centrality)
- 🔄 OSINT data collection modules and API integrations
- 🔄 Encryption for sensitive investigation data
- 🔄 Multi-workspace support for complex investigations
- 🔄 Timeline visualization component
- 🔄 Advanced filtering and query capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔒 Security Notice

This tool is designed for legitimate OSINT research. Please ensure you:
- Comply with applicable laws and regulations
- Respect privacy and data protection rights
- Use publicly available information only
- Follow ethical guidelines for intelligence gathering

## 🔧 Troubleshooting

### Linux Graphics Issues
If you experience graphics problems, crashes, or blank windows:

1. **Use the compatibility script**: `./run-osint.sh`
2. **Install required dependencies**:
   ```bash
   # Ubuntu/Debian
   sudo apt install libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev

   # Fedora/RHEL
   sudo dnf install webkit2gtk3-devel libappindicator-gtk3-devel librsvg2-devel

   # Arch Linux
   sudo pacman -S webkit2gtk libappindicator-gtk3 librsvg
   ```

### Build Issues
- **AppImage bundling fails**: This is common on some Linux distributions. The main application binary is still created successfully.
- **Missing dependencies**: Ensure all system dependencies are installed per your distribution's package manager.

### Wayland Specific
- The application works best with X11 compatibility mode
- Use `./run-osint.sh` which automatically sets the required environment variables
- Graphics acceleration may be disabled for compatibility

## 📞 Support

For issues, questions, or contributions, please use the GitHub issue tracker.

---

**Built with ❤️ for the OSINT community - because we needed a good FOSS alternative!**