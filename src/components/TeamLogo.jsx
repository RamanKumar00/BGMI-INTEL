import React, { useState } from 'react';

export default function TeamLogo({ team, size = 'medium', className = '' }) {
  const [hasError, setHasError] = useState(false);

  const sizeStyles = {
    small: { width: '32px', height: '32px', minWidth: '32px', fontSize: '12px' },
    medium: { width: '64px', height: '64px', minWidth: '64px', fontSize: '18px' },
    large: { width: '96px', height: '96px', minWidth: '96px', fontSize: '24px' },
    avatar: { width: '48px', height: '48px', minWidth: '48px', borderRadius: '50%', fontSize: '16px' }
  };

  const currentSizeStyle = sizeStyles[size] || sizeStyles.medium;

  // Base container style using flexbox to center content
  const containerStyle = {
    ...currentSizeStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    flexShrink: 0,
    borderRadius: size === 'avatar' ? '50%' : '8px'
  };

  if (!team?.logo_url || hasError) {
    const initials = team?.team_name ? team.team_name.substring(0, 2).toUpperCase() : '??';
    return (
      <div className={`db-team-logo-container ${className}`} style={containerStyle} title={team?.team_name || "Unknown Team"}>
        <span style={{ fontWeight: 'bold', color: 'var(--color-orange-primary)' }}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={`db-team-logo-container ${className}`} style={containerStyle}>
      <img
        src={team.logo_url}
        alt={`${team.team_name} logo`}
        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
        loading="lazy"
        onError={(e) => {
          console.warn(`[TeamLogo] Failed to load logo for ${team.team_name}: ${team.logo_url}`);
          setHasError(true);
        }}
      />
    </div>
  );
}
