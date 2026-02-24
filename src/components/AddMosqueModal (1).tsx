import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, MapPin, Utensils } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Mosque } from '@/data/mosques';

interface AddMosqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mosque: Mosque) => void;
}

export function AddMosqueModal({ isOpen, onClose, onAdd }: AddMosqueModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    has_biryani: false,
    menu_items: '',
    latitude: '',
    longitude: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      alert('Supabase is not configured!');
      return;
    }

    setLoading(true);
    try {
      const menuItemsArray = formData.menu_items.split(',').map(item => item.trim()).filter(Boolean);
      
      const newMosque = {
        name: formData.name,
        location: formData.location,
        has_biryani: formData.has_biryani,
        menu_items: menuItemsArray,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        true_count: 0,
        fake_count: 0
      };

      const { data, error } = await supabase
        .from('mosques')
        .insert([newMosque])
        .select()
        .single();

      if (error) throw error;

      onAdd(data as Mosque);
      onClose();
      setFormData({
        name: '',
        location: '',
        has_biryani: false,
        menu_items: '',
        latitude: '',
        longitude: ''
      });
    } catch (error: any) {
      console.error('Error adding mosque:', error);
      alert(`Error adding mosque: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-zinc-800 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">নতুন তথ্য যোগ করুন</h2>
              <button onClick={onClose} className="p-1 hover:bg-zinc-700 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">মসজিদের নাম</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition-all"
                  placeholder="যেমন: কান্দিরপাড় জামে মসজিদ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">এলাকা</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      required
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full pl-9 p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-500 outline-none"
                      placeholder="যেমন: কান্দিরপাড়"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">বিরিয়ানি আছে?</label>
                  <select
                    value={formData.has_biryani ? 'yes' : 'no'}
                    onChange={e => setFormData({...formData, has_biryani: e.target.value === 'yes'})}
                    className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-500 outline-none"
                  >
                    <option value="no">না</option>
                    <option value="yes">হ্যাঁ</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">ইফতার মেনু (কমা দিয়ে লিখুন)</label>
                <div className="relative">
                  <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    required
                    type="text"
                    value={formData.menu_items}
                    onChange={e => setFormData({...formData, menu_items: e.target.value})}
                    className="w-full pl-9 p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-500 outline-none"
                    placeholder="যেমন: ছোলা, মুড়ি, খেজুর, জিলাপি"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Latitude</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={e => setFormData({...formData, latitude: e.target.value})}
                    className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-500 outline-none"
                    placeholder="23.4606"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Longitude</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={e => setFormData({...formData, longitude: e.target.value})}
                    className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-500 outline-none"
                    placeholder="91.1809"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-800 hover:bg-zinc-900 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'তথ্য জমা দিন'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
