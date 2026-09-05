/**
 * BGMI Intel Backend API Client
 * Connects React frontend to FastAPI backend (http://127.0.0.1:8000/api)
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

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

export async function getMatches() {
  const data = await fetchJson('/matches');
  return data || [];
}

export async function getMatch(matchId) {
  const data = await fetchJson(`/matches/${encodeURIComponent(matchId)}`);
  return data;
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

// ==========================================================================
// MEDIA HUB API CLIENT
// ==========================================================================

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
  return data || { total: 0, page: 1, limit: 24, total_pages: 1, data: [] };
}

export async function getFeaturedMedia() {
  const data = await fetchJson('/media/featured');
  return data || [];
}

export async function getMediaCategories() {
  const data = await fetchJson('/media/categories');
  return data || [];
}

export async function getMediaDetail(mediaId) {
  const data = await fetchJson(`/media/${encodeURIComponent(mediaId)}`);
  return data;
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
    console.error('[API] createMediaAsset error:', err);
    return null;
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
    console.error('[API] downloadMediaAsset error:', err);
    return null;
  }
}


