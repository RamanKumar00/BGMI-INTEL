import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { audioManager } from '../services/audioManager';

export default function SignUpCard({ onToggleView, onSignUpSuccess }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    // Direct synchronous user interaction: unlock audio context immediately
    audioManager.unlock();
    audioManager.playBeep('click');

    setIsLoading(true);
    setSuccess('Account created successfully! Deploying to battleground...');

    setTimeout(() => {
      setIsLoading(false);
      if (onSignUpSuccess) {
        onSignUpSuccess(username, email);
      }
    }, 450);
  };

  return (
    <div className="portal-card">
      <div className="card-title-container">
        <div className="card-title-line"></div>
        <h2 className="card-title">Sign Up</h2>
        <div className="card-title-line"></div>
      </div>
      <p className="card-subtitle">Join the battleground of intelligence!</p>

      {error && (
        <div className="form-alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="form-success-alert">
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="input-icon-wrapper">
            <User className="input-icon-left" size={18} />
            <input
              type="text"
              placeholder="Username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <div className="input-icon-wrapper">
            <Mail className="input-icon-left" size={18} />
            <input
              type="email"
              placeholder="Email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <div className="input-icon-wrapper">
            <Lock className="input-icon-left" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="input-icon-right"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <div className="input-icon-wrapper">
            <Lock className="input-icon-left" size={18} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="input-icon-right"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-options-row">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={isLoading}
            />
            <span className="checkmark"></span>
            <span style={{ fontSize: '0.8rem' }}>
              I agree to the <a href="#terms" className="forgot-password-link" onClick={e => e.preventDefault()}>Terms of Service</a> and <a href="#privacy" className="forgot-password-link" onClick={e => e.preventDefault()}>Privacy Policy</a>
            </span>
          </label>
        </div>

        <button type="submit" className="btn-submit" disabled={isLoading}>
          {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
        </button>
      </form>

      <div className="divider-row">
        <div className="divider-line"></div>
        <span>OR</span>
        <div className="divider-line"></div>
      </div>

      <div className="social-row">
        <button className="btn-social" aria-label="Sign up with Google" disabled={isLoading}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.357-2.847-6.357-6.357s2.847-6.357 6.357-6.357c1.6 0 3.05.59 4.17 1.564l3.142-3.14C19.16 2.05 15.93 1 12.24 1 5.922 1 1 5.922 1 12.24s4.922 11.24 11.24 11.24c6.64 0 11.24-4.67 11.24-11.24 0-.74-.08-1.46-.22-2.155H12.24z"
            />
          </svg>
        </button>
        <button className="btn-social" aria-label="Sign up with Facebook" disabled={isLoading}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#1877F2"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
        </button>
        <button className="btn-social" aria-label="Sign up with Twitter" disabled={isLoading}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#1DA1F2"
              d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
            />
          </svg>
        </button>
        <button className="btn-social" aria-label="Sign up with Discord" disabled={isLoading}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#5865F2"
              d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"
            />
          </svg>
        </button>
      </div>

      <p className="card-toggle-text">
        Already have an account?
        <button type="button" onClick={onToggleView} disabled={isLoading}>
          Login
        </button>
      </p>
    </div>
  );
}
