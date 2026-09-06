import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, Download, Eye, Sparkles, Image as ImageIcon, 
  Upload, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Bookmark, ExternalLink, Flame, Compass, FolderHeart, Plus
} from 'lucide-react';

import { 
  getMediaAssets, 
  getFeaturedMedia, 
  getMediaCategories, 
  downloadMediaAsset,
  getSavedPins,
  isPinSaved,
  toggleSavePin 
} from '../services/api';
import { 
  PINTEREST_TRENDING_CHIPS, 
  PINTEREST_BOARDS, 
  PINTEREST_MEDIA_ASSETS 
} from '../data/pinterestMediaData';
import MediaPreviewModal from './MediaPreviewModal';
import MediaAdminModal from './MediaAdminModal';

const CATEGORIES = ['All', 'Wallpapers', 'BGMI', 'Players', 'Teams', 'Esports'];
const RESOLUTIONS = ['All', '4K', '2K', 'Full HD', 'HD'];
const ORIENTATIONS = ['All', 'Landscape', 'Portrait', 'Square'];
const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest First' },
  { id: 'downloads', label: 'Most Downloaded' },
  { id: 'resolution', label: 'Highest Resolution' },
  { id: 'oldest', label: 'Oldest First' }
];

export default function MediaHubView() {
  // Navigation View: 'pinterest' (Pinterest Stream) | 'curated' (Intel Curated) | 'saved' (My Saved Pins)
  const [activeTab, setActiveTab] = useState('pinterest');

  const [mediaList, setMediaList] = useState([]);
  const [featuredList, setFeaturedList] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [savedPinsCount, setSavedPinsCount] = useState(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedResolution, setSelectedResolution] = useState('All');
  const [selectedOrientation, setSelectedOrientation] = useState('All');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [activeChipId, setActiveChipId] = useState('all');

  // Modals state
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync saved count
  const refreshSavedCount = useCallback(() => {
    const saved = getSavedPins();
    setSavedPinsCount(saved.length);
  }, []);

  useEffect(() => {
    refreshSavedCount();
  }, [refreshSavedCount]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 250);
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

  // Fetch Media Assets based on mode, filters, and pagination
  const fetchMedia = useCallback(async () => {
    setLoading(true);

    if (activeTab === 'saved') {
      // Load directly from saved pins localStorage
      let saved = getSavedPins();
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        saved = saved.filter(item => 
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.tags && item.tags.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q))
        );
      }
      setMediaList(saved);
      setTotalCount(saved.length);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    const res = await getMediaAssets({
      category: selectedCategory,
      resolution: selectedResolution,
      orientation: selectedOrientation,
      sort: selectedSort,
      search: debouncedSearch,
      page: page,
      limit: 16
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
  }, [activeTab, selectedCategory, selectedResolution, selectedOrientation, selectedSort, debouncedSearch, page]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSelectedResolution('All');
    setSelectedOrientation('All');
    setSelectedSort('popular');
    setActiveChipId('all');
    setPage(1);
  };

  const handleChipClick = (chip) => {
    setActiveChipId(chip.id);
    if (chip.id === 'all') {
      handleClearFilters();
    } else if (chip.id === 'wallpapers') {
      setSelectedCategory('Wallpapers');
      setSearchQuery('');
    } else if (chip.id === 'xsuits') {
      setSelectedCategory('BGMI');
      setSearchQuery('X-Suit');
    } else if (chip.id === 'glacier') {
      setSelectedCategory('BGMI');
      setSearchQuery('Glacier');
    } else if (chip.id === 'jonathan') {
      setSelectedCategory('Players');
      setSearchQuery('Jonathan');
    } else if (chip.id === 'crests') {
      setSelectedCategory('Teams');
      setSearchQuery('');
    } else if (chip.id === 'avatars') {
      setSelectedCategory('BGMI');
      setSearchQuery('Avatar');
    } else if (chip.id === 'erangel') {
      setSelectedCategory('Wallpapers');
      setSearchQuery('Erangel');
    }
    setPage(1);
  };

  const handleSavePinToggle = (e, item) => {
    e.stopPropagation();
    toggleSavePin(item);
    refreshSavedCount();
    // If currently in saved tab, immediately update state
    if (activeTab === 'saved') {
      fetchMedia();
    } else {
      // Force re-render of button
      setMediaList(prev => [...prev]);
    }
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

  const getExternalPinterestSearchUrl = () => {
    const q = searchQuery.trim() || (selectedCategory !== 'All' ? `${selectedCategory} BGMI PUBG` : 'BGMI PUBG mobile 4k aesthetic wallpaper');
    return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`;
  };

  return (
    <div className="db-subview-container media-hub-pinterest-view">
      {/* Hero Header Banner with Pinterest Integration */}
      <div className="media-hub-hero media-pinterest-hero">
        <div className="media-hub-hero-content">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="media-badge-pinterest">
              <span className="pinterest-p-icon-sm">P</span>
              PINTEREST POWERED
            </span>
            <span className="text-xs text-orange-400 font-mono tracking-widest uppercase">
              • BGMI & PUBG VISUAL REPOSITORY
            </span>
          </div>

          <h1 className="db-subview-title media-hero-title">
            BGMI & PUBG <span>MEDIA CORNER</span>
          </h1>
          <p className="db-subview-subtitle max-w-3xl">
            Discover thousands of Pinterest-trending BGMI & PUBG Mobile 4K wallpapers, mythic X-Suits, 
            M416 Glacier gun lab skins, esports team crests, and high-contrast gamer avatars.
          </p>

          {/* Master Search Bar + External Pinterest Launcher */}
          <div className="media-search-composite-row">
            <div className="media-search-bar-wrapper">
              <Search className="media-search-icon" size={20} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pins: M416 Glacier, Pharaoh X-Suit, Jonathan 4K, Erangel sunset, AMOLED lockscreen..." 
                className="media-search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="media-search-clear" aria-label="Clear Search">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Direct 1-Click Pinterest External Launcher */}
            <a 
              href={getExternalPinterestSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="media-btn-pinterest-launch"
              title="Search this query directly on Pinterest in a new tab"
            >
              <span className="pinterest-p-icon">P</span>
              <span className="hidden sm:inline">Search on Pinterest</span>
              <ExternalLink size={15} />
            </a>
          </div>
        </div>

        {/* Action Button: Add/Import Pin */}
        <div className="media-hero-actions">
          <button 
            type="button" 
            className="media-btn-upload-trigger media-btn-pinterest-import"
            onClick={() => setShowAdminModal(true)}
            title="Import from Pinterest URL or upload new asset"
          >
            <Plus size={18} />
            <span>ADD / IMPORT PIN</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs Switcher */}
      <div className="media-nav-tabs-bar">
        <div className="media-nav-tabs-group">
          <button
            type="button"
            className={`media-nav-tab ${activeTab === 'pinterest' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pinterest'); setPage(1); }}
          >
            <Compass size={16} className="text-red-400" />
            <span>Pinterest Stream & Explorer</span>
          </button>

          <button
            type="button"
            className={`media-nav-tab ${activeTab === 'curated' ? 'active' : ''}`}
            onClick={() => { setActiveTab('curated'); setPage(1); }}
          >
            <Sparkles size={16} className="text-orange-400" />
            <span>Intel Curated Hub</span>
          </button>

          <button
            type="button"
            className={`media-nav-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => { setActiveTab('saved'); setPage(1); }}
          >
            <Bookmark size={16} className="text-yellow-400" />
            <span>My Saved Pins</span>
            {savedPinsCount > 0 && (
              <span className="media-tab-badge-saved">{savedPinsCount}</span>
            )}
          </button>
        </div>

        {/* Quick External Pinterest Hub Link */}
        <a 
          href="https://www.pinterest.com/search/pins/?q=BGMI%20PUBG%20mobile%204k%20wallpaper"
          target="_blank" 
          rel="noopener noreferrer" 
          className="media-pinterest-external-link"
        >
          <span>Explore Pinterest.com</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Trending Pinterest Topics Chips Bar */}
      {activeTab !== 'saved' && (
        <div className="media-trending-chips-wrapper">
          <div className="media-trending-chips-label">
            <Flame size={14} className="text-red-400 inline mr-1" />
            <span>TRENDING PINS:</span>
          </div>
          <div className="media-trending-chips-scroll">
            {PINTEREST_TRENDING_CHIPS.map(chip => (
              <button
                key={chip.id}
                type="button"
                className={`media-chip-btn ${activeChipId === chip.id ? 'active' : ''}`}
                onClick={() => handleChipClick(chip)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Curated Pinterest Boards Quick Showcase */}
      {activeTab === 'pinterest' && !debouncedSearch && selectedCategory === 'All' && (
        <div className="media-boards-section">
          <div className="media-section-header">
            <div className="flex items-center gap-2">
              <span className="pinterest-p-icon-sm">P</span>
              <h2 className="media-section-title">FEATURED PINTEREST BOARDS</h2>
            </div>
            <span className="text-xs text-gray-400">Curated collections with thousands of BGMI & PUBG visual ideas</span>
          </div>

          <div className="media-boards-grid">
            {PINTEREST_BOARDS.map((board) => (
              <a 
                key={board.id} 
                href={board.pinterestUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="media-board-card group"
              >
                <div className="media-board-img-wrapper">
                  <img src={board.coverImage} alt={board.title} className="media-board-img" />
                  <div className="media-board-overlay">
                    <span className="media-board-btn-open">
                      <span>Explore Board</span>
                      <ExternalLink size={14} />
                    </span>
                  </div>
                </div>
                <div className="media-board-info">
                  <h3 className="media-board-title">{board.title}</h3>
                  <div className="media-board-meta">
                    <span>{board.pinsCount}</span>
                    <span>•</span>
                    <span>{board.followers}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Featured Spotlight Banner Section (for Curated Hub) */}
      {activeTab === 'curated' && featuredList.length > 0 && !debouncedSearch && (
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
                className="media-featured-card group cursor-pointer"
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
      {activeTab !== 'saved' && (
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
              <SlidersHorizontal size={14} className="text-red-400" />
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
      )}

      {/* Active Filter Indicators & Result Count */}
      <div className="media-status-row">
        <div className="text-xs text-gray-400 font-mono">
          {activeTab === 'saved' ? (
            <span>You have <strong className="text-yellow-400">{savedPinsCount}</strong> saved pins</span>
          ) : (
            <span>Showing <strong className="text-white">{mediaList.length}</strong> of <strong className="text-red-400">{totalCount}</strong> visual assets</span>
          )}
        </div>
        {(selectedCategory !== 'All' || selectedResolution !== 'All' || selectedOrientation !== 'All' || debouncedSearch) && activeTab !== 'saved' && (
          <button 
            onClick={handleClearFilters}
            className="text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Main Responsive Pinterest-Style Masonry Image Gallery Grid */}
      {loading ? (
        <div className="media-grid-skeleton">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="media-skeleton-card animate-pulse" />
          ))}
        </div>
      ) : mediaList.length === 0 ? (
        /* Empty State */
        <div className="media-empty-state">
          {activeTab === 'saved' ? (
            <>
              <Bookmark size={64} className="text-gray-600 mb-3" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">NO SAVED PINS YET</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-md text-center">
                Click the red <strong>SAVE</strong> button on any BGMI or PUBG pin in the Pinterest Stream to bookmark it here.
              </p>
              <button 
                type="button" 
                onClick={() => setActiveTab('pinterest')}
                className="mt-4 px-5 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
              >
                EXPLORE PINTEREST STREAM
              </button>
            </>
          ) : (
            <>
              <ImageIcon size={64} className="text-gray-600 mb-3 animate-bounce" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">NO MEDIA FOUND</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-md text-center">
                No pins match your current search query. Try searching directly on Pinterest!
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={handleClearFilters}
                  className="px-5 py-2 rounded-lg bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors"
                >
                  RESET FILTERS
                </button>
                <a 
                  href={getExternalPinterestSearchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center gap-1.5"
                >
                  <span className="pinterest-p-icon-sm">P</span>
                  <span>SEARCH ON PINTEREST</span>
                </a>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Masonry Image Gallery with Authentic Pinterest Card UX */
        <div className="media-gallery-grid media-pinterest-masonry">
          {mediaList.map((item) => {
            const isSaved = isPinSaved(item.media_id);
            const pinSearchUrl = item.pinterest_url || `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(item.title + ' BGMI PUBG')}`;

            return (
              <div 
                key={item.media_id} 
                className="media-gallery-card group"
                onClick={() => setSelectedMedia(item)}
              >
                {/* Image Asset Viewport */}
                <div className="media-gallery-img-wrapper">
                  <img 
                    src={item.thumbnail_url || item.image_url} 
                    alt={item.title} 
                    className="media-gallery-img"
                    loading="lazy"
                  />
                  
                  {/* Resolution Badge */}
                  <span className="media-badge-res">{item.resolution || '4K'}</span>

                  {/* Pinterest Brand Tag */}
                  <span className="media-card-pin-badge">
                    <span className="pinterest-p-icon-sm">P</span>
                    <span>Pin</span>
                  </span>

                  {/* Hover Overlay Card Actions with Signature Pinterest Save Button */}
                  <div className="media-gallery-hover-overlay">
                    {/* Top Row: Save Pin Pill */}
                    <div className="media-card-hover-top">
                      <button 
                        type="button" 
                        className={`media-card-save-pill ${isSaved ? 'saved' : ''}`}
                        onClick={(e) => handleSavePinToggle(e, item)}
                        title={isSaved ? 'Remove from Saved' : 'Save Pin to My Collection'}
                      >
                        <Bookmark size={14} fill={isSaved ? 'white' : 'none'} />
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    {/* Bottom Row: View, Pinterest External, Download */}
                    <div className="media-card-hover-bottom">
                      <button 
                        type="button" 
                        className="media-hover-btn media-hover-btn-view"
                        onClick={(e) => { e.stopPropagation(); setSelectedMedia(item); }}
                        title="View Full Resolution"
                      >
                        <Eye size={15} /> VIEW
                      </button>

                      <a 
                        href={pinSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="media-hover-btn media-hover-btn-pin"
                        onClick={(e) => e.stopPropagation()}
                        title="Open on Pinterest"
                      >
                        <span className="pinterest-p-icon-sm">P</span>
                        <ExternalLink size={13} />
                      </a>

                      <button 
                        type="button" 
                        className="media-hover-btn media-hover-btn-dl"
                        onClick={(e) => handleQuickDownload(e, item)}
                        title="Quick Download 4K Asset"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Asset Information Footer */}
                <div className="media-gallery-info">
                  <div className="flex items-center justify-between mb-1">
                    <span className="media-card-cat-tag">{item.category}</span>
                    {item.author && (
                      <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                        {item.author}
                      </span>
                    )}
                  </div>
                  <h4 className="media-card-title">{item.title}</h4>
                  <div className="media-card-stats-row">
                    <span><Eye size={12} className="inline mr-1" />{item.view_count || 0}</span>
                    <span><Download size={12} className="inline mr-1" />{item.download_count || 0}</span>
                    {item.likes_count && (
                      <span className="text-red-400">♥ {item.likes_count}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && activeTab !== 'saved' && (
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
          onSaveToggle={() => {
            refreshSavedCount();
            if (activeTab === 'saved') fetchMedia();
          }}
        />
      )}

      {/* Admin Upload / Pinterest Importer Modal */}
      {showAdminModal && (
        <MediaAdminModal 
          onClose={() => setShowAdminModal(false)}
          onSuccess={() => {
            fetchMedia();
            refreshSavedCount();
          }}
        />
      )}
    </div>
  );
}
