import { useState, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Edit3, Save, X } from "lucide-react";

interface MarkdownEditorProps {
  initialValue?: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  title?: string;
}

const MarkdownEditor = ({ 
  initialValue = "", 
  onSave, 
  onCancel, 
  title = "Edit Notes" 
}: MarkdownEditorProps) => {
  const [content, setContent] = useState(initialValue);
  const [isPreview, setIsPreview] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure editor
    editor.updateOptions({
      wordWrap: "on",
      minimap: { enabled: false },
      lineNumbers: "on",
      fontSize: 14,
      fontFamily: "Fira Code, Monaco, 'Courier New', monospace",
      theme: "vs-dark",
      automaticLayout: true,
    });
  };

  const handleSave = () => {
    onSave(content);
  };

  const insertTemplate = (template: string) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const id = { major: 1, minor: 1 };
      const text = template;
      const op = { identifier: id, range: selection, text: text, forceMoveMarkers: true };
      editorRef.current.executeEdits("my-source", [op]);
      editorRef.current.focus();
    }
  };

  const templates = [
    {
      name: "Investigation Summary",
      content: `# Investigation Summary

## Target Information
- **Name**: 
- **Type**: 
- **Confidence Level**: 

## Key Findings
- [ ] Finding 1
- [ ] Finding 2
- [ ] Finding 3

## Evidence
1. **Source 1**: Description
2. **Source 2**: Description

## Next Steps
- [ ] Action item 1
- [ ] Action item 2

## Notes
Additional observations...
`
    },
    {
      name: "Entity Profile",
      content: `# Entity Profile

## Basic Information
| Field | Value |
|-------|-------|
| Name | |
| Type | |
| Status | |
| Confidence | |

## Attributes
- **Primary Identifier**: 
- **Secondary Identifiers**: 
- **Location**: 
- **Activity Period**: 

## Relationships
- **Connected to**: 
- **Relationship type**: 

## Timeline
- **First observed**: 
- **Last activity**: 

## Notes
`
    },
    {
      name: "Crypto Analysis",
      content: `# Cryptocurrency Analysis

## Wallet Information
- **Address**: \`\`
- **Blockchain**: 
- **Balance**: 
- **First transaction**: 
- **Last transaction**: 

## Transaction Analysis
| Date | Amount | From/To | Purpose |
|------|--------|---------|---------|
| | | | |

## Risk Assessment
- **Risk Level**: 🔴 High / 🟡 Medium / 🟢 Low
- **AML Flags**: 
- **Suspicious Activity**: 

## Connected Addresses
- Address 1: Purpose
- Address 2: Purpose

## Notes
`
    }
  ];

  return (
    <div className="markdown-editor-overlay">
      <div className="markdown-editor">
        <div className="markdown-header">
          <h2>{title}</h2>
          <div className="markdown-controls">
            <button 
              onClick={() => setIsPreview(!isPreview)}
              className={`preview-btn ${isPreview ? 'active' : ''}`}
            >
              {isPreview ? <Edit3 size={16} /> : <Eye size={16} />}
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={handleSave} className="save-btn">
              <Save size={16} />
              Save
            </button>
            <button onClick={onCancel} className="cancel-btn">
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>

        <div className="markdown-toolbar">
          <div className="template-buttons">
            <span>Templates:</span>
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => insertTemplate(template.content)}
                className="template-btn"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <div className="markdown-content">
          {isPreview ? (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="markdown-editor-container">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={content}
                onChange={(value) => setContent(value || "")}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  wordWrap: "on",
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  fontSize: 14,
                  fontFamily: "Fira Code, Monaco, 'Courier New', monospace",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  renderWhitespace: "boundary",
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;