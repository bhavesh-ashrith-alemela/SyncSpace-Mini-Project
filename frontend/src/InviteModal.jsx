import React, { useState } from 'react';
import api from './Api';
import { X, UserPlus, Copy } from 'lucide-react';

function InviteModal({ docId, isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const res = await api.post(`/documents/${docId}/invite`, { username });
      setMessage(res.data);
      setUsername('');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to invite user");
    }
  };

  const inviteLink = `${window.location.origin}/document/${docId}`;
  
  const handleCopyLink = () => {
     navigator.clipboard.writeText(inviteLink);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{width: 450, padding: '2rem', position: 'relative', background: 'var(--glass-bg)'}}>
        <button className="icon-btn" onClick={onClose} style={{position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-primary)'}}>
          <X size={20} />
        </button>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem'}}>
          <UserPlus size={24} color="var(--accent-color)" />
          <h2 style={{margin: 0, color: 'var(--text-primary)'}}>Invite Collaborator</h2>
        </div>
        
        <form onSubmit={handleInvite} style={{marginBottom: '2rem'}}>
          <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Invite by Username</label>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <input 
              type="text" 
              placeholder="Exact username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              style={{flex: 1, marginBottom: 0}}
            />
            <button type="submit">Invite</button>
          </div>
          {error && <p style={{color: 'var(--danger-color)', marginTop: '1rem', fontSize: '0.9rem'}}>{error}</p>}
          {message && <p style={{color: '#4ade80', marginTop: '1rem', fontSize: '0.9rem'}}>{message}</p>}
        </form>

        <div style={{borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem'}}>
           <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Or Share Link directly (e.g. via WhatsApp/Email)</label>
           <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
              <input 
                type="text" 
                readOnly 
                value={inviteLink} 
                style={{flex: 1, marginBottom: 0, fontSize: '0.85rem', color: 'var(--text-secondary)'}}
              />
              <button 
                type="button" 
                onClick={handleCopyLink} 
                style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: copied ? '#4ade80' : 'var(--glass-bg)', color: copied ? '#000' : 'var(--text-primary)', border: '1px solid var(--glass-border)'}}
              >
                 <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

export default InviteModal;
