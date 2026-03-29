import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import api from './Api';
import HistoryPanel from './HistoryPanel';
import InviteModal from './InviteModal';
import FileSidebar from './FileSidebar';
import { History, UserPlus, FolderOpen } from 'lucide-react';

// CodeMirror
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

// ReactQuill
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function Editor({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [docTitle, setDocTitle] = useState('Loading...');
  const [docType, setDocType] = useState('DOC');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFileSidebarOpen, setIsFileSidebarOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const stompClient = useRef(null);

  // Debouncing for the HTTP Auto-save
  const debounceTimer = useRef(null);

  useEffect(() => {
    // 1. Fetch initial document data
    api.get(`/documents/${id}`)
      .then(res => {
        setDocTitle(res.data.title);
        setDocType(res.data.type || 'DOC');
        setContent(res.data.content || '');
      })
      .catch(err => {
        console.error(err);
        if(err.response?.status === 404) navigate('/');
      });

    // 2. Setup WebSocket connection
    const token = localStorage.getItem('token');
    if (!token) {
        navigate('/login');
        return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = Stomp.over(socket);

    client.connect({ Authorization: `Bearer ${token}` }, (frame) => {
      console.log('Connected: ' + frame);
      
      client.subscribe(`/topic/doc/${id}`, (message) => {
        const payload = JSON.parse(message.body);
        if (payload.sender !== user) {
           setContent(payload.content);
        }
      });
    }, (error) => {
       console.error("STOMP error:", error);
    });

    stompClient.current = client;

    return () => {
      if (stompClient.current) stompClient.current.disconnect();
    };
  }, [id, navigate, user]);

  // Synchronize edits over WebSockets
  const handleRemoteEdit = useCallback((newContent) => {
    setContent(newContent);
    
    // 1. Broadcast over websockets for instant visual sync
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.send(`/app/doc/${id}/edit`, {}, JSON.stringify({
        sender: user,
        content: newContent
      }));
    }

    // 2. Debounce trigger `PUT /api/documents/{id}/save` to store in DB
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
       api.put(`/documents/${id}/save`, { content: newContent }).catch(e => console.error("AutoSave Fail:", e));
    }, 2000); // Wait 2s of inactivity before hitting the JPA save
  }, [id, user]);

  // Specific Type renderers
  const renderEditor = () => {
    if (docType === 'CODE') {
      return (
        <div style={{flex: 1, overflow: 'auto', fontSize: '1.2rem', padding: '1rem'}}>
          <CodeMirror
             value={content}
             height="100%"
             theme="dark"
             extensions={[javascript({ jsx: true })]}
             onChange={(val) => handleRemoteEdit(val)}
             style={{height: '100%', outline: 'none'}}
          />
        </div>
      );
    }
    
    if (docType === 'PPT') {
      let slides = [""];
      try {
         slides = JSON.parse(content || '[""]');
         if (!Array.isArray(slides)) slides = [""];
      } catch (e) {
         slides = [content || ""];
      }

      const activeContent = slides[activeSlideIndex] || "";

      const handleSlideEdit = (val) => {
         const newSlides = [...slides];
         newSlides[activeSlideIndex] = val;
         handleRemoteEdit(JSON.stringify(newSlides));
      };

      const addSlide = () => {
         const newSlides = [...slides, ""];
         handleRemoteEdit(JSON.stringify(newSlides));
         setActiveSlideIndex(newSlides.length - 1);
      };

      const removeSlide = (idx) => {
         if (slides.length <= 1) return;
         const newSlides = slides.filter((_, i) => i !== idx);
         handleRemoteEdit(JSON.stringify(newSlides));
         if (activeSlideIndex >= newSlides.length - 1) setActiveSlideIndex(Math.max(0, newSlides.length - 1));
      };

      return (
        <div className="ppt-container" style={{display: 'flex', height: '100%', padding: '1rem', gap: '1rem', width: '100%', boxSizing: 'border-box'}}>
           <div className="slides-sidebar" style={{width: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto'}}>
              <button onClick={addSlide} style={{background: 'var(--accent-color)', marginBottom: '1rem'}}>+ Add Slide</button>
              {slides.map((s, i) => (
                 <div key={i} style={{position: 'relative'}}>
                     <div 
                        onClick={() => setActiveSlideIndex(i)}
                        style={{
                           padding: '1rem', 
                           background: i === activeSlideIndex ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                           border: i === activeSlideIndex ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)',
                           borderRadius: '8px', cursor: 'pointer', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                           overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}
                     >
                        Slide {i + 1}
                     </div>
                     {slides.length > 1 && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); removeSlide(i); }} 
                            style={{position: 'absolute', top: 5, right: 5, background: 'var(--danger-color)', padding: '2px 6px', fontSize: '0.7rem', border: 'none', borderRadius: '4px'}}
                         >
                            X
                         </button>
                     )}
                 </div>
              ))}
           </div>
           
           <div className="slide-box" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
             <h3 style={{color: 'var(--text-secondary)', marginBottom: '1rem'}}>Slide {activeSlideIndex + 1}</h3>
             <textarea 
                className="slide-textarea"
                style={{flex: 1, width: '100%', resize: 'none', padding: '2rem', fontSize: '1.5rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '12px', boxSizing: 'border-box'}}
                value={activeContent}
                onChange={(e) => handleSlideEdit(e.target.value)}
                placeholder="Enter slide content here..."
             />
           </div>
        </div>
      );
    }

    // Default 'DOC' Rich Text
    return (
       <ReactQuill 
         theme="snow" 
         value={content} 
         onChange={handleRemoteEdit} 
         style={{height: 'calc(100% - 42px)', border: 'none'}}
       />
    );
  };

  return (
    <div className="editor-layout" style={{position: 'relative', overflow: 'hidden'}}>
      <div className="editor-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <button style={{background: 'transparent', color: 'var(--text-secondary)', padding: 0}} onClick={() => navigate('/')}>
             ← Back
          </button>
          <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{docTitle} <span style={{fontSize: '0.8rem', opacity: 0.6, background: '#333', padding: '2px 6px', borderRadius: 4}}>{docType}</span></span>
        </div>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <button className="icon-btn" onClick={() => setIsFileSidebarOpen(true)} title="Project Files & Assets">
               <FolderOpen size={20} />
            </button>
            <button className="icon-btn" onClick={() => setIsInviteModalOpen(true)} title="Invite Collaborators">
               <UserPlus size={20} />
            </button>
            <button className="icon-btn" onClick={() => setIsHistoryOpen(true)} title="Revision History">
               <History size={20} />
            </button>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px'}}>
                <div style={{width: 8, height: 8, background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 10px #4ade80'}}></div>
                <span style={{color: '#4ade80', fontSize: '0.9rem'}}>Live</span>
            </div>
        </div>
      </div>
      
      {/* Dynamic Editor View */}
      <div style={{flex: 1, width: '100%', display: 'flex', flexDirection: 'column', position: 'relative'}}>
        {renderEditor()}
        <FileSidebar docId={id} isOpen={isFileSidebarOpen} onClose={() => setIsFileSidebarOpen(false)} />
        <HistoryPanel docId={id} isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      </div>

      <InviteModal docId={id} isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
}

export default Editor;
