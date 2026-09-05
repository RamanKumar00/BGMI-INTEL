import React, { useState } from 'react';
import { X, User, Sliders, Shield, Bell, HardDrive } from 'lucide-react';

export default function UserSettingsModal({ user, onClose, initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-content" style={{ maxWidth: '600px' }}>
        <button type="button" className="db-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="db-modal-header mb-6">
          <h2 className="text-2xl font-black italic tracking-wide text-white uppercase" style={{ fontFamily: 'var(--font-heading)' }}>
            TACTICAL <span style={{ color: 'var(--color-orange-primary)' }}>OPERATOR</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage your analyst profile and system preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 mb-6">
          <button 
            className={`pb-2 px-1 font-bold text-sm border-b-2 transition-colors ${activeTab === 'profile' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center gap-2"><User size={16}/> Profile</div>
          </button>
          <button 
            className={`pb-2 px-1 font-bold text-sm border-b-2 transition-colors ${activeTab === 'preferences' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('preferences')}
          >
            <div className="flex items-center gap-2"><Sliders size={16}/> Preferences</div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center gap-6 bg-black/40 p-4 rounded-xl border border-white/5">
              <img src="/avatar_soldier.png" alt="Avatar" className="w-20 h-20 rounded-full border-2 border-orange-500/50" />
              <div>
                <h3 className="text-xl font-bold text-white">{user?.username || 'ANALYST'}</h3>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 text-xs font-bold px-2 py-1 rounded border border-orange-500/20">
                  <Shield size={12} /> LEVEL 3 CLEARANCE
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Account Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="text-sm text-emerald-400 font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> Active Link
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">Data Access</div>
                  <div className="text-sm text-white font-bold">Full Database</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <Bell size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Live Data Stream Alerts</div>
                    <div className="text-xs text-gray-400">Receive notifications when new match telemetry is parsed</div>
                  </div>
                </div>
                <div className="w-12 h-6 bg-orange-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <HardDrive size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Hardware Acceleration</div>
                    <div className="text-xs text-gray-400">Use GPU to render complex map intel and charts</div>
                  </div>
                </div>
                <div className="w-12 h-6 bg-orange-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
