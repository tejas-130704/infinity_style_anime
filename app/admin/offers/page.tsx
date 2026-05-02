'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PopupOffer, PopupSettings } from '@/lib/types/offers';
import { Trash2, Edit, Plus, Save } from 'lucide-react';

export default function AdminOffersPage() {
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const [offers, setOffers] = useState<PopupOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    discount_text: '',
    description: '',
    expiry_date: '',
    cta_url: '',
    is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [offersRes, settingsRes] = await Promise.all([
        fetch('/api/admin/offers'),
        fetch('/api/admin/offers/settings'),
      ]);

      if (offersRes.ok) {
        const d = await offersRes.json();
        setOffers(d.offers || []);
      }
      if (settingsRes.ok) {
        const d = await settingsRes.json();
        setSettings(d.settings);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSettingsSave = async () => {
    try {
      const res = await fetch('/api/admin/offers/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_enabled: settings?.is_enabled,
          delay_seconds: settings?.delay_seconds,
        }),
      });
      if (res.ok) toast.success('Settings saved');
      else toast.error('Failed to save settings');
    } catch (e) {
      toast.error('Error saving settings');
    }
  };

  const handleEditClick = (offer: PopupOffer) => {
    setFormData({
      title: offer.title,
      discount_text: offer.discount_text,
      description: offer.description || '',
      expiry_date: new Date(offer.expiry_date).toISOString().slice(0, 16), // datetime-local format
      cta_url: offer.cta_url,
      is_active: offer.is_active,
    });
    setEditingId(offer.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      const res = await fetch(`/api/admin/offers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Offer deleted');
        fetchData();
      } else {
        toast.error('Failed to delete offer');
      }
    } catch (e) {
      toast.error('Error deleting offer');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const payload = editingId ? { ...formData, id: editingId } : formData;
    
    // ensure proper date format for DB
    const finalPayload = {
      ...payload,
      expiry_date: new Date(formData.expiry_date).toISOString(),
    };

    try {
      const res = await fetch('/api/admin/offers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      if (res.ok) {
        toast.success(`Offer ${editingId ? 'updated' : 'created'}`);
        setIsEditing(false);
        setEditingId(null);
        setFormData({
          title: '',
          discount_text: '',
          description: '',
          expiry_date: '',
          cta_url: '',
          is_active: true,
        });
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(`Error: ${errorData.error}`);
      }
    } catch (error) {
      toast.error('Failed to save offer');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Offer Management</h1>

      {/* Global Settings */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-xl mb-10">
        <h2 className="text-xl font-semibold mb-4">Global Popup Settings</h2>
        <div className="flex flex-col sm:flex-row gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Enable Popup System</label>
            <button
              onClick={() => setSettings(s => s ? { ...s, is_enabled: !s.is_enabled } : null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                settings?.is_enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'
              }`}
            >
              {settings?.is_enabled ? 'Enabled (ON)' : 'Disabled (OFF)'}
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Popup Delay (seconds)</label>
            <input
              type="number"
              value={settings?.delay_seconds || 10}
              onChange={(e) => setSettings(s => s ? { ...s, delay_seconds: parseInt(e.target.value) || 0 } : null)}
              className="bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none focus:border-red-500"
            />
          </div>

          <button
            onClick={handleSettingsSave}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            <Save size={18} />
            Save Settings
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Active Offers</h2>
        {!isEditing && (
          <button
            onClick={() => {
              setIsEditing(true);
              setEditingId(null);
              setFormData({ title: '', discount_text: '', description: '', expiry_date: '', cta_url: '', is_active: true });
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Create New Offer
          </button>
        )}
      </div>

      {/* Offer Form */}
      {isEditing && (
        <form onSubmit={handleFormSubmit} className="bg-black/40 border border-white/10 p-6 rounded-xl mb-10 space-y-4">
          <h3 className="text-lg font-medium mb-4">{editingId ? 'Edit Offer' : 'New Offer'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Title (e.g., EXTRA DISCOUNT)</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-black/50 border border-white/20 rounded px-3 py-2 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Discount Text (e.g., 10% OFF)</label>
              <input required value={formData.discount_text} onChange={e => setFormData({...formData, discount_text: e.target.value})} className="bg-black/50 border border-white/20 rounded px-3 py-2 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Description (Optional)</label>
              <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-black/50 border border-white/20 rounded px-3 py-2 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">CTA Redirect URL (e.g. /shop)</label>
              <input type="text" placeholder="/shop" required value={formData.cta_url} onChange={e => setFormData({...formData, cta_url: e.target.value})} className="bg-black/50 border border-white/20 rounded px-3 py-2 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Expiry Date & Time</label>
              <input type="datetime-local" required value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="bg-black/50 border border-white/20 rounded px-3 py-2 text-white" style={{ colorScheme: 'dark' }} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 accent-red-600" />
              <label htmlFor="is_active" className="text-gray-300">Active (Show in carousel)</label>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-white/10">
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium">Save Offer</button>
            <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium">Cancel</button>
          </div>
        </form>
      )}

      {/* Offers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(offer => {
          const isExpired = new Date(offer.expiry_date).getTime() < Date.now();
          return (
            <div key={offer.id} className={`p-5 rounded-xl border ${offer.is_active && !isExpired ? 'border-red-500/50 bg-red-950/10' : 'border-white/10 bg-black/40'} relative`}>
              {!offer.is_active && <span className="absolute top-2 right-2 bg-gray-600 text-xs px-2 py-1 rounded">Inactive</span>}
              {isExpired && <span className="absolute top-2 right-2 bg-yellow-600 text-xs px-2 py-1 rounded">Expired</span>}
              
              <h4 className="font-bold text-lg mb-1">{offer.title}</h4>
              <p className="text-2xl font-black text-red-500 mb-2">{offer.discount_text}</p>
              <p className="text-sm text-gray-400 mb-4 h-10 overflow-hidden">{offer.description}</p>
              
              <div className="text-xs text-gray-500 mb-1">Expires: {new Date(offer.expiry_date).toLocaleString()}</div>
              <div className="text-xs text-blue-400 truncate mb-6" title={offer.cta_url}>URL: {offer.cta_url}</div>
              
              <div className="flex justify-between items-center mt-auto border-t border-white/10 pt-4">
                <button onClick={() => handleEditClick(offer)} className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
                  <Edit size={16} /> Edit
                </button>
                <button onClick={() => handleDelete(offer.id)} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          );
        })}
        {offers.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-500 py-10">No offers found. Create one above.</div>
        )}
      </div>
    </div>
  );
}
