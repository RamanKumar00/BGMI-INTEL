import React, { useState } from 'react';
import LoginCard from './components/LoginCard';
import SignUpCard from './components/SignUpCard';
import FooterBar from './components/FooterBar';
import DashboardLayout from './components/DashboardLayout';
import IntelLoadingScreen from './components/IntelLoadingScreen';

const STORAGE_KEY = 'bgmi_intel_user';

export default function App() {
  const [view, setView] = useState('login'); // 'login' or 'signup'
  const [isBooting, setIsBooting] = useState(false); // Default false so app loads immediately without audio autoplay block
  
  // Initialize user from localStorage, defaulting to active session so reload doesn't logout automatically
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Could not read user from localStorage:', err);
    }
    // Default logged in user profile (persists across page reloads)
    const defaultUser = {
      username: 'RAMANKR7321',
      email: 'ramankr7321@bgmi-intel.com'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  });

  const handleLoginSuccess = (usernameOrEmail) => {
    const userData = {
      username: usernameOrEmail.split('@')[0],
      email: usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@bgmi-intel.com`
    };
    setUser(userData);
    setIsBooting(true); // Trigger cinematic boot sequence after login
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn('Failed to save user session:', e);
    }
  };

  const handleSignUpSuccess = (username, email) => {
    const userData = {
      username: username,
      email: email
    };
    setUser(userData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn('Failed to save user session:', e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsBooting(false); // Reset boot state
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear user session:', e);
    }
  };

  if (user) {
    if (isBooting) {
      return <IntelLoadingScreen onComplete={() => setIsBooting(false)} />;
    }
    return <DashboardLayout user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="portal-container">
      {/* Background elements */}
      <div 
        className={`portal-bg ${view === 'login' ? 'active' : ''}`} 
        style={{ backgroundImage: "url('/bg_login.png')" }}
      ></div>
      <div 
        className={`portal-bg ${view === 'signup' ? 'active' : ''}`} 
        style={{ backgroundImage: "url('/bg_signup.png')" }}
      ></div>
      <div className="portal-overlay"></div>

      {/* Header section */}
      <header className="portal-header">
        <img 
          src="/helmet_logo.png" 
          alt="BGMI Level 3 Helmet" 
          className="helmet-logo" 
        />
        <h1 className="portal-title">BGMI <span>Intel</span></h1>
        <div className="portal-subtitle">Your Esports. Your Intelligence.</div>
      </header>

      {/* Main card container */}
      <main className="card-wrapper">
        {view === 'login' ? (
          <LoginCard 
            onToggleView={() => setView('signup')} 
            onLoginSuccess={handleLoginSuccess} 
          />
        ) : (
          <SignUpCard 
            onToggleView={() => setView('login')} 
            onSignUpSuccess={handleSignUpSuccess} 
          />
        )}
      </main>

      {/* Footer Navigation Bar */}
      <FooterBar />
    </div>
  );
}
