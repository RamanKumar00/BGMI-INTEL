import React, { useEffect } from 'react';
import { X, Download, Share2, Eye, Calendar, Sparkles, Tag, ChevronLeft, ChevronRight, Layers, FileText } from 'lucide-react';
import { incrementMediaView, downloadMediaAsset } from '../services/api';

export default function MediaPreviewModal({ item, mediaList = [], onClose, onSelectMedia }) {
  useEffect(() => {
    if (item?.media_id) {
      incrementMediaView(item.media_id);
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

      // Trigger high quality browser download
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
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description || `Check out this BGMI esports asset on BGMI Intel: ${item.title}`,
        url: item.image_url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(item.image_url);
      alert('High-resolution media link copied to clipboard!');
    }
  };

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
          </div>

          {/* Right: Metadata Sidebar */}
          <div className="media-lightbox-sidebar">
            <div className="media-lightbox-header">
              <span className="media-lightbox-category">{item.category}</span>
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
