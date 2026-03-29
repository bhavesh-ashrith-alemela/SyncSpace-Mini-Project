import React, { useState } from 'react';
import api from './Api';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const res = await api.post('/auth/signin', { username, password });
        onLogin(res.data);
      } else {
        await api.post('/auth/signup', { username, email, password });
        setIsLogin(true); // switch to login after successful signup
        setError('Signup successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <img src="/meeting_room.png" alt="Collaborative Workspace" style={{width: '100%', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--glass-border)'}} />
        <h1 style={{color: 'var(--accent-color)', margin: 0}}>SyncSpace</h1>
        <h2 style={{fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        {error && <p className="error-text">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
          />
          {!isLogin && (
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          )}
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" style={{width: '100%'}}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p style={{marginTop: '1.5rem', color: 'var(--text-secondary)'}}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
}

export default Auth;
