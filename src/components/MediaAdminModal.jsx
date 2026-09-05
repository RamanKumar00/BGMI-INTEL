import React, { useState } from 'react';
import { X, Upload, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { createMediaAsset } from '../services/api';

export default function MediaAdminModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    thumbnail_url: '',
    category: 'Esports',
    tags: '',
    resolution: '4K',
    width: 3840,
    height: 2160,
    orientation: 'Landscape',
    file_size: '3.5 MB',
    file_format: 'PNG',
    featured: false,
    source: 'BGMI Intel Official Press',
    license: 'Editorial Use Only'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(false);

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
      }, 1200);
    } else {
      setErrorMsg('Failed to upload media asset to server. Please check database connection.');
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
            <Upload className="text-orange-500" size={24} />
            <h2 className="text-xl font-bold text-white tracking-wide uppercase">MEDIA MANAGER UPLOADER</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">Publish high-definition BGMI esports visuals to the public Media Hub.</p>
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
            <span>Asset successfully published to Media Hub!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="media-admin-form space-y-4 mt-4">
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
      </div>
    </div>
  );
}
