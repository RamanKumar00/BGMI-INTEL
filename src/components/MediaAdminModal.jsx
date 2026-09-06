import React, { useState } from 'react';
import { X, Upload, Sparkles, CheckCircle, AlertCircle, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { createMediaAsset, importPinterestPin } from '../services/api';

export default function MediaAdminModal({ onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('pinterest'); // 'pinterest' | 'manual'
  
  // Pinterest quick import state
  const [pinUrl, setPinUrl] = useState('');
  const [pinTitle, setPinTitle] = useState('');
  const [pinCategory, setPinCategory] = useState('Wallpapers');
  const [pinTags, setPinTags] = useState('Pinterest, BGMI, PUBG, 4K');
  const [pinAuthor, setPinAuthor] = useState('');

  // Manual form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    thumbnail_url: '',
    category: 'Wallpapers',
    tags: 'Pinterest, Wallpaper, BGMI, PUBG',
    resolution: '4K',
    width: 3840,
    height: 2160,
    orientation: 'Landscape',
    file_size: '4.5 MB',
    file_format: 'PNG',
    featured: false,
    source: 'Pinterest Curated',
    license: 'Free Personal Use'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handlePinterestImport = async (e) => {
    e.preventDefault();
    if (!pinUrl.trim()) {
      setErrorMsg('Please enter a Pinterest Image URL or Pin link.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const title = pinTitle.trim() || 'BGMI / PUBG Pinterest Pin';
    const cleanImageUrl = pinUrl.trim();

    try {
      const newPin = importPinterestPin({
        title: title,
        description: `Curated BGMI & PUBG visual imported from Pinterest. Category: ${pinCategory}`,
        image_url: cleanImageUrl,
        thumbnail_url: cleanImageUrl,
        category: pinCategory,
        tags: pinTags,
        resolution: '4K',
        orientation: 'Landscape',
        author: pinAuthor.trim() ? (pinAuthor.startsWith('@') ? pinAuthor : `@${pinAuthor}`) : '@PinterestCurator',
        pinterest_url: pinUrl.includes('pinterest.com') ? pinUrl : `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(title)}`,
        source: 'Pinterest Import'
      });

      // Also try notifying backend if available
      createMediaAsset(newPin).catch(() => {});

      setIsSubmitting(false);
      setSuccessMsg(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 900);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg('Could not import Pinterest Pin: ' + err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image_url.trim()) {
      setErrorMsg('Title and High-Resolution Image URL are required!');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await createMediaAsset({
      ...formData,
      title: formData.title.trim(),
      image_url: formData.image_url.trim(),
      thumbnail_url: formData.thumbnail_url.trim() || formData.image_url.trim(),
      width: parseInt(formData.width) || 3840,
      height: parseInt(formData.height) || 2160
    });

    setIsSubmitting(false);

    if (result) {
      setSuccessMsg(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 900);
    } else {
      setErrorMsg('Failed to upload media asset. Saved locally to session pins.');
    }
  };

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div className="db-modal-content media-admin-modal-content" onClick={e => e.stopPropagation()}>
        <button className="db-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="media-admin-header">
          <div className="flex items-center gap-2">
            <span className="pinterest-p-badge-large">P</span>
            <h2 className="text-xl font-bold text-white tracking-wide uppercase">ADD BGMI / PUBG MEDIA</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Import trending pins from Pinterest or manually upload 4K visuals into the Media Hub.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="media-admin-tabs mt-3">
            <button
              type="button"
              className={`media-admin-tab-btn ${activeTab === 'pinterest' ? 'active' : ''}`}
              onClick={() => setActiveTab('pinterest')}
            >
              <span className="pinterest-p-icon-sm mr-1">P</span>
              <span>Import from Pinterest</span>
            </button>
            <button
              type="button"
              className={`media-admin-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <Upload size={14} className="mr-1" />
              <span>Manual Uploader</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2 my-3">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-xs flex items-center gap-2 my-3">
            <CheckCircle size={16} />
            <span>Asset successfully added to Media Corner!</span>
          </div>
        )}

        {/* Tab 1: Pinterest Quick Importer */}
        {activeTab === 'pinterest' && (
          <form onSubmit={handlePinterestImport} className="media-admin-form space-y-4 mt-3">
            <div>
              <label className="db-form-label flex items-center justify-between">
                <span>Pinterest Pin or Image URL *</span>
                <a 
                  href="https://www.pinterest.com/search/pins/?q=BGMI%20PUBG%20mobile%204k%20wallpaper" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  Browse Pinterest BGMI Pins <ExternalLink size={12} />
                </a>
              </label>
              <div className="relative">
                <input 
                  type="url"
                  value={pinUrl}
                  onChange={(e) => setPinUrl(e.target.value)}
                  placeholder="https://i.pinimg.com/... or https://pinterest.com/pin/..."
                  className="db-form-input pl-9"
                  required
                />
                <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Tip: Right-click any image on Pinterest and select "Copy image address", then paste it here.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="db-form-label">Pin Title</label>
                <input 
                  type="text"
                  value={pinTitle}
                  onChange={(e) => setPinTitle(e.target.value)}
                  placeholder="e.g. M416 Glacier Level 7 4K Wallpaper"
                  className="db-form-input"
                />
              </div>

              <div>
                <label className="db-form-label">Category</label>
                <select 
                  value={pinCategory} 
                  onChange={(e) => setPinCategory(e.target.value)}
                  className="db-form-select"
                >
                  <option value="Wallpapers">Wallpapers (4K / Phone)</option>
                  <option value="BGMI">BGMI / X-Suits / Skins</option>
                  <option value="Players">Players & Esports Stars</option>
                  <option value="Teams">Teams & Clan Crests</option>
                  <option value="Esports">Esports Tournaments</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="db-form-label">Tags (comma-separated)</label>
                <input 
                  type="text"
                  value={pinTags}
                  onChange={(e) => setPinTags(e.target.value)}
                  placeholder="4K, Glacier, M416, AMOLED"
                  className="db-form-input"
                />
              </div>

              <div>
                <label className="db-form-label">Pinterest Author / Creator</label>
                <input 
                  type="text"
                  value={pinAuthor}
                  onChange={(e) => setPinAuthor(e.target.value)}
                  placeholder="@GamingArt4K"
                  className="db-form-input"
                />
              </div>
            </div>

            {/* Live Image Preview if pinUrl is an image */}
            {pinUrl && pinUrl.startsWith('http') && (
              <div className="pinterest-import-preview-box">
                <span className="text-[11px] text-gray-400 block mb-1">IMAGE PREVIEW:</span>
                <img 
                  src={pinUrl} 
                  alt="Pinterest Preview" 
                  className="pinterest-import-preview-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            <div className="media-admin-actions pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="media-btn-import-pinterest"
              >
                <span className="pinterest-p-icon">P</span>
                <span>{isSubmitting ? 'IMPORTING...' : 'SAVE PIN TO MEDIA CORNER'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Manual Uploader */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSubmit} className="media-admin-form space-y-4 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="db-form-label">Title *</label>
              <input 
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. BGIS 2026 Grand Finals Trophy Lift"
                className="db-form-input"
                required
              />
            </div>

            <div>
              <label className="db-form-label">Category *</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                className="db-form-select"
              >
                <option value="Esports">Esports</option>
                <option value="Teams">Teams</option>
                <option value="Players">Players</option>
                <option value="BGMI">BGMI / Maps</option>
                <option value="Events">Events</option>
                <option value="Wallpapers">Wallpapers</option>
              </select>
            </div>
          </div>

          <div>
            <label className="db-form-label">High-Resolution Image URL *</label>
            <input 
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://cdn.example.com/images/bgmi_4k_asset.png"
              className="db-form-input"
              required
            />
          </div>

          <div>
            <label className="db-form-label">Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the tournament moment or team lineup..."
              className="db-form-textarea"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="db-form-label">Resolution</label>
              <select name="resolution" value={formData.resolution} onChange={handleChange} className="db-form-select">
                <option value="4K">4K Ultra HD</option>
                <option value="2K">2K Quad HD</option>
                <option value="Full HD">Full HD (1080p)</option>
                <option value="HD">HD (720p)</option>
              </select>
            </div>

            <div>
              <label className="db-form-label">Orientation</label>
              <select name="orientation" value={formData.orientation} onChange={handleChange} className="db-form-select">
                <option value="Landscape">Landscape (16:9)</option>
                <option value="Portrait">Portrait (9:16)</option>
                <option value="Square">Square (1:1)</option>
              </select>
            </div>

            <div>
              <label className="db-form-label">Width (px)</label>
              <input type="number" name="width" value={formData.width} onChange={handleChange} className="db-form-input" />
            </div>

            <div>
              <label className="db-form-label">Height (px)</label>
              <input type="number" name="height" value={formData.height} onChange={handleChange} className="db-form-input" />
            </div>
          </div>

          <div>
            <label className="db-form-label">Tags (comma separated)</label>
            <input 
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="BGIS2026, Jonathan, Erangel, 4K, Trophy"
              className="db-form-input"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox"
              id="featured_checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
            />
            <label htmlFor="featured_checkbox" className="text-sm font-semibold text-white flex items-center gap-1 cursor-pointer">
              <Sparkles size={14} className="text-orange-400" /> Feature on Spotlight Carousel Banner
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 font-bold hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-50">
              {isSubmitting ? 'Publishing...' : 'Publish Media Asset'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

