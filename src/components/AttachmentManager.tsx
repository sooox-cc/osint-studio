import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { X, Upload, File, Image, Download, Trash2 } from 'lucide-react';

interface AttachmentData {
  id: string;
  node_id: string;
  filename: string;
  file_type: string;
  content_base64: string;
}

interface AttachmentManagerProps {
  nodeId: string;
  onClose: () => void;
  title?: string;
  fileTypes?: 'all' | 'images' | 'files';
}

const AttachmentManager = ({ 
  nodeId, 
  onClose, 
  title = "Manage Attachments",
  fileTypes = 'all'
}: AttachmentManagerProps) => {
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAttachments();
  }, [nodeId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await invoke<AttachmentData[]>('list_attachments', { nodeId: nodeId });
      
      // Filter by file type if specified
      let filteredData = data;
      if (fileTypes === 'images') {
        filteredData = data.filter(att => 
          ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(att.file_type.toLowerCase())
        );
      } else if (fileTypes === 'files') {
        filteredData = data.filter(att => 
          !['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(att.file_type.toLowerCase())
        );
      }
      
      setAttachments(filteredData);
    } catch (error) {
      console.error('Failed to load attachments:', error);
      alert('Failed to load attachments: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    try {
      const filters = fileTypes === 'images' 
        ? [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }]
        : fileTypes === 'files'
        ? [{ name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'csv'] }]
        : [{ name: 'All Files', extensions: ['*'] }];

      const filePath = await open({
        multiple: false,
        filters
      });

      if (!filePath) return;

      // Read file and convert to base64
      const fileContent = await readFile(filePath as string);
      const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileContent)));
      
      // Extract filename from path
      const filename = (filePath as string).split('/').pop() || (filePath as string).split('\\').pop() || 'unknown';

      await invoke('save_attachment', {
        nodeId: nodeId,
        filename: filename,
        contentBase64: base64Content
      });

      await loadAttachments();
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file: ' + error);
    }
  };

  const handleDownload = (attachment: AttachmentData) => {
    try {
      // Decode base64 and create download
      const byteCharacters = atob(attachment.content_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file: ' + error);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await invoke('delete_attachment', { attachmentId: attachmentId, nodeId: nodeId });
      await loadAttachments();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment: ' + error);
    }
  };

  const isImage = (fileType: string) => {
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType.toLowerCase());
  };

  const getFileIcon = (fileType: string) => {
    if (isImage(fileType)) {
      return <Image size={24} className="text-blue-400" />;
    }
    return <File size={24} className="text-gray-400" />;
  };

  return (
    <div className="markdown-editor-overlay">
      <div className="markdown-editor" style={{ width: '70vw', height: '70vh' }}>
        <div className="markdown-header">
          <h2>{title}</h2>
          <div className="markdown-controls">
            <button onClick={handleFileUpload} className="save-btn">
              <Upload size={16} />
              Upload {fileTypes === 'images' ? 'Image' : fileTypes === 'files' ? 'File' : 'File'}
            </button>
            <button onClick={onClose} className="cancel-btn">
              <X size={16} />
              Close
            </button>
          </div>
        </div>

        <div className="markdown-content" style={{ padding: '1rem' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="loading-spinner" />
            </div>
          ) : attachments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
              <p>No attachments found.</p>
              <p>Click "Upload {fileTypes === 'images' ? 'Image' : 'File'}" to add files.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '1rem' 
            }}>
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  style={{
                    border: '1px solid #3a3a3a',
                    borderRadius: '8px',
                    padding: '1rem',
                    backgroundColor: '#2a2a2a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getFileIcon(attachment.file_type)}
                    <span style={{ flex: 1, fontSize: '0.9rem' }}>
                      {attachment.filename}
                    </span>
                  </div>
                  
                  {isImage(attachment.file_type) && (
                    <img
                      src={`data:image/${attachment.file_type};base64,${attachment.content_base64}`}
                      alt={attachment.filename}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid #3a3a3a'
                      }}
                    />
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handleDownload(attachment)}
                      className="button secondary"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      className="button secondary"
                      style={{ 
                        backgroundColor: '#ef4444', 
                        borderColor: '#ef4444',
                        fontSize: '0.8rem', 
                        padding: '0.25rem 0.5rem'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentManager;