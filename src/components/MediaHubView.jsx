import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, Download, Eye, Sparkles, Image as ImageIcon, 
  Upload, SlidersHorizontal, X, ChevronLeft, ChevronRight
} from 'lucide-react';

import { getMediaAssets, getFeaturedMedia, getMediaCategories, downloadMediaAsset } from '../services/api';
import MediaPreviewModal from './MediaPreviewModal';
import MediaAdminModal from './MediaAdminModal';

const CATEGORIES = ['All', 'Esports', 'Teams', 'Players', 'BGMI', 'Events', 'Wallpapers'];
const RESOLUTIONS = ['All', '4K', '2K', 'Full HD', 'HD'];
const ORIENTATIONS = ['All', 'Landscape', 'Portrait', 'Square'];
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'popular', label: 'Most Viewed' },
  { id: 'downloads', label: 'Most Downloaded' },
  { id: 'resolution', label: 'Highest Resolution' },
  { id: 'oldest', label: 'Oldest First' }
];

export default function MediaHubView() {
  const [mediaList, setMediaList] = useState([]);
  const [featuredList, setFeaturedList] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedResolution, setSelectedResolution] = useState('All');
  const [selectedOrientation, setSelectedOrientation] = useState('All');
  const [selectedSort, setSelectedSort] = useState('newest');

  // Modals state
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load featured spotlight and category counts once
  useEffect(() => {
    async function loadFeaturedAndCategories() {
      const [feat, cats] = await Promise.all([
        getFeaturedMedia(),
        getMediaCategories()
      ]);
      setFeaturedList(feat || []);
      setCategoriesData(cats || []);
    }
    loadFeaturedAndCategories();
  }, []);

  // Fetch Media Assets based on filters and pagination
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    const res = await getMediaAssets({
      category: selectedCategory,
      resolution: selectedResolution,
      orientation: selectedOrientation,
      sort: selectedSort,
      search: debouncedSearch,
      page: page,
      limit: 12
    });

    if (res && res.data) {
      setMediaList(res.data);
      setTotalCount(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } else {
      setMediaList([]);
      setTotalCount(0);
      setTotalPages(1);
    }
    setLoading(false);
  }, [selectedCategory, selectedResolution, selectedOrientation, selectedSort, debouncedSearch, page]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSelectedResolution('All');
    setSelectedOrientation('All');
    setSelectedSort('newest');
    setPage(1);
  };

  const handleQuickDownload = async (e, item) => {
    e.stopPropagation();
    try {
      const res = await downloadMediaAsset(item.media_id);
      const targetUrl = res?.download_url || item.image_url;
      const filename = res?.filename || `${item.title.replace(/\s+/g, '_')}_4K.png`;

      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      window.open(item.image_url, '_blank');
    }
  };

  return (
    <div className="db-subview-container">
      {/* Hero Header Banner */}
      <div className="media-hub-hero">
        <div className="media-hub-hero-content">
          <div className="flex items-center gap-2 mb-2">
            <span className="media-badge-live">BGMI INTEL MEDIA HUB</span>
            <span className="text-xs text-orange-400 font-mono tracking-widest uppercase">• ESPORTS VISUAL REPOSITORY</span>
          </div>
          <h1 className="db-subview-title media-hero-title">
            BGMI <span>MEDIA HUB</span>
          </h1>
          <p className="db-subview-subtitle max-w-3xl">
            Discover high-quality BGMI esports visuals, tournament moments, teams, players, events, maps, and wallpapers.
          </p>

          {/* Master Media Search Input */}
          <div className="media-search-bar-wrapper">
            <Search className="media-search-icon" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search esports moments, player IGN, team names, maps (e.g. BGIS, Jonathan, Erangel 4K)..." 
              className="media-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="media-search-clear" aria-label="Clear Search">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Action Button: Publish Asset */}
        <div className="media-hero-actions">
          <button 
            type="button" 
            className="media-btn-upload-trigger"
            onClick={() => setShowAdminModal(true)}
          >
            <Upload size={18} />
            <span>PUBLISH MEDIA</span>
          </button>
        </div>
      </div>

      {/* Featured Spotlight Banner Section */}
      {featuredList.length > 0 && !debouncedSearch && selectedCategory === 'All' && (
        <div className="media-featured-section">
          <div className="media-section-header">
            <div className="flex items-center gap-2">
              <Sparkles className="text-orange-500" size={20} />
              <h2 className="media-section-title">FEATURED SPOTLIGHT</h2>
            </div>
            <span className="text-xs text-gray-400">Curated high-resolution BGMI tournament moments</span>
          </div>

          <div className="media-featured-grid">
            {featuredList.slice(0, 3).map((item) => (
              <div 
                key={item.media_id} 
                className="media-featured-card group"
                onClick={() => setSelectedMedia(item)}
              >
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  className="media-featured-img group-hover:scale-105 transition-transform duration-500"
                />
                <div className="media-featured-overlay">
                  <div className="flex items-center justify-between mb-2">
                    <span className="media-card-cat-badge">{item.category}</span>
                    <span className="media-card-res-badge">{item.resolution || '4K'}</span>
                  </div>
                  <h3 className="media-featured-card-title">{item.title}</h3>
                  <div className="media-featured-meta">
                    <span><Eye size={12} className="inline mr-1" />{item.view_count || 0} views</span>
                    <span><Download size={12} className="inline mr-1" />{item.download_count || 0} downloads</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Category Controls Bar */}
      <div className="media-controls-bar">
        {/* Category Pills */}
        <div className="media-category-pills">
          {CATEGORIES.map(cat => {
            const countObj = categoriesData.find(c => c.name.toLowerCase() === cat.toLowerCase());
            const count = countObj ? countObj.count : null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
                className={`media-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              >
                <span>{cat}</span>
                {count !== null && <span className="media-cat-count">{cat === 'All' ? totalCount : count}</span>}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Selectors */}
        <div className="media-secondary-filters">
          {/* Resolution Selector */}
          <div className="media-filter-select-box">
            <label className="text-[11px] text-gray-400 uppercase font-mono">Res:</label>
            <select 
              value={selectedResolution} 
              onChange={(e) => { setSelectedResolution(e.target.value); setPage(1); }}
              className="media-filter-select"
            >
              {RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Orientation Selector */}
          <div className="media-filter-select-box">
            <label className="text-[11px] text-gray-400 uppercase font-mono">Ratio:</label>
            <select 
              value={selectedOrientation} 
              onChange={(e) => { setSelectedOrientation(e.target.value); setPage(1); }}
              className="media-filter-select"
            >
              {ORIENTATIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="media-filter-select-box">
            <SlidersHorizontal size={14} className="text-orange-500" />
            <select 
              value={selectedSort} 
              onChange={(e) => { setSelectedSort(e.target.value); setPage(1); }}
              className="media-filter-select"
            >
              {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Indicators & Result Count */}
      <div className="media-status-row">
        <div className="text-xs text-gray-400 font-mono">
          Showing <span className="text-white font-bold">{mediaList.length}</span> of <span className="text-orange-400 font-bold">{totalCount}</span> assets
        </div>
        {(selectedCategory !== 'All' || selectedResolution !== 'All' || selectedOrientation !== 'All' || debouncedSearch) && (
          <button 
            onClick={handleClearFilters}
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold underline cursor-pointer"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Main Responsive Image Gallery Grid */}
      {loading ? (
        <div className="media-grid-skeleton">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="media-skeleton-card animate-pulse" />
          ))}
        </div>
      ) : mediaList.length === 0 ? (
        /* Empty State */
        <div className="media-empty-state">
          <ImageIcon size={64} className="text-gray-600 mb-3 animate-bounce" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wide">NO MEDIA FOUND</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md">
            No BGMI assets match your current search query or active filter parameters.
          </p>
          <button 
            type="button" 
            onClick={handleClearFilters}
            className="mt-4 px-5 py-2 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
          >
            RESET ALL FILTERS
          </button>
        </div>
      ) : (
        /* Masonry Image Gallery */
        <div className="media-gallery-grid">
          {mediaList.map((item) => (
            <div 
              key={item.media_id} 
              className="media-gallery-card group"
              onClick={() => setSelectedMedia(item)}
            >
              {/* Image Asset */}
              <div className="media-gallery-img-wrapper">
                <img 
                  src={item.thumbnail_url || item.image_url} 
                  alt={item.title} 
                  className="media-gallery-img"
                  loading="lazy"
                />
                
                {/* Resolution Badge */}
                <span className="media-badge-res">{item.resolution || '4K'}</span>
                
                {/* Hover Overlay Card Actions */}
                <div className="media-gallery-hover-overlay">
                  <button 
                    type="button" 
                    className="media-hover-btn media-hover-btn-view"
                    onClick={(e) => { e.stopPropagation(); setSelectedMedia(item); }}
                  >
                    <Eye size={16} /> VIEW
                  </button>
                  <button 
                    type="button" 
                    className="media-hover-btn media-hover-btn-dl"
                    onClick={(e) => handleQuickDownload(e, item)}
                    title="Quick Download High-Res Asset"
                  >
                    <Download size={16} /> DOWNLOAD
                  </button>
                </div>
              </div>

              {/* Asset Information Footer */}
              <div className="media-gallery-info">
                <div className="flex items-center justify-between mb-1">
                  <span className="media-card-cat-tag">{item.category}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{item.file_size || 'HD'}</span>
                </div>
                <h4 className="media-card-title">{item.title}</h4>
                <div className="media-card-stats-row">
                  <span><Eye size={12} className="inline mr-1" />{item.view_count || 0}</span>
                  <span><Download size={12} className="inline mr-1" />{item.download_count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="media-pagination-row">
          <button 
            disabled={page === 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="media-page-btn"
          >
            <ChevronLeft size={18} /> Prev
          </button>
          
          <div className="media-page-indicator">
            Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
          </div>

          <button 
            disabled={page >= totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            className="media-page-btn"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {selectedMedia && (
        <MediaPreviewModal 
          item={selectedMedia} 
          mediaList={mediaList}
          onClose={() => setSelectedMedia(null)}
          onSelectMedia={(item) => setSelectedMedia(item)}
        />
      )}

      {/* Admin Upload Modal */}
      {showAdminModal && (
        <MediaAdminModal 
          onClose={() => setShowAdminModal(false)}
          onSuccess={() => fetchMedia()}
        />
      )}
    </div>
  );
}
