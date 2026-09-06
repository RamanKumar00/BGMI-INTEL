import React, { useEffect, useState } from 'react';
import { 
  X, Download, Share2, Eye, Sparkles, Tag, 
  ChevronLeft, ChevronRight, Bookmark, ExternalLink 
} from 'lucide-react';
import { incrementMediaView, downloadMediaAsset, isPinSaved, toggleSavePin } from '../services/api';

export default function MediaPreviewModal({ item, mediaList = [], onClose, onSelectMedia, onSaveToggle }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (item?.media_id) {
      incrementMediaView(item.media_id);
      setSaved(isPinSaved(item.media_id));
    }
  }, [item?.media_id]);

  if (!item) return null;

  const currentIndex = mediaList.findIndex(m => m.media_id === item.media_id);
  
  const handlePrev = () => {
    if (mediaList.length > 1 && currentIndex > 0) {
      onSelectMedia(mediaList[currentIndex - 1]);
    } else if (mediaList.length > 1 && currentIndex === 0) {
      onSelectMedia(mediaList[mediaList.length - 1]);
    }
  };

  const handleNext = () => {
    if (mediaList.length > 1 && currentIndex < mediaList.length - 1) {
      onSelectMedia(mediaList[currentIndex + 1]);
    } else if (mediaList.length > 1 && currentIndex === mediaList.length - 1) {
      onSelectMedia(mediaList[0]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, mediaList, onClose]);

  const handleDownload = async () => {
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
    } catch (e) {
      window.open(item.image_url, '_blank');
    }
  };

  const handleShare = () => {
    const shareUrl = item.pinterest_url || item.image_url;
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description || `Check out this BGMI/PUBG visual pin: ${item.title}`,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Media / Pinterest link copied to clipboard!');
    }
  };

  const handleSaveClick = () => {
    const newState = toggleSavePin(item);
    setSaved(newState);
    if (onSaveToggle) onSaveToggle(item.media_id, newState);
  };

  const pinterestSearchUrl = item.pinterest_url || `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(item.title + ' BGMI PUBG')}`;
  const tagList = item.tags ? item.tags.split(',').map(t => t.trim()) : [];

  return (
    <div className="db-modal-overlay media-lightbox-overlay" onClick={onClose}>
      <div className="db-modal-content media-lightbox-content" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button className="db-modal-close" onClick={onClose} aria-label="Close Lightbox">
          <X size={24} />
        </button>

        {/* Previous Button */}
        {mediaList.length > 1 && (
          <button className="media-lightbox-nav media-lightbox-prev" onClick={handlePrev} title="Previous Asset (Left Arrow)">
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Next Button */}
        {mediaList.length > 1 && (
          <button className="media-lightbox-nav media-lightbox-next" onClick={handleNext} title="Next Asset (Right Arrow)">
            <ChevronRight size={28} />
          </button>
        )}

        <div className="media-lightbox-grid">
          {/* Left: High-Res Image Viewport */}
          <div className="media-lightbox-viewport">
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="media-lightbox-img"
              loading="eager"
            />
            {item.featured && (
              <div className="media-lightbox-badge-featured">
                <Sparkles size={14} /> FEATURED ASSET
              </div>
            )}
            
            {/* Pinterest Source Tag */}
            <div className="media-lightbox-badge-pinterest">
              <span className="pinterest-p-icon">P</span>
              <span>Pinterest Curated</span>
            </div>
          </div>

          {/* Right: Metadata Sidebar */}
          <div className="media-lightbox-sidebar">
            <div className="media-lightbox-header">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="media-lightbox-category">{item.category}</span>
                {item.author && <span className="text-xs text-gray-400 font-mono">{item.author}</span>}
              </div>
              <h2 className="media-lightbox-title">{item.title}</h2>
              {item.description && <p className="media-lightbox-desc">{item.description}</p>}
            </div>

            {/* Quick Action Buttons */}
            <div className="media-lightbox-actions">
              <button 
                type="button" 
                className="media-lightbox-btn-download"
                onClick={handleDownload}
              >
                <Download size={18} />
                <span>DOWNLOAD IMAGE</span>
              </button>

              {/* Save Pin Bookmark */}
              <button 
                type="button" 
                className={`media-lightbox-btn-save ${saved ? 'active' : ''}`}
                onClick={handleSaveClick}
                title={saved ? 'Remove from Saved Pins' : 'Save Pin to My Collection'}
              >
                <Bookmark size={18} fill={saved ? '#e60023' : 'none'} color={saved ? '#e60023' : 'currentColor'} />
                <span>{saved ? 'SAVED' : 'SAVE PIN'}</span>
              </button>

              {/* View on Pinterest External Link */}
              <a 
                href={pinterestSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="media-lightbox-btn-pinterest"
                title="Open and explore more on Pinterest"
              >
                <span className="pinterest-p-icon-sm">P</span>
                <span>PINTEREST</span>
                <ExternalLink size={14} />
              </a>

              <button 
                type="button" 
                className="media-lightbox-btn-share"
                onClick={handleShare}
                title="Share or copy link"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Technical Specifications Specs Grid */}
            <div className="media-specs-card">
              <h4 className="media-specs-heading">ASSET SPECIFICATIONS</h4>
              <div className="media-specs-grid">
                <div className="media-spec-item">
                  <span className="media-spec-label">RESOLUTION</span>
                  <span className="media-spec-val text-orange-400 font-bold">{item.resolution || '4K'}</span>
                </div>
                <div className="media-spec-item">
                  <span className="media-spec-label">DIMENSIONS</span>
                  <span className="media-spec-val">{item.width || 3840} x {item.height || 2160} px</span>
                </div>
                <div className="media-spec-item">
                  <span className="media-spec-label">ORIENTATION</span>
                  <span className="media-spec-val">{item.orientation || 'Landscape'}</span>
                </div>
                <div className="media-spec-item">
                  <span className="media-spec-label">FILE SIZE</span>
                  <span className="media-spec-val">{item.file_size || '3.2 MB'}</span>
                </div>
                <div className="media-spec-item">
                  <span className="media-spec-label">FORMAT</span>
                  <span className="media-spec-val">{item.file_format || 'PNG'}</span>
                </div>
                <div className="media-spec-item">
                  <span className="media-spec-label">LICENSE</span>
                  <span className="media-spec-val">{item.license || 'Editorial'}</span>
                </div>
              </div>
            </div>

            {/* Analytics Stats */}
            <div className="media-analytics-row">
              <div className="media-analytic-box">
                <Eye size={16} className="text-blue-400" />
                <span>{item.view_count || 0} Views</span>
              </div>
              <div className="media-analytic-box">
                <Download size={16} className="text-green-400" />
                <span>{item.download_count || 0} Downloads</span>
              </div>
            </div>

            {/* Tags Section */}
            {tagList.length > 0 && (
              <div className="media-tags-section">
                <h4 className="media-specs-heading flex items-center gap-1.5">
                  <Tag size={14} className="text-orange-400" /> TAGS
                </h4>
                <div className="media-tags-wrapper">
                  {tagList.map((tag, idx) => (
                    <span key={idx} className="media-tag-pill">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
