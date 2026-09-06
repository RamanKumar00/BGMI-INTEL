import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, 
  Layers, Shield, Crosshair, MapPin, Compass,
  Grid, Eye, EyeOff, Navigation, Car, Ship,
  Search, Ruler, Plus, Trash2, Edit3, Upload,
  CheckCircle, AlertTriangle, X, ChevronRight,
  Info, ExternalLink, Settings, Download
} from 'lucide-react';
import { 
  getMaps, 
  getMapMarkers, 
  createMapMarker, 
  updateMapMarker, 
  deleteMapMarker, 
  bulkImportMapMarkers 
} from '../services/api';

// Verified 8km coordinate conversion constants
const MAP_SIZE_METERS = 8000;
const GRID_COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// Helper to convert normalized 0-100% coordinates to meters
function coordToMeters(pct) {
  return Math.round((pct / 100) * MAP_SIZE_METERS);
}

// Helper to format distance nicely (meters or kilometers)
function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

// Helper to calculate grid sector (A-1 to H-8)
function getGridSector(xPct, yPct) {
  const colIdx = Math.max(0, Math.min(7, Math.floor((xPct / 100) * 8)));
  const rowIdx = Math.max(1, Math.min(8, Math.floor((yPct / 100) * 8) + 1));
  return `${GRID_COLS[colIdx]}-${rowIdx}`;
}

