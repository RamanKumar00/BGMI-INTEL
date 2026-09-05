import React, { useEffect, useState } from 'react';
import { RefreshCw, Layers, Shield } from 'lucide-react';
import { getMapDrops } from '../services/api';

const POI_COORDINATES = {
  Erangel: {
    'Yasnaya Polyana': { top: '35%', left: '60%' },
    'Pochinki': { top: '55%', left: '45%' },
    'Georgopol': { top: '30%', left: '20%' },
    'Novorepnoye': { top: '80%', left: '70%' },
    'Sosnovka Military Base': { top: '85%', left: '50%' },
    'Rozhok': { top: '40%', left: '48%' },
    'Severny': { top: '15%', left: '48%' },
    'Mylta': { top: '65%', left: '65%' },
    'Primorsk': { top: '75%', left: '25%' },
    'Lipovka': { top: '45%', left: '80%' },
  },
  Miramar: {
    'Pecado': { top: '50%', left: '45%' },
    'Los Leones': { top: '65%', left: '60%' },
    'El Pozo': { top: '35%', left: '30%' },
    'San Martin': { top: '40%', left: '45%' },
    'Chumacera': { top: '60%', left: '40%' },
  },
  Rondo: {
    'Jadena City': { top: '70%', left: '70%' },
    'NEOX Factory': { top: '45%', left: '50%' },
    'Mey Ran': { top: '35%', left: '40%' },
    'Tin Long Garden': { top: '60%', left: '35%' },
  }
};

const MAP_ASSETS = {
  Erangel: '/map_erangel.png',
  Miramar: '/map_miramar.png',
  Rondo: '/map_rondo.png'
};

function generateSimulatedDrops(mapName) {
  const coords = POI_COORDINATES[mapName];
  if (!coords) return [];
  return Object.keys(coords).map((poi, idx) => ({
    id: idx,
    poi: poi,
    team_name: `Team ${String.fromCharCode(65 + idx)}`,
    frequency: Math.floor(Math.random() * 40) + 10,
    survival_rate: (Math.random() * 40 + 50).toFixed(1) + '%'
  }));
}

export default function MapIntelView() {
  const [selectedMap, setSelectedMap] = useState('Erangel');
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredDrop, setHoveredDrop] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Fetch drops from API
      const data = await getMapDrops(selectedMap);
      
      // If the DB has no drops, we will simulate drops for the purpose of the interactive map UI
      let displayDrops = data && data.length > 0 ? data : generateSimulatedDrops(selectedMap);
      setDrops(displayDrops);
      setLoading(false);
    }
    load();
  }, [selectedMap]);


  return (
    <div className="db-subview-container">
      {/* View Header */}
      <div className="db-subview-header">
        <div>
          <h1 className="db-subview-title">
            MAP <span>INTEL</span>
          </h1>
          <p className="db-subview-subtitle">
            Interactive drop analysis and heatmaps for major BGMI maps
          </p>
        </div>
        <div className="flex gap-2">
          {Object.keys(MAP_ASSETS).map(mapName => (
            <button
              key={mapName}
              onClick={() => setSelectedMap(mapName)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                selectedMap === mapName 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {mapName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Interactive Map */}
        <div className="lg:col-span-2 relative bg-black/40 border border-white/10 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center text-gray-400">
              <RefreshCw className="animate-spin mb-2" size={24} />
              <span>Analyzing telemetry...</span>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Map Image Base */}
              <img 
                src={MAP_ASSETS[selectedMap]} 
                alt={`${selectedMap} Map`} 
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                style={{ filter: 'grayscale(30%) contrast(120%)' }}
              />
              
              {/* Drop Markers */}
              {drops.map((drop, idx) => {
                const coord = POI_COORDINATES[selectedMap][drop.poi] || { top: '50%', left: '50%' };
                const isHovered = hoveredDrop === drop.id;
                
                return (
                  <div
                    key={idx}
                    className="absolute z-10 transition-transform cursor-crosshair"
                    style={{ top: coord.top, left: coord.left, transform: 'translate(-50%, -50%)' }}
                    onMouseEnter={() => setHoveredDrop(drop.id)}
                    onMouseLeave={() => setHoveredDrop(null)}
                  >
                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${isHovered ? 'border-orange-400 bg-orange-500/80 scale-125' : 'border-white/50 bg-black/60'} transition-all`}>
                      <Shield size={14} className={isHovered ? 'text-white' : 'text-orange-400'} />
                      
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 bg-black border border-orange-500/50 rounded-lg p-3 shadow-2xl shadow-orange-500/20 z-50">
                          <div className="font-black italic text-orange-400 text-sm mb-1 uppercase">{drop.poi}</div>
                          <div className="text-white font-bold text-xs">{drop.team_name} Drop Zone</div>
                          <div className="mt-2 text-xs text-gray-400 flex justify-between">
                            <span>Drop Freq:</span> <span className="text-white">{drop.frequency} matches</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-400 flex justify-between">
                            <span>Survival Rate:</span> <span className="text-green-400">{drop.survival_rate}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Stats */}
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Layers size={18} className="text-orange-500" /> Hot Drop Analysis
            </h3>
            <div className="space-y-3">
              {[...drops].sort((a, b) => b.frequency - a.frequency).slice(0, 5).map((d, i) => (
                <div key={i} className="flex justify-between items-center pb-2 border-b border-white/5 last:border-0 last:pb-0">
                  <div>
                    <div className="text-sm font-bold text-white">{d.poi}</div>
                    <div className="text-xs text-orange-400 font-medium">Dominant: {d.team_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black italic">{d.frequency}</div>
                    <div className="text-[10px] text-gray-500">Matches</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
