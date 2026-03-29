import React, { useState, useEffect, useRef } from 'react';
import api from './Api';
import { Folder, File, UploadCloud, X } from 'lucide-react';

function FileSidebar({ docId, isOpen, onClose }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && docId) fetchFiles();
  }, [isOpen, docId]);

  const fetchFiles = async () => {
    try {
      const res = await api.get(`/documents/${docId}/files`);
      setFiles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    if (!e.target.files.length) return;
    const file = e.target.files[0];
    
    // We can handle folder structures if webkitdirectory is enabled,
    // but here we just upload physical files securely to the backend.
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      await api.post(`/documents/${docId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchFiles(); // reload
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload. Ensure backend is running.");
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  return (
    <div className={`history-panel ${isOpen ? 'open' : ''}`} style={{left: isOpen ? 0 : '-400px', right: 'auto', borderLeft: 'none', borderRight: '1px solid var(--glass-border)'}}>
      <div className="history-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Folder size={20} />
          <h3>Project Assets</h3>
        </div>
        <button className="icon-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <div style={{padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{display: 'none'}} 
          onChange={handleFileChange} 
          // Add webkitdirectory="true" or multiple="true" here to upload directories implicitly
        />
        <button 
          onClick={handleUploadClick}
          disabled={isUploading}
          style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px dashed var(--glass-border)'}}
        >
          <UploadCloud size={20} />
          {isUploading ? 'Uploading...' : 'Upload File / Asset'}
        </button>
      </div>

      <div className="history-content">
        {files.length === 0 ? (
          <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem'}}>No files uploaded yet.</p>
        ) : (
          files.map(f => (
              <div key={f.id} style={{display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '0.5rem'}}>
               <File size={24} color="var(--accent-color)" />
               <div style={{flex: 1, overflow: 'hidden'}}>
                 <p style={{margin: 0, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{f.fileName}</p>
                 <p style={{margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                   {(f.fileSize / 1024).toFixed(1)} KB • {f.uploadedBy?.username}
                 </p>
               </div>
               <button 
                 onClick={() => {
                   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                   window.open(`${API_BASE_URL}/api/documents/${docId}/files/${f.id}/download`);
                 }}
                 style={{background: 'var(--accent-color)', padding: '5px 10px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}
               >
                 Download
               </button>
             </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FileSidebar;
