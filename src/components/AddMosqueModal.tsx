import { useState } from 'react';
import { X } from 'lucide-react';

export function AddMosqueModal({ isOpen, onClose, onAdd }: any) {
  // মেনু, lat, lng বাদ দিয়ে শুধুমাত্র প্রয়োজনীয় স্টেট রাখা হয়েছে
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // App.tsx এর handleAddMosque ফাংশনে ডেটা পাঠানো হচ্ছে
    await onAdd(formData);
    
    setIsSubmitting(false);
    setFormData({ name: '', location: '' }); // ফর্ম ক্লিয়ার করা
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md relative shadow-xl">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-zinc-800">নতুন ইফতার আয়োজন যোগ করুন</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">মসজিদের নাম</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="যেমন: কান্দিরপাড় কেন্দ্রীয় জামে মসজিদ"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">ঠিকানা বা এলাকা</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="যেমন: কান্দিরপাড়, কুমিল্লা"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'সেভ হচ্ছে...' : 'তথ্য যোগ করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}
