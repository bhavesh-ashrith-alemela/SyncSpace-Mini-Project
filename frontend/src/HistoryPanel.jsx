import React, { useState, useEffect } from 'react';
import api from './Api';
import { History, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function HistoryPanel({ docId, isOpen, onClose }) {
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/documents/${docId}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen && docId) {
      fetchHistory();
    }
  }, [isOpen, docId]);

  return (
    <div className={`history-panel ${isOpen ? 'open' : ''}`}>
      <div className="history-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <History size={20} />
          <h3>Log</h3>
        </div>
        <button className="icon-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <div className="history-content">
        {history.length === 0 ? (
          <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem'}}>No history recorded yet.</p>
        ) : (
          history.map(rev => (
             <div key={rev.id} className="history-item">
               <div className="history-avatar">
                 {rev.editor?.username?.charAt(0).toUpperCase() || '?'}
               </div>
               <div className="history-info">
                 <p className="history-user">{rev.editor?.username || 'Unknown User'}</p>
                 <p className="history-time">
                   {formatDistanceToNow(new Date(rev.editedAt), { addSuffix: true })}
                 </p>
               </div>
             </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HistoryPanel;
