import React, { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0A0B0E',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(245, 90, 5, 0.1)',
            border: '1px solid rgba(245, 90, 5, 0.4)',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
          }}>
            <h1 style={{ color: '#F55A05', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
              BGMI INTEL RECOVERY MODE
            </h1>
            <p style={{ color: '#8E929A', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              A temporary interface error occurred. Click below to restore full tactical intelligence portal session.
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                background: '#F55A05',
                color: '#FFF',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(245,90,5,0.4)'
              }}
            >
              REBOOT APPLICATION SESSION
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
