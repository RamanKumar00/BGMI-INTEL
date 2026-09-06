/**
 * BGMI Intel Backend API Client
 * Connects React frontend to FastAPI backend (http://127.0.0.1:8000/api)
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '') + '/api';

async function fetchJson(endpoint) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] Fallback for ${endpoint}:`, err.message);
    return null;
  }
}

export async function getDashboardMaster(season) {
  const data = await fetchJson(`/dashboard/master${season ? `?season=${encodeURIComponent(season)}` : ''}`);
  return data;
}

export async function getDashboardStats() {
  const data = await fetchJson('/dashboard/stats');
  if (data) return data;
  return {
    active_players: 479,
    active_players_change: '+12.5%',
    teams_tracked: 190,
    teams_tracked_change: '+8.4%',
    tournaments: 19,
    tournaments_change: '+6.2%',
    matches_analyzed: 13,
    matches_analyzed_change: '+15.3%',
    maps_count: 3,
    maps: ['Erangel', 'Miramar', 'Rondo'],
    data_coverage: '98.6%'
  };
}

export async function getPlayers() {
  const data = await fetchJson('/players');
  return data || [];
}

export async function getPlayerCareer(playerId) {
  const data = await fetchJson(`/players/${encodeURIComponent(playerId)}/career`);
  return data || [];
}

export async function getPlayerTournaments(playerId) {
  const data = await fetchJson(`/players/${encodeURIComponent(playerId)}/tournaments`);
  return data || [];
}

export async function getTrendingPlayers() {
  const data = await fetchJson('/players/trending');
  return data || [];
}

export async function searchPlayers(query) {
  if (!query || query.length < 1) return [];
  const data = await fetchJson(`/players/search?q=${encodeURIComponent(query)}`);
  return data || [];
}

export async function getTeams() {
  const data = await fetchJson('/teams');
  return data || [];
}

export async function getTeamDetails(teamId) {
  const data = await fetchJson(`/teams/${encodeURIComponent(teamId)}`);
  return data;
}

export async function getTeamRoster(teamId) {
  const data = await fetchJson(`/teams/${encodeURIComponent(teamId)}/roster`);
  return data || [];
}

export async function getTeamTournaments(teamId) {
  const data = await fetchJson(`/teams/${encodeURIComponent(teamId)}/tournaments`);
  return data || [];
}

export async function getTeamStatistics(teamId) {
  const data = await fetchJson(`/teams/${encodeURIComponent(teamId)}/statistics`);
  return data;
}

export async function getTeamHistory(teamId) {
  const data = await fetchJson(`/teams/${encodeURIComponent(teamId)}/history`);
  return data || [];
}

export async function compareTeams(teamAId, teamBId) {
  const data = await fetchJson(`/analytics/compare?teamA=${encodeURIComponent(teamAId)}&teamB=${encodeURIComponent(teamBId)}`);
  return data;
}

export async function getTournaments() {
  const data = await fetchJson('/tournaments');
  return data || [];
}

export async function getTournamentIntel(tournamentId) {
  const data = await fetchJson(`/tournaments/${encodeURIComponent(tournamentId)}/intel`);
  return data;
}

export async function getMatches(params = {}) {
  const query = new URLSearchParams();
  if (params.tournament_id && params.tournament_id !== 'All') query.append('tournament_id', params.tournament_id);
  if (params.stage && params.stage !== 'All') query.append('stage', params.stage);
  if (params.map && params.map !== 'All') query.append('map', params.map);
  if (params.team_id && params.team_id !== 'All') query.append('team_id', params.team_id);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  
  const qStr = query.toString();
  const data = await fetchJson(`/matches${qStr ? `?${qStr}` : ''}`);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.matches || [];
}

export async function getMatchesWithMeta(params = {}) {
  const query = new URLSearchParams();
  if (params.tournament_id && params.tournament_id !== 'All') query.append('tournament_id', params.tournament_id);
  if (params.stage && params.stage !== 'All') query.append('stage', params.stage);
  if (params.map && params.map !== 'All') query.append('map', params.map);
  if (params.team_id && params.team_id !== 'All') query.append('team_id', params.team_id);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  
  const qStr = query.toString();
  const data = await fetchJson(`/matches${qStr ? `?${qStr}` : ''}`);
  return data || { total: 0, page: 1, page_size: 50, matches: [] };
}

export async function getMatch(matchId) {
  const data = await fetchJson(`/matches/${encodeURIComponent(matchId)}`);
  return data;
}

export async function compareMatchesApi(matchIds) {
  const idsStr = Array.isArray(matchIds) ? matchIds.join(',') : matchIds;
  const data = await fetchJson(`/matches/compare?match_ids=${encodeURIComponent(idsStr)}`);
  return data?.comparisons || [];
}

// ---------------- Drop Analytics APIs ----------------
export async function getDropsSummary(params = {}) {
  const query = new URLSearchParams();
  if (params.map && params.map !== 'All') query.append('map', params.map);
  if (params.tournament_id && params.tournament_id !== 'All') query.append('tournament_id', params.tournament_id);
  if (params.stage && params.stage !== 'All') query.append('stage', params.stage);
  if (params.team_id && params.team_id !== 'All') query.append('team_id', params.team_id);
  if (params.location && params.location !== 'All') query.append('location', params.location);

  const qStr = query.toString();
  return await fetchJson(`/analytics/drops/summary${qStr ? `?${qStr}` : ''}`);
}

export async function getDropsHeatmap(params = {}) {
  const query = new URLSearchParams();
  if (params.map && params.map !== 'All') query.append('map', params.map);
  if (params.tournament_id && params.tournament_id !== 'All') query.append('tournament_id', params.tournament_id);
  if (params.stage && params.stage !== 'All') query.append('stage', params.stage);
  if (params.team_id && params.team_id !== 'All') query.append('team_id', params.team_id);

  const qStr = query.toString();
  return (await fetchJson(`/analytics/drops/heatmap${qStr ? `?${qStr}` : ''}`)) || [];
}

export async function getDropsLocations(params = {}) {
  const query = new URLSearchParams();
  if (params.map && params.map !== 'All') query.append('map', params.map);
  if (params.tournament_id && params.tournament_id !== 'All') query.append('tournament_id', params.tournament_id);
  if (params.stage && params.stage !== 'All') query.append('stage', params.stage);
  if (params.team_id && params.team_id !== 'All') query.append('team_id', params.team_id);

  const qStr = query.toString();
  return (await fetchJson(`/analytics/drops/locations${qStr ? `?${qStr}` : ''}`)) || [];
}

export async function getTeamDropProfile(teamId, params = {}) {
  const query = new URLSearchParams();
  if (params.map && params.map !== 'All') query.append('map', params.map);
  if (params.tournament_id && params.tournament_id !== 'All') query.append('tournament_id', params.tournament_id);

  const qStr = query.toString();
  return await fetchJson(`/analytics/drops/teams/${encodeURIComponent(teamId)}${qStr ? `?${qStr}` : ''}`);
}

export async function getDropsContests(params = {}) {
  const query = new URLSearchParams();
  if (params.map && params.map !== 'All') query.append('map', params.map);
  if (params.tournament_id && params.tournament_id !== 'All') query.append('tournament_id', params.tournament_id);
  if (params.stage && params.stage !== 'All') query.append('stage', params.stage);

  const qStr = query.toString();
  return (await fetchJson(`/analytics/drops/contests${qStr ? `?${qStr}` : ''}`)) || [];
}

export async function getDropsClashMatrix(params = {}) {
  const query = new URLSearchParams();
  if (params.map && params.map !== 'All') query.append('map', params.map);
  if (params.tournament_id && params.tournament_id !== 'All') query.append('tournament_id', params.tournament_id);

  const qStr = query.toString();
  const data = await fetchJson(`/analytics/drops/clash-matrix${qStr ? `?${qStr}` : ''}`);
  return data?.clashes || [];
}

export async function getDropsHistory(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  if (params.map && params.map !== 'All') query.append('map', params.map);
  if (params.tournament_id && params.tournament_id !== 'All') query.append('tournament_id', params.tournament_id);
  if (params.team_id && params.team_id !== 'All') query.append('team_id', params.team_id);
  if (params.location && params.location !== 'All') query.append('location', params.location);

  const qStr = query.toString();
  return await fetchJson(`/analytics/drops/history${qStr ? `?${qStr}` : ''}`);
}

export async function getMapStats(mapName) {
  const data = await fetchJson(`/maps/${encodeURIComponent(mapName)}`);
  return data || [];
}

export async function getMapDrops(mapName) {
  const data = await fetchJson(`/maps/${encodeURIComponent(mapName)}/drops`);
  return data || [];
}

export async function getAchievements() {
  const data = await fetchJson('/achievements');
  return data || [];
}

import { PINTEREST_MEDIA_ASSETS } from '../data/pinterestMediaData';

// ==========================================================================
// MEDIA HUB & PINTEREST API CLIENT
// ==========================================================================

const SAVED_PINS_KEY = 'bgmi_saved_pins';
const CUSTOM_PINS_KEY = 'bgmi_custom_pins';

export function getSavedPins() {
  try {
    const raw = localStorage.getItem(SAVED_PINS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function isPinSaved(mediaId) {
  const saved = getSavedPins();
  return saved.some(p => p.media_id === mediaId);
}

export function toggleSavePin(item) {
  const saved = getSavedPins();
  const exists = saved.some(p => p.media_id === item.media_id);
  let updated;
  if (exists) {
    updated = saved.filter(p => p.media_id !== item.media_id);
  } else {
    updated = [{ ...item, saved_at: new Date().toISOString() }, ...saved];
  }
  try {
    localStorage.setItem(SAVED_PINS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return !exists;
}

export function getCustomImportedPins() {
  try {
    const raw = localStorage.getItem(CUSTOM_PINS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function importPinterestPin(pinData) {
  const custom = getCustomImportedPins();
  const newPin = {
    media_id: `custom_pin_${Date.now()}`,
    title: pinData.title || 'Pinterest BGMI Pin',
    description: pinData.description || 'Imported from Pinterest for BGMI & PUBG collection',
    image_url: pinData.image_url,
    thumbnail_url: pinData.thumbnail_url || pinData.image_url,
    category: pinData.category || 'BGMI',
    tags: pinData.tags || 'Pinterest, BGMI, PUBG, Imported',
    resolution: pinData.resolution || '4K',
    orientation: pinData.orientation || 'Landscape',
    file_size: pinData.file_size || '4.5 MB',
    file_format: 'JPG',
    view_count: 1,
    download_count: 0,
    likes_count: 1,
    featured: false,
    source: 'Pinterest Import',
    pinterest_url: pinData.pinterest_url || pinData.image_url,
    author: pinData.author || '@PinterestUser',
    is_pinterest: true,
    created_at: new Date().toISOString()
  };

  const updated = [newPin, ...custom];
  try {
    localStorage.setItem(CUSTOM_PINS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return newPin;
}

export async function getMediaAssets(params = {}) {
  const queryParts = [];
  if (params.category && params.category !== 'All') queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.resolution && params.resolution !== 'All') queryParts.push(`resolution=${encodeURIComponent(params.resolution)}`);
  if (params.orientation && params.orientation !== 'All') queryParts.push(`orientation=${encodeURIComponent(params.orientation)}`);
  if (params.sort) queryParts.push(`sort=${encodeURIComponent(params.sort)}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.featured !== undefined) queryParts.push(`featured=${params.featured}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const data = await fetchJson(`/media${queryString}`);

  if (data && data.data && data.data.length > 0) {
    return data;
  }

  // Fallback / Standalone mode with Pinterest curated assets + custom pins
  const customPins = getCustomImportedPins();
  let pool = [...customPins, ...PINTEREST_MEDIA_ASSETS];

  // Filter by category
  if (params.category && params.category !== 'All') {
    pool = pool.filter(item => item.category.toLowerCase() === params.category.toLowerCase());
  }

  // Filter by resolution
  if (params.resolution && params.resolution !== 'All') {
    pool = pool.filter(item => (item.resolution || '').toLowerCase() === params.resolution.toLowerCase());
  }

  // Filter by orientation
  if (params.orientation && params.orientation !== 'All') {
    pool = pool.filter(item => (item.orientation || '').toLowerCase() === params.orientation.toLowerCase());
  }

  // Filter by search
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    pool = pool.filter(item => 
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.tags && item.tags.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  }

  // Filter by featured
  if (params.featured !== undefined) {
    pool = pool.filter(item => Boolean(item.featured) === Boolean(params.featured));
  }

  // Sort
  if (params.sort === 'popular' || params.sort === 'views') {
    pool.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  } else if (params.sort === 'downloads') {
    pool.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
  } else if (params.sort === 'likes') {
    pool.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
  } else if (params.sort === 'resolution') {
    pool.sort((a, b) => (b.width || 0) - (a.width || 0));
  }

  const page = params.page || 1;
  const limit = params.limit || 24;
  const total = pool.length;
  const total_pages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;
  const paginated = pool.slice(offset, offset + limit);

  return {
    total,
    page,
    limit,
    total_pages,
    data: paginated
  };
}

export async function getFeaturedMedia() {
  const data = await fetchJson('/media/featured');
  if (data && data.length > 0) return data;
  return PINTEREST_MEDIA_ASSETS.filter(item => item.featured).slice(0, 3);
}

export async function getMediaCategories() {
  const data = await fetchJson('/media/categories');
  if (data && data.length > 0) return data;
  
  // Compute category counts from pool
  const counts = {};
  PINTEREST_MEDIA_ASSETS.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  return Object.keys(counts).map(cat => ({
    name: cat,
    count: counts[cat]
  }));
}

export async function getMediaDetail(mediaId) {
  const data = await fetchJson(`/media/${encodeURIComponent(mediaId)}`);
  if (data) return data;
  return PINTEREST_MEDIA_ASSETS.find(m => m.media_id === mediaId) || null;
}

export async function createMediaAsset(payload) {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend offline, saving to custom pins locally');
    return importPinterestPin(payload);
  }
}

export async function incrementMediaView(mediaId) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/media/${encodeURIComponent(mediaId)}/view`, {
      method: 'POST'
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function downloadMediaAsset(mediaId) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/media/${encodeURIComponent(mediaId)}/download`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    const item = PINTEREST_MEDIA_ASSETS.find(m => m.media_id === mediaId);
    return {
      download_url: item?.image_url || '',
      filename: `${(item?.title || 'BGMI_Asset').replace(/\s+/g, '_')}_4K.png`
    };
  }
}

// ==========================================================================
// INTERACTIVE TACTICAL MAPS API CLIENT
// ==========================================================================

const FALLBACK_MAPS = [
  {
    id: 'erangel',
    map_id: 'erangel',
    name: 'Erangel',
    slug: 'erangel',
    description: 'The original 8x8 km battleground. Balanced terrain of forests, farmlands, urban centers, and a southern military island separated by strategic river channels.',
    image: '/map_erangel.png',
    image_url: '/map_erangel.png',
    dimensions: { width: 2048, height: 2048 },
    width: 2048,
    height: 2048,
    size: '8x8 km',
    size_km: '8x8 km',
    version: 'v3.2 (Current BGMI)',
    available_layers: [
      { id: 'erangel_vehicle', name: 'Vehicle Spawns', type: 'vehicle', icon: 'car', enabled: true, display_order: 1 },
      { id: 'erangel_boat', name: 'Boat Spawns', type: 'boat', icon: 'ship', enabled: true, display_order: 2 },
      { id: 'erangel_location', name: 'Locations & Towns', type: 'location', icon: 'map-pin', enabled: true, display_order: 3 },
      { id: 'erangel_drop', name: 'Esports Drop Zones', type: 'drop', icon: 'shield', enabled: true, display_order: 4 }
    ]
  },
  {
    id: 'miramar',
    map_id: 'miramar',
    name: 'Miramar',
    slug: 'miramar',
    description: 'Vast 8x8 km desert battleground characterized by rugged canyons, high ridges, and open compound warfare with extreme sniper sightlines.',
    image: '/map_miramar.png',
    image_url: '/map_miramar.png',
    dimensions: { width: 2048, height: 2048 },
    width: 2048,
    height: 2048,
    size: '8x8 km',
    size_km: '8x8 km',
    version: 'v3.2 (Current BGMI)',
    available_layers: [
      { id: 'miramar_vehicle', name: 'Vehicle Spawns', type: 'vehicle', icon: 'car', enabled: true, display_order: 1 },
      { id: 'miramar_boat', name: 'Boat Spawns', type: 'boat', icon: 'ship', enabled: true, display_order: 2 },
      { id: 'miramar_location', name: 'Locations & Towns', type: 'location', icon: 'map-pin', enabled: true, display_order: 3 },
      { id: 'miramar_drop', name: 'Esports Drop Zones', type: 'drop', icon: 'shield', enabled: true, display_order: 4 }
    ]
  },
  {
    id: 'rondo',
    map_id: 'rondo',
    name: 'Rondo',
    slug: 'rondo',
    description: 'Dual-themed 8x8 km battleground blending tranquil traditional bamboo gardens in the southwest with dense, towering futuristic metropolitan skyscrapers in the northeast.',
    image: '/map_rondo.png',
    image_url: '/map_rondo.png',
    dimensions: { width: 2048, height: 2048 },
    width: 2048,
    height: 2048,
    size: '8x8 km',
    size_km: '8x8 km',
    version: 'v3.2 (Current BGMI)',
    available_layers: [
      { id: 'rondo_vehicle', name: 'Vehicle Spawns', type: 'vehicle', icon: 'car', enabled: true, display_order: 1 },
      { id: 'rondo_boat', name: 'Boat Spawns', type: 'boat', icon: 'ship', enabled: true, display_order: 2 },
      { id: 'rondo_location', name: 'Locations & Towns', type: 'location', icon: 'map-pin', enabled: true, display_order: 3 },
      { id: 'rondo_drop', name: 'Esports Drop Zones', type: 'drop', icon: 'shield', enabled: true, display_order: 4 }
    ]
  }
];

export async function getMaps() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${API_BASE_URL}/maps`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data && data.length > 0) ? data : FALLBACK_MAPS;
  } catch (err) {
    console.warn('[API] Maps offline fallback:', err.message);
    return FALLBACK_MAPS;
  }
}

export async function getMapMarkers(mapId, layers) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const query = layers ? `?layers=${encodeURIComponent(layers)}` : '';
    const res = await fetch(`${API_BASE_URL}/maps/${encodeURIComponent(mapId)}/markers${query}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] Failed to fetch markers for map ${mapId}:`, err.message);
    return [];
  }
}

export async function createMapMarker(mapId, payload) {
  const res = await fetch(`${API_BASE_URL}/maps/${encodeURIComponent(mapId)}/markers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Role': 'admin'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(errData.detail || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function updateMapMarker(markerId, payload) {
  const res = await fetch(`${API_BASE_URL}/maps/markers/${encodeURIComponent(markerId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Role': 'admin'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(errData.detail || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function deleteMapMarker(markerId) {
  const res = await fetch(`${API_BASE_URL}/maps/markers/${encodeURIComponent(markerId)}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Role': 'admin'
    }
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(errData.detail || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function bulkImportMapMarkers(mapId, format, data) {
  const res = await fetch(`${API_BASE_URL}/maps/${encodeURIComponent(mapId)}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Role': 'admin'
    },
    body: JSON.stringify({
      format: format,
      raw_data: typeof data === 'string' ? data : JSON.stringify(data)
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(errData.detail || `HTTP ${res.status}`);
  }
  return await res.json();
}