export default function MapIntelView({ initialMap = null, user = null }) {
  // Map selection
  const [mapsList, setMapsList] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState('erangel');
  const [currentMap, setCurrentMap] = useState(null);
  const [loading, setLoading] = useState(true);

  // Markers state
  const [markers, setMarkers] = useState([]);
  const [loadingMarkers, setLoadingMarkers] = useState(false);

  // Viewport transformation
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active layers
  const [activeLayers, setActiveLayers] = useState({
    vehicle: true,
    boat: true,
    location: true,
    drop: true,
    grid: true
  });
  const [layersPanelOpen, setLayersPanelOpen] = useState(true);

  // Location search & beacon
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [beaconPoint, setBeaconPoint] = useState(null);

  // Marker Inspection
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);

  // Tactical Ruler / Distance measurement
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]); // [{x, y, metersX, metersY}]
  const [cursorPos, setCursorPos] = useState({ xPct: 50, yPct: 50, metersX: 4000, metersY: 4000, grid: 'D-5' });

  // Admin Management Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTab, setAdminTab] = useState('create'); // 'create', 'manage', 'import'
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');
  const [adminErrMsg, setAdminErrMsg] = useState('');
  const [isPickingCoords, setIsPickingCoords] = useState(false);

  // Admin Form States
  const [newMarkerForm, setNewMarkerForm] = useState({
    layer_type: 'vehicle',
    name: '',
    x: 50.0,
    y: 50.0,
    category: 'Garage',
    sub_type: 'UAZ',
    description: '',
    metadata_json: ''
  });

  const [bulkImportFmt, setBulkImportFmt] = useState('json');
  const [bulkImportData, setBulkImportData] = useState('');
  const [bulkImportPreview, setBulkImportPreview] = useState(null);

  // Refs
  const viewportRef = useRef(null);
  const containerRef = useRef(null);
  const pinchStartDistRef = useRef(null);
  const pinchStartZoomRef = useRef(1.0);

  // 1. Initial Load of Active Maps
  useEffect(() => {
    async function loadMaps() {
      setLoading(true);
      const maps = await getMaps();
      setMapsList(maps);
      if (maps && maps.length > 0) {
        // Check if initialMap passed in matches name or slug
        let matched = maps[0];
        if (initialMap) {
          const found = maps.find(m => 
            m.map_id?.toLowerCase() === initialMap.toLowerCase() ||
            m.slug?.toLowerCase() === initialMap.toLowerCase() ||
            m.name?.toLowerCase() === initialMap.toLowerCase()
          );
          if (found) matched = found;
        }
        setSelectedMapId(matched.map_id || matched.id);
        setCurrentMap(matched);
      }
      setLoading(false);
    }
    loadMaps();
  }, [initialMap]);

  // Update map when selection changes
  const handleSelectMap = (mapId) => {
    const found = mapsList.find(m => (m.map_id || m.id) === mapId);
    if (found) {
      setSelectedMapId(found.map_id || found.id);
      setCurrentMap(found);
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
      setSelectedMarker(null);
      setBeaconPoint(null);
      setMeasurePoints([]);
    }
  };

  // 2. Fetch Markers for Current Map & Active Layers
  const loadMarkersForCurrentMap = useCallback(async () => {
    if (!currentMap) return;
    setLoadingMarkers(true);
    const mapKey = currentMap.map_id || currentMap.id || selectedMapId;
    
    // Build comma separated layers
    const layerKeys = [];
    if (activeLayers.vehicle) layerKeys.push('vehicle');
    if (activeLayers.boat) layerKeys.push('boat');
    if (activeLayers.location) layerKeys.push('location');
    if (activeLayers.drop) layerKeys.push('drop');

    const data = await getMapMarkers(mapKey, layerKeys.join(','));
    setMarkers(data || []);
    setLoadingMarkers(false);
  }, [currentMap, selectedMapId, activeLayers.vehicle, activeLayers.boat, activeLayers.location, activeLayers.drop]);

  useEffect(() => {
    loadMarkersForCurrentMap();
  }, [loadMarkersForCurrentMap]);

  // 3. View Clamping based on current zoom
  const clampPan = useCallback((newPan, currentZoom) => {
    if (!viewportRef.current || currentZoom <= 1.0) {
      return { x: 0, y: 0 };
    }
    const rect = viewportRef.current.getBoundingClientRect();
    const maxPanX = (rect.width * (currentZoom - 1)) / 2 + 50;
    const maxPanY = (rect.height * (currentZoom - 1)) / 2 + 50;

    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newPan.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newPan.y))
    };
  }, []);

  // 4. Smooth Zoom Application with anchor preservation
  const applyZoom = useCallback((targetZoom, centerPoint = null) => {
    const clampedZoom = Math.min(4.5, Math.max(1.0, targetZoom));
    
    if (clampedZoom === 1.0) {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
      return;
    }

    setZoom(prevZoom => {
      setPan(prevPan => {
        if (centerPoint && viewportRef.current) {
          const rect = viewportRef.current.getBoundingClientRect();
          const offsetX = centerPoint.x - (rect.left + rect.width / 2);
          const offsetY = centerPoint.y - (rect.top + rect.height / 2);
          const scaleFactor = clampedZoom / prevZoom;
          const targetX = prevPan.x - offsetX * (scaleFactor - 1);
          const targetY = prevPan.y - offsetY * (scaleFactor - 1);
          return clampPan({ x: targetX, y: targetY }, clampedZoom);
        }
        return clampPan(prevPan, clampedZoom);
      });
      return clampedZoom;
    });
  }, [clampPan]);

  // Center on coordinates (xPct, yPct)
  const centerOnPoint = useCallback((xPct, yPct, targetZoom = 2.4) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const targetX = -(xPct / 100 - 0.5) * rect.width * targetZoom;
    const targetY = -(yPct / 100 - 0.5) * rect.height * targetZoom;

    setZoom(targetZoom);
    setPan(clampPan({ x: targetX, y: targetY }, targetZoom));
    
    // Beacon animation trigger
    setBeaconPoint({ x: xPct, y: yPct });
    setTimeout(() => {
      setBeaconPoint(null);
    }, 3500);
  }, [clampPan]);

  // 5. Mouse Interaction
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.35 : -0.35;
    const centerPoint = { x: e.clientX, y: e.clientY };
    applyZoom(zoom + zoomDelta, centerPoint);
  };

  const handleMouseDown = (e) => {
    // Left click only
    if (e.button !== 0) return;
    
    // If admin is picking coordinates
    if (isPickingCoords && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      // Reverse transformation: unpan, unzoom
      const stageCenterX = rect.width / 2 + pan.x;
      const stageCenterY = rect.height / 2 + pan.y;
      const xPct = Math.max(0, Math.min(100, ((clickX - stageCenterX) / (rect.width * zoom) + 0.5) * 100));
      const yPct = Math.max(0, Math.min(100, ((clickY - stageCenterY) / (rect.height * zoom) + 0.5) * 100));

      setNewMarkerForm(prev => ({
        ...prev,
        x: parseFloat(xPct.toFixed(2)),
        y: parseFloat(yPct.toFixed(2))
      }));
      setIsPickingCoords(false);
      setShowAdminModal(true);
      return;
    }

    // If measurement mode is active
    if (isMeasuring && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const stageCenterX = rect.width / 2 + pan.x;
      const stageCenterY = rect.height / 2 + pan.y;
      const xPct = Math.max(0, Math.min(100, ((clickX - stageCenterX) / (rect.width * zoom) + 0.5) * 100));
      const yPct = Math.max(0, Math.min(100, ((clickY - stageCenterY) / (rect.height * zoom) + 0.5) * 100));

      setMeasurePoints(prev => [
        ...prev,
        {
          x: xPct,
          y: yPct,
          metersX: coordToMeters(xPct),
          metersY: coordToMeters(yPct)
        }
      ]);
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newPan = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setPan(clampPan(newPan, zoom));
    }

    // Update cursor HUD
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const stageCenterX = rect.width / 2 + pan.x;
      const stageCenterY = rect.height / 2 + pan.y;
      const xPct = Math.max(0, Math.min(100, ((clickX - stageCenterX) / (rect.width * zoom) + 0.5) * 100));
      const yPct = Math.max(0, Math.min(100, ((clickY - stageCenterY) / (rect.height * zoom) + 0.5) * 100));

      setCursorPos({
        xPct: parseFloat(xPct.toFixed(1)),
        yPct: parseFloat(yPct.toFixed(1)),
        metersX: coordToMeters(xPct),
        metersY: coordToMeters(yPct),
        grid: getGridSector(xPct, yPct)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e) => {
    if (zoom > 1.2) {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
    } else {
      const centerPoint = { x: e.clientX, y: e.clientY };
      applyZoom(2.5, centerPoint);
    }
  };

  // 6. Touch Gestures (Drag & Pinch)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      const newPan = {
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      };
      setPan(clampPan(newPan, zoom));
    } else if (e.touches.length === 2 && pinchStartDistRef.current) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / pinchStartDistRef.current;
      const targetZoom = Math.min(4.5, Math.max(1.0, pinchStartZoomRef.current * ratio));
      setZoom(targetZoom);
      setPan(clampPan(pan, targetZoom));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    pinchStartDistRef.current = null;
  };

  // 7. Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // 8. Location Search Autocomplete
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = markers.filter(m => 
      m.name?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q) ||
      m.sub_type?.toLowerCase().includes(q)
    ).slice(0, 8);
    setSearchResults(matches);
  }, [searchQuery, markers]);

  const handleSelectSearchResult = (marker) => {
    centerOnPoint(marker.x, marker.y, 2.8);
    setSelectedMarker(marker);
    setSearchQuery('');
    setSearchFocused(false);
  };

  // 9. Clustering Calculation
  // If zoom < 1.8x, group nearby markers of the same type within 6% distance
  const { clusteredMarkers, singleMarkers } = useMemo(() => {
    if (zoom >= 1.8) {
      return { clusteredMarkers: [], singleMarkers: markers };
    }

    const clusters = [];
    const singles = [];
    const visited = new Set();
    const clusterDistThreshold = 5.5; // percentage distance threshold

    for (let i = 0; i < markers.length; i++) {
      if (visited.has(i)) continue;
      const m1 = markers[i];
      const clusterGroup = [m1];

      for (let j = i + 1; j < markers.length; j++) {
        if (visited.has(j)) continue;
        const m2 = markers[j];
        if (m1.type === m2.type || m1.layer_type === m2.layer_type) {
          const dist = Math.hypot(m1.x - m2.x, m1.y - m2.y);
          if (dist < clusterDistThreshold) {
            clusterGroup.push(m2);
            visited.add(j);
          }
        }
      }

      if (clusterGroup.length > 2) {
        // Compute average center
        const avgX = clusterGroup.reduce((sum, m) => sum + m.x, 0) / clusterGroup.length;
        const avgY = clusterGroup.reduce((sum, m) => sum + m.y, 0) / clusterGroup.length;
        clusters.push({
          id: `cluster_${i}`,
          type: m1.type || m1.layer_type,
          x: avgX,
          y: avgY,
          count: clusterGroup.length,
          items: clusterGroup
        });
        visited.add(i);
      } else {
        singles.push(m1);
      }
    }

    return { clusteredMarkers: clusters, singleMarkers: singles };
  }, [markers, zoom]);

  // Total distance calculated in tactical ruler
  const totalRulerDistance = useMemo(() => {
    if (measurePoints.length < 2) return 0;
    let distSum = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      const p1 = measurePoints[i];
      const p2 = measurePoints[i + 1];
      const dx = (p2.x - p1.x) * 80;
      const dy = (p2.y - p1.y) * 80;
      distSum += Math.sqrt(dx * dx + dy * dy);
    }
    return distSum;
  }, [measurePoints]);

  // Marker count summary by layer
  const markerCounts = useMemo(() => {
    const counts = { vehicle: 0, boat: 0, location: 0, drop: 0 };
    markers.forEach(m => {
      const t = (m.type || m.layer_type || '').toLowerCase();
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [markers]);

  // 10. Admin Actions Handlers
  const handleCreateMarkerSubmit = async (e) => {
    e.preventDefault();
    setAdminErrMsg('');
    setAdminSuccessMsg('');
    try {
      const created = await createMapMarker(selectedMapId, newMarkerForm);
      setAdminSuccessMsg(`Marker "${created.name}" created successfully!`);
      setNewMarkerForm({
        layer_type: 'vehicle',
        name: '',
        x: 50.0,
        y: 50.0,
        category: 'Garage',
        sub_type: 'UAZ',
        description: '',
        metadata_json: ''
      });
      loadMarkersForCurrentMap();
    } catch (err) {
      setAdminErrMsg(err.message || 'Failed to create marker');
    }
  };

  const handleDeleteMarker = async (markerId, name) => {
    if (!window.confirm(`Are you sure you want to delete marker "${name}"?`)) return;
    setAdminErrMsg('');
    setAdminSuccessMsg('');
    try {
      await deleteMapMarker(markerId);
      setAdminSuccessMsg(`Marker deleted successfully.`);
      if (selectedMarker?.id === markerId || selectedMarker?.marker_id === markerId) {
        setSelectedMarker(null);
      }
      loadMarkersForCurrentMap();
    } catch (err) {
      setAdminErrMsg(err.message || 'Failed to delete marker');
    }
  };

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    setAdminErrMsg('');
    setAdminSuccessMsg('');
    setBulkImportPreview(null);
    try {
      const res = await bulkImportMapMarkers(selectedMapId, bulkImportFmt, bulkImportData);
      if (res.success) {
        setAdminSuccessMsg(`Bulk import succeeded! ${res.imported_count} markers imported.`);
        setBulkImportData('');
        loadMarkersForCurrentMap();
      } else {
        setBulkImportPreview(res);
        setAdminErrMsg(`Import validation failed: ${res.failed_count} errors encountered.`);
      }
    } catch (err) {
      setAdminErrMsg(err.message || 'Failed to execute bulk import');
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`tactical-map-suite-root ${isFullscreen ? 'fullscreen-mode' : ''}`}
      id="bgmi-interactive-tactical-map"
    >
      {/* 1. TOP HEADER & MAP SELECTOR BAR */}
      <div className="tactical-map-header-bar">
        <div className="flex items-center gap-3">
          <div className="tactical-brand-badge">
            <Compass size={18} className="text-orange-500 animate-spin-slow" />
            <span className="font-heading font-black tracking-widest text-white">TACTICAL MAP INTEL</span>
          </div>

          {/* Map Selector Pills */}
          <div className="tactical-map-selector-pills">
            {mapsList.map((m) => {
              const mId = m.map_id || m.id;
              const isActive = selectedMapId.toLowerCase() === mId.toLowerCase();
              return (
                <button
                  key={mId}
                  id={`map-select-${m.slug || mId}`}
                  type="button"
                  className={`tactical-map-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectMap(mId)}
                >
                  <span className="pill-dot" />
                  {m.name}
                  <span className="pill-size-tag">{m.size_km || '8x8 km'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Location Search Autocomplete */}
        <div className="tactical-search-container">
          <div className={`tactical-search-input-box ${searchFocused ? 'focused' : ''}`}>
            <Search size={16} className="text-orange-500" />
            <input
              id="tactical-map-search-input"
              type="text"
              placeholder="Search location, compound, city (e.g. Pochinki, Pecado)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchFocused && searchQuery && (
            <div className="tactical-search-dropdown custom-scrollbar" id="tactical-search-results">
              {searchResults.length > 0 ? (
                searchResults.map((res) => (
                  <div 
                    key={res.id || res.marker_id}
                    className="search-dropdown-item"
                    onMouseDown={() => handleSelectSearchResult(res)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`marker-type-mini-badge ${res.type || res.layer_type}`}>
                        {(res.type || res.layer_type) === 'vehicle' ? '🚗' : 
                         (res.type || res.layer_type) === 'boat' ? '🚤' : 
                         (res.type || res.layer_type) === 'drop' ? '🛡️' : '📍'}
                      </span>
                      <span className="font-bold text-white text-sm">{res.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{res.category || res.sub_type || 'Location'}</span>
                      <span className="text-orange-400/80 font-mono">{getGridSector(res.x, res.y)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-dropdown-empty text-xs text-orange-400/90 p-3 text-center font-mono">
                  NO LOCATION FOUND
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Tools: Measurement, Admin Ops, Fullscreen, Reset */}
        <div className="flex items-center gap-2">
          {/* Tactical Ruler Toggle */}
          <button
            id="tactical-ruler-btn"
            type="button"
            className={`tactical-tool-btn ${isMeasuring ? 'active-measuring' : ''}`}
            onClick={() => {
              setIsMeasuring(!isMeasuring);
              if (isMeasuring) setMeasurePoints([]);
            }}
            title="Tactical Distance Ruler (Click points to calculate distance)"
          >
            <Ruler size={15} />
            <span className="hidden sm:inline">{isMeasuring ? 'MEASURING...' : 'RULER'}</span>
          </button>

          {/* Admin Management Button */}
          <button
            id="tactical-admin-btn"
            type="button"
            className="tactical-tool-btn admin-glow"
            onClick={() => {
              setAdminSuccessMsg('');
              setAdminErrMsg('');
              setShowAdminModal(true);
            }}
            title="Admin Tactical Markers & Bulk Import"
          >
            <Settings size={15} />
            <span className="hidden sm:inline">ADMIN OPS</span>
          </button>

          {/* Reset View */}
          <button
            type="button"
            className="tactical-tool-btn"
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 0, y: 0 });
            }}
            title="Reset Pan & Zoom"
          >
            <RotateCcw size={15} />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            className="tactical-tool-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* 2. MAIN MAP VIEWPORT & CANVAS */}
      <div 
        ref={viewportRef}
        className={`tactical-viewport ${isDragging ? 'is-dragging' : ''} ${isMeasuring ? 'is-measuring-cursor' : ''} ${isPickingCoords ? 'is-picking-cursor' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Transform Stage */}
        <div 
          className="tactical-stage"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
            transformOrigin: '50% 50%'
          }}
        >
          {/* Base Ultra-HD Map Asset */}
          {currentMap && (
            <img 
              src={currentMap.image_url || currentMap.image} 
              alt={currentMap.name} 
              className="tactical-base-map-img"
              draggable={false}
            />
          )}

          {/* 8x8 Grid Overlay (1000m x 1000m squares) */}
          {activeLayers.grid && (
            <div className="tactical-grid-overlay" id="tactical-8x8-grid">
              {Array.from({ length: 64 }).map((_, idx) => {
                const colIdx = idx % 8;
                const rowIdx = Math.floor(idx / 8) + 1;
                const sectorName = `${GRID_COLS[colIdx]}-${rowIdx}`;
                return (
                  <div key={idx} className="tactical-grid-cell">
                    <span className="grid-cell-label">{sectorName}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Radar Beacon Animation upon search/selection */}
          {beaconPoint && (
            <div 
              className="tactical-beacon-ping"
              style={{ top: `${beaconPoint.y}%`, left: `${beaconPoint.x}%` }}
            >
              <div className="beacon-ring ring-1" />
              <div className="beacon-ring ring-2" />
              <div className="beacon-ring ring-3" />
              <div className="beacon-center-dot" />
            </div>
          )}

          {/* Tactical Distance Measurement SVG Overlay */}
          {isMeasuring && measurePoints.length > 0 && (
            <svg className="tactical-measurement-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Polylines connecting points */}
              {measurePoints.map((pt, idx) => {
                if (idx === 0) return null;
                const prev = measurePoints[idx - 1];
                return (
                  <line 
                    key={idx}
                    x1={prev.x}
                    y1={prev.y}
                    x2={pt.x}
                    y2={pt.y}
                    stroke="#F55A05"
                    strokeWidth="0.35"
                    strokeDasharray="0.8, 0.4"
                    filter="url(#glow)"
                  />
                );
              })}

              {/* Waypoint circles */}
              {measurePoints.map((pt, idx) => (
                <g key={`pt-${idx}`}>
                  <circle cx={pt.x} cy={pt.y} r="0.8" fill="#F55A05" stroke="#FFFFFF" strokeWidth="0.2" />
                  <text 
                    x={pt.x} 
                    y={pt.y - 1.2} 
                    fill="#FFFFFF" 
                    fontSize="1.5" 
                    textAnchor="middle" 
                    fontWeight="bold"
                    className="ruler-waypoint-text"
                  >
                    #{idx + 1}
                  </text>
                </g>
              ))}
            </svg>
          )}

          {/* Single Individual Markers */}
          {singleMarkers.map((marker) => {
            const mType = (marker.type || marker.layer_type || '').toLowerCase();
            const isSelected = selectedMarker?.id === marker.id || selectedMarker?.marker_id === marker.marker_id;
            const isHovered = hoveredMarker?.id === marker.id || hoveredMarker?.marker_id === marker.marker_id;

            return (
              <div
                key={marker.id || marker.marker_id}
                className={`tactical-marker-pin marker-${mType} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                style={{ top: `${marker.y}%`, left: `${marker.x}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMarker(marker);
                }}
                onMouseEnter={() => setHoveredMarker(marker)}
                onMouseLeave={() => setHoveredMarker(null)}
              >
                <div className="marker-pin-inner">
                  {mType === 'vehicle' && <Car size={13} className="pin-icon" />}
                  {mType === 'boat' && <Ship size={13} className="pin-icon" />}
                  {mType === 'location' && <MapPin size={13} className="pin-icon" />}
                  {mType === 'drop' && <Shield size={13} className="pin-icon" />}
                </div>

                {/* Tactical Mini Name Tag (visible for locations or when zoomed in) */}
                {(mType === 'location' || zoom >= 2.0 || isHovered) && (
                  <div className="marker-nametag">
                    <span>{marker.name}</span>
                    {marker.sub_type && <span className="nametag-sub">{marker.sub_type}</span>}
                  </div>
                )}
              </div>
            );
          })}

          {/* Clustered Marker Badges */}
          {clusteredMarkers.map((cluster) => (
            <div
              key={cluster.id}
              className={`tactical-cluster-badge cluster-${cluster.type}`}
              style={{ top: `${cluster.y}%`, left: `${cluster.x}%` }}
              onClick={(e) => {
                e.stopPropagation();
                applyZoom(zoom + 1.2, { 
                  x: viewportRef.current.getBoundingClientRect().left + (cluster.x / 100) * viewportRef.current.offsetWidth, 
                  y: viewportRef.current.getBoundingClientRect().top + (cluster.y / 100) * viewportRef.current.offsetHeight 
                });
              }}
              title={`Cluster: ${cluster.count} ${cluster.type} spawns. Click to zoom in.`}
            >
              {cluster.type === 'vehicle' ? '🚗' : 
               cluster.type === 'boat' ? '🚤' : 
               cluster.type === 'drop' ? '🛡️' : '📍'}
              <span className="cluster-count">{cluster.count}</span>
            </div>
          ))}
        </div>

        {/* Picking coords banner */}
        {isPickingCoords && (
          <div className="tactical-picking-hud animate-pulse">
            <Crosshair size={18} className="text-orange-500" />
            <span>CLICK ANYWHERE ON THE MAP TO SET MARKER COORDINATES</span>
            <button 
              type="button" 
              className="picking-cancel-btn"
              onClick={() => {
                setIsPickingCoords(false);
                setShowAdminModal(true);
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* 3. FLOATING TACTICAL LAYER PANEL */}
        <div className={`tactical-floating-layers ${layersPanelOpen ? 'open' : 'collapsed'}`} id="tactical-layer-panel">
          <div className="layers-header" onClick={() => setLayersPanelOpen(!layersPanelOpen)}>
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-orange-500" />
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-white">MAP LAYERS</span>
            </div>
            <button type="button" className="layers-toggle-arrow">
              <ChevronRight size={14} className={layersPanelOpen ? 'rotate-90' : ''} />
            </button>
          </div>

          {layersPanelOpen && (
            <div className="layers-body">
              {/* Vehicle Spawns */}
              <label className="layer-checkbox-item">
                <input
                  id="layer-toggle-vehicle"
                  type="checkbox"
                  checked={activeLayers.vehicle}
                  onChange={(e) => setActiveLayers({ ...activeLayers, vehicle: e.target.checked })}
                />
                <span className="layer-icon vehicle-icon">🚗</span>
                <span className="layer-name">Vehicle Spawns</span>
                <span className="layer-badge">{markerCounts.vehicle}</span>
              </label>

              {/* Boat Spawns */}
              <label className="layer-checkbox-item">
                <input
                  id="layer-toggle-boat"
                  type="checkbox"
                  checked={activeLayers.boat}
                  onChange={(e) => setActiveLayers({ ...activeLayers, boat: e.target.checked })}
                />
                <span className="layer-icon boat-icon">🚤</span>
                <span className="layer-name">Boat Spawns</span>
                <span className="layer-badge">{markerCounts.boat}</span>
              </label>

              {/* Locations */}
              <label className="layer-checkbox-item">
                <input
                  id="layer-toggle-location"
                  type="checkbox"
                  checked={activeLayers.location}
                  onChange={(e) => setActiveLayers({ ...activeLayers, location: e.target.checked })}
                />
                <span className="layer-icon loc-icon">📍</span>
                <span className="layer-name">Locations & Towns</span>
                <span className="layer-badge">{markerCounts.location}</span>
              </label>

              {/* Esports Drop Zones */}
              <label className="layer-checkbox-item">
                <input
                  id="layer-toggle-drop"
                  type="checkbox"
                  checked={activeLayers.drop}
                  onChange={(e) => setActiveLayers({ ...activeLayers, drop: e.target.checked })}
                />
                <span className="layer-icon drop-icon">🛡️</span>
                <span className="layer-name">Esports Drop Zones</span>
                <span className="layer-badge">{markerCounts.drop}</span>
              </label>

              {/* 8x8 Grid */}
              <label className="layer-checkbox-item">
                <input
                  id="layer-toggle-grid"
                  type="checkbox"
                  checked={activeLayers.grid}
                  onChange={(e) => setActiveLayers({ ...activeLayers, grid: e.target.checked })}
                />
                <span className="layer-icon grid-icon">📐</span>
                <span className="layer-name">8×8 Tactical Grid</span>
                <span className="layer-badge">1km</span>
              </label>

              {/* Bulk layer actions */}
              <div className="layer-quick-actions">
                <button 
                  type="button" 
                  onClick={() => setActiveLayers({ vehicle: true, boat: true, location: true, drop: true, grid: true })}
                >
                  All On
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveLayers({ vehicle: false, boat: false, location: false, drop: false, grid: false })}
                >
                  All Off
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. FLOATING ZOOM CONTROLS */}
        <div className="tactical-floating-zoom-bar">
          <button 
            type="button" 
            className="zoom-btn" 
            onClick={() => applyZoom(zoom + 0.4)}
            title="Zoom In (+)"
          >
            <Plus size={16} />
          </button>
          <button 
            type="button" 
            className="zoom-btn" 
            onClick={() => applyZoom(zoom - 0.4)}
            title="Zoom Out (-)"
          >
            <ZoomOut size={16} />
          </button>
          
          <div className="zoom-presets-divider" />

          <button 
            type="button" 
            className={`zoom-preset-btn ${zoom === 1.0 ? 'active' : ''}`}
            onClick={() => applyZoom(1.0)}
          >
            FIT
          </button>
          <button 
            type="button" 
            className={`zoom-preset-btn ${zoom === 1.5 ? 'active' : ''}`}
            onClick={() => applyZoom(1.5)}
          >
            1.5x
          </button>
          <button 
            type="button" 
            className={`zoom-preset-btn ${zoom === 2.5 ? 'active' : ''}`}
            onClick={() => applyZoom(2.5)}
          >
            2.5x
          </button>
          <button 
            type="button" 
            className={`zoom-preset-btn ${zoom === 4.0 ? 'active' : ''}`}
            onClick={() => applyZoom(4.0)}
          >
            4x
          </button>
        </div>

        {/* 5. MEASUREMENT HUD (WHEN RULER ACTIVE) */}
        {isMeasuring && (
          <div className="tactical-ruler-hud animate-fade-in" id="tactical-ruler-hud">
            <div className="ruler-hud-header">
              <Ruler size={16} className="text-orange-500" />
              <span className="font-heading font-bold text-xs uppercase text-white tracking-wide">
                TACTICAL RULER HUD
              </span>
            </div>
            <div className="ruler-hud-stats">
              <div className="ruler-stat-box">
                <span className="ruler-stat-label">TOTAL DISTANCE</span>
                <span className="ruler-stat-val text-orange-400 font-mono text-base font-black">
                  {formatDistance(totalRulerDistance)}
                </span>
              </div>
              <div className="ruler-stat-box">
                <span className="ruler-stat-label">WAYPOINTS</span>
                <span className="ruler-stat-val text-white font-mono text-base font-black">
                  {measurePoints.length}
                </span>
              </div>
            </div>
            <p className="ruler-instruction-text">
              {measurePoints.length === 0 ? 'Click Point A on the map to start measuring' :
               measurePoints.length === 1 ? 'Click Point B to measure tactical line' :
               'Click additional waypoints for multi-point route'}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="ruler-action-btn clear"
                onClick={() => setMeasurePoints([])}
                disabled={measurePoints.length === 0}
              >
                Clear
              </button>
              <button
                type="button"
                className="ruler-action-btn finish"
                onClick={() => setIsMeasuring(false)}
              >
                Finish
              </button>
            </div>
          </div>
        )}

        {/* 6. REAL-TIME COORDINATE TELEMETRY HUD */}
        <div className="tactical-telemetry-hud">
          <div className="telemetry-item">
            <span className="telemetry-label">GRID:</span>
            <span className="telemetry-val text-orange-400 font-mono">{cursorPos.grid}</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">X:</span>
            <span className="telemetry-val font-mono">{cursorPos.metersX.toLocaleString()}m</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">Y:</span>
            <span className="telemetry-val font-mono">{cursorPos.metersY.toLocaleString()}m</span>
          </div>
          <div className="telemetry-item hidden sm:inline-flex">
            <span className="telemetry-label">SCALE:</span>
            <span className="telemetry-val font-mono">{zoom.toFixed(1)}x</span>
          </div>
        </div>

        {/* 7. MARKER DETAIL CARD (DESKTOP FLOATING / MOBILE BOTTOM SHEET) */}
        {selectedMarker && (
          <div className="tactical-marker-card-overlay" id="tactical-marker-detail-card">
            <div className="tactical-marker-card">
              <div className="marker-card-header">
                <div className="flex items-center gap-2">
                  <span className={`marker-type-badge ${(selectedMarker.type || selectedMarker.layer_type)}`}>
                    {(selectedMarker.type || selectedMarker.layer_type) === 'vehicle' ? '🚗 VEHICLE' : 
                     (selectedMarker.type || selectedMarker.layer_type) === 'boat' ? '🚤 BOAT' : 
                     (selectedMarker.type || selectedMarker.layer_type) === 'drop' ? '🛡️ DROP ZONE' : '📍 LOCATION'}
                  </span>
                  {selectedMarker.sub_type && (
                    <span className="marker-subtype-badge">{selectedMarker.sub_type}</span>
                  )}
                </div>
                <button 
                  type="button" 
                  className="marker-card-close" 
                  onClick={() => setSelectedMarker(null)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="marker-card-body">
                <h3 className="marker-card-title">{selectedMarker.name}</h3>
                
                {selectedMarker.category && (
                  <div className="marker-card-category">{selectedMarker.category}</div>
                )}

                <div className="marker-card-coords-grid">
                  <div className="coord-box">
                    <span className="coord-label">COORDINATES</span>
                    <span className="coord-val font-mono">
                      X: {coordToMeters(selectedMarker.x).toLocaleString()}m • Y: {coordToMeters(selectedMarker.y).toLocaleString()}m
                    </span>
                  </div>
                  <div className="coord-box">
                    <span className="coord-label">GRID SECTOR</span>
                    <span className="coord-val font-mono text-orange-400 font-bold">
                      {getGridSector(selectedMarker.x, selectedMarker.y)}
                    </span>
                  </div>
                </div>

                {selectedMarker.description && (
                  <p className="marker-card-desc">{selectedMarker.description}</p>
                )}

                {/* Verified Metadata (if available) */}
                {selectedMarker.metadata && (
                  <div className="marker-metadata-box">
                    <span className="metadata-title">TACTICAL METRICS</span>
                    <div className="metadata-items">
                      {typeof selectedMarker.metadata === 'object' ? (
                        Object.entries(selectedMarker.metadata).map(([k, v]) => (
                          <div key={k} className="meta-row">
                            <span className="meta-key">{k.replace(/_/g, ' ').toUpperCase()}:</span>
                            <span className="meta-val">{String(v)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="meta-val">{String(selectedMarker.metadata)}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="marker-card-actions">
                  <button
                    type="button"
                    className="marker-action-measure-btn"
                    onClick={() => {
                      setIsMeasuring(true);
                      setMeasurePoints([
                        {
                          x: selectedMarker.x,
                          y: selectedMarker.y,
                          metersX: coordToMeters(selectedMarker.x),
                          metersY: coordToMeters(selectedMarker.y)
                        }
                      ]);
                    }}
                  >
                    <Ruler size={14} /> Measure From Here
                  </button>
                  <button
                    type="button"
                    className="marker-action-center-btn"
                    onClick={() => centerOnPoint(selectedMarker.x, selectedMarker.y, 3.2)}
                  >
                    <Crosshair size={14} /> Center Camera
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 8. ADMIN MANAGEMENT MODAL */}
      {showAdminModal && (
        <div className="db-modal-overlay" id="tactical-admin-modal">
          <div className="db-modal-content tactical-admin-modal-box">
            <div className="tactical-admin-header">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-orange-500" />
                <h2 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                  TACTICAL MAP ADMIN OPS
                </h2>
              </div>
              <button 
                type="button" 
                className="db-modal-close"
                onClick={() => setShowAdminModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Admin Tabs */}
            <div className="tactical-admin-tabs">
              <button
                type="button"
                className={`admin-tab-btn ${adminTab === 'create' ? 'active' : ''}`}
                onClick={() => setAdminTab('create')}
              >
                <Plus size={14} /> Add Marker
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${adminTab === 'manage' ? 'active' : ''}`}
                onClick={() => setAdminTab('manage')}
              >
                <Edit3 size={14} /> Manage Markers ({markers.length})
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${adminTab === 'import' ? 'active' : ''}`}
                onClick={() => setAdminTab('import')}
              >
                <Upload size={14} /> Bulk Import (CSV/JSON)
              </button>
            </div>

            {/* Alerts */}
            {adminSuccessMsg && (
              <div className="admin-alert success flex items-center gap-2 p-3 my-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-sm">
                <CheckCircle size={16} /> {adminSuccessMsg}
              </div>
            )}
            {adminErrMsg && (
              <div className="admin-alert error flex items-center gap-2 p-3 my-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-sm">
                <AlertTriangle size={16} /> {adminErrMsg}
              </div>
            )}

            {/* TAB 1: CREATE MARKER */}
            {adminTab === 'create' && (
              <form onSubmit={handleCreateMarkerSubmit} className="admin-form space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Layer Type *</label>
                    <select
                      id="admin-layer-type-select"
                      className="admin-input"
                      value={newMarkerForm.layer_type}
                      onChange={(e) => setNewMarkerForm({ ...newMarkerForm, layer_type: e.target.value })}
                      required
                    >
                      <option value="vehicle">Vehicle (🚗 Land)</option>
                      <option value="boat">Boat (🚤 Watercraft)</option>
                      <option value="location">Location (📍 Landmark/Town)</option>
                      <option value="drop">Drop Zone (🛡️ Contest Point)</option>
                    </select>
                  </div>

                  <div>
                    <label className="admin-label">Marker Name *</label>
                    <input
                      id="admin-marker-name-input"
                      type="text"
                      className="admin-input"
                      placeholder="e.g. Pochinki Central Garage"
                      value={newMarkerForm.name}
                      onChange={(e) => setNewMarkerForm({ ...newMarkerForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Category</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g. Garage, Roadside, Major City"
                      value={newMarkerForm.category}
                      onChange={(e) => setNewMarkerForm({ ...newMarkerForm, category: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="admin-label">Sub-Type</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g. UAZ, Dacia, Tier 3 Loot"
                      value={newMarkerForm.sub_type}
                      onChange={(e) => setNewMarkerForm({ ...newMarkerForm, sub_type: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-orange-400">Map Coordinates (0–100%)</span>
                    <button
                      type="button"
                      className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2 py-1 rounded hover:bg-orange-500/30 transition-colors flex items-center gap-1"
                      onClick={() => {
                        setShowAdminModal(false);
                        setIsPickingCoords(true);
                      }}
                    >
                      <Crosshair size={12} /> Pick on Map Canvas
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="admin-label">X Coordinate (%) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="admin-input font-mono"
                        value={newMarkerForm.x}
                        onChange={(e) => setNewMarkerForm({ ...newMarkerForm, x: parseFloat(e.target.value) || 0 })}
                        required
                      />
                      <span className="text-xs text-gray-400 mt-1 block">
                        ≈ {coordToMeters(newMarkerForm.x).toLocaleString()} meters
                      </span>
                    </div>
                    <div>
                      <label className="admin-label">Y Coordinate (%) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="admin-input font-mono"
                        value={newMarkerForm.y}
                        onChange={(e) => setNewMarkerForm({ ...newMarkerForm, y: parseFloat(e.target.value) || 0 })}
                        required
                      />
                      <span className="text-xs text-gray-400 mt-1 block">
                        ≈ {coordToMeters(newMarkerForm.y).toLocaleString()} meters
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="admin-label">Description</label>
                  <textarea
                    rows={2}
                    className="admin-input"
                    placeholder="Tactical details, spawn frequency, landmark description..."
                    value={newMarkerForm.description}
                    onChange={(e) => setNewMarkerForm({ ...newMarkerForm, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    className="db-nav-btn"
                    onClick={() => setShowAdminModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    id="admin-submit-marker-btn"
                    type="submit"
                    className="tactical-primary-btn"
                  >
                    Create Verified Marker
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: MANAGE MARKERS */}
            {adminTab === 'manage' && (
              <div className="admin-manage-list custom-scrollbar max-h-96 overflow-y-auto space-y-2 pr-1">
                {markers.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">No markers loaded for {currentMap?.name}.</div>
                ) : (
                  markers.map((mk) => (
                    <div key={mk.id || mk.marker_id} className="admin-marker-row flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`marker-type-mini-badge ${(mk.type || mk.layer_type)}`}>
                            {(mk.type || mk.layer_type) === 'vehicle' ? '🚗' : 
                             (mk.type || mk.layer_type) === 'boat' ? '🚤' : 
                             (mk.type || mk.layer_type) === 'drop' ? '🛡️' : '📍'}
                          </span>
                          <span className="font-bold text-white text-sm">{mk.name}</span>
                          <span className="text-xs text-gray-400">({mk.sub_type || mk.category || 'General'})</span>
                        </div>
                        <div className="text-xs text-orange-400/80 font-mono mt-0.5">
                          Grid: {getGridSector(mk.x, mk.y)} • X: {coordToMeters(mk.x)}m, Y: {coordToMeters(mk.y)}m
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-white rounded bg-white/5"
                          onClick={() => {
                            setShowAdminModal(false);
                            centerOnPoint(mk.x, mk.y, 3.0);
                            setSelectedMarker(mk);
                          }}
                          title="Locate On Map"
                        >
                          <Crosshair size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-red-400 hover:text-red-300 rounded bg-red-500/10 hover:bg-red-500/20"
                          onClick={() => handleDeleteMarker(mk.id || mk.marker_id, mk.name)}
                          title="Delete Marker"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: BULK IMPORT */}
            {adminTab === 'import' && (
              <form onSubmit={handleBulkImportSubmit} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-300">Format:</span>
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-bold rounded ${bulkImportFmt === 'json' ? 'bg-orange-500 text-white' : 'bg-white/10 text-gray-400'}`}
                      onClick={() => setBulkImportFmt('json')}
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-bold rounded ${bulkImportFmt === 'csv' ? 'bg-orange-500 text-white' : 'bg-white/10 text-gray-400'}`}
                      onClick={() => setBulkImportFmt('csv')}
                    >
                      CSV
                    </button>
                  </div>

                  <button
                    type="button"
                    className="text-xs text-orange-400 underline hover:text-orange-300"
                    onClick={() => {
                      if (bulkImportFmt === 'json') {
                        setBulkImportData(JSON.stringify([
                          {
                            "name": "Pochinki South Garage",
                            "layer_type": "vehicle",
                            "x": 44.5,
                            "y": 55.0,
                            "category": "Garage",
                            "sub_type": "Dacia",
                            "description": "High probability sheltered vehicle spawn"
                          },
                          {
                            "name": "Sosnovka Ferry Dock",
                            "layer_type": "boat",
                            "x": 52.0,
                            "y": 70.5,
                            "category": "Dock",
                            "sub_type": "Speedboat",
                            "description": "River crossing tactical watercraft"
                          }
                        ], null, 2));
                      } else {
                        setBulkImportData(
                          "name,layer_type,x,y,category,sub_type,description\n" +
                          "Pochinki South Garage,vehicle,44.5,55.0,Garage,Dacia,High probability sheltered vehicle spawn\n" +
                          "Sosnovka Ferry Dock,boat,52.0,70.5,Dock,Speedboat,River crossing tactical watercraft"
                        );
                      }
                    }}
                  >
                    Load Sample Template
                  </button>
                </div>

                <div>
                  <textarea
                    id="admin-bulk-import-textarea"
                    rows={8}
                    className="admin-input font-mono text-xs"
                    placeholder={bulkImportFmt === 'json' ? '[{"name": "...", "layer_type": "vehicle", "x": 50, "y": 50}]' : 'name,layer_type,x,y,category,sub_type,description'}
                    value={bulkImportData}
                    onChange={(e) => setBulkImportData(e.target.value)}
                    required
                  />
                </div>

                {bulkImportPreview && bulkImportPreview.errors?.length > 0 && (
                  <div className="p-3 bg-red-950/40 border border-red-500/40 rounded max-h-36 overflow-y-auto">
                    <span className="text-xs font-bold text-red-400 block mb-1">
                      Validation Errors ({bulkImportPreview.errors.length}):
                    </span>
                    <ul className="text-xs text-red-300 space-y-1 list-disc pl-4">
                      {bulkImportPreview.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    className="db-nav-btn"
                    onClick={() => setShowAdminModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    id="admin-submit-import-btn"
                    type="submit"
                    className="tactical-primary-btn"
                    disabled={!bulkImportData.trim()}
                  >
                    Validate & Import Data
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
