import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './Api';

function Dashboard({ user, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateDocument = async (type) => {
    const title = prompt(`Enter ${type} Workspace Title:`);
    if (!title) return;

    try {
      const res = await api.post('/documents', { title, type });
      setDocuments([...documents, res.data]);
    } catch (err) {
      console.error("Failed to create doc", err);
      alert("Failed to create document: " + (err.response?.data?.message || err.message));
    }
  };

  const openDocument = (id) => {
    navigate(`/document/${id}`);
  };

  return (
    <div className="dashboard">
      <div className="top-bar">
        <div>
          <h1 style={{margin:0}}>SyncSpace</h1>
          <p style={{color: 'var(--text-secondary)'}}>Welcome back, {user}</p>
        </div>
        <button onClick={onLogout} style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)'}}>Logout</button>
      </div>

      <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
        <button onClick={() => handleCreateDocument('DOC')}>+ New Document</button>
        <button onClick={() => handleCreateDocument('CODE')} style={{background: '#2563eb'}}>+ New Code Environment</button>
        <button onClick={() => handleCreateDocument('PPT')} style={{background: '#d97706'}}>+ New Presentation</button>
      </div>

      <div className="doc-grid">

        {documents.map(doc => {
          let typeColor = 'var(--accent-color)';
          if (doc.type === 'CODE') typeColor = '#3b82f6';
          if (doc.type === 'PPT') typeColor = '#f59e0b';
          
          return (
            <div key={doc.id} className="glass-panel doc-card" onClick={() => openDocument(doc.id)}>
              <div className="type" style={{color: typeColor}}>{doc.type}</div>
              <h3 style={{margin: '0.5rem 0'}}>{doc.title}</h3>
              <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                Created: {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
