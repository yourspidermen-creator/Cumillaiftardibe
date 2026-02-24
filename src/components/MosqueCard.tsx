import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Check, X, MessageCircle, UtensilsCrossed } from 'lucide-react';
import { Mosque } from '@/data/mosques';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface MosqueCardProps {
  mosque: Mosque;
  onVote: (mosqueId: string, type: 'true' | 'fake') => void;
}

export function MosqueCard({ mosque, onVote }: MosqueCardProps) {
  const [voting, setVoting] = useState<'true' | 'fake' | null>(null);
  const [hasVoted, setHasVoted] = useState<string | null>(() => {
    return localStorage.getItem(`vote_${mosque.id}`);
  });

  const handleVote = async (type: 'true' | 'fake') => {
    if (hasVoted || voting) return;
    setVoting(type);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('votes').insert([
          { mosque_id: mosque.id, vote_type: type }
        ]);
        if (error) throw error;
      }
      
      // Local update
      localStorage.setItem(`vote_${mosque.id}`, type);
      setHasVoted(type);
      onVote(mosque.id, type);
    } catch (error: any) {
      console.error('Error voting:', error);
      alert(`ভোট দিতে সমস্যা হয়েছে: ${error.message || 'অজানা ত্রুটি'}`);
    } finally {
      setVoting(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-emerald-900 mb-1">{mosque.name}</h3>
          <div className="flex items-center text-emerald-600 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {mosque.location}
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
          mosque.has_biryani 
            ? "bg-amber-100 text-amber-800 border border-amber-200" 
            : "bg-gray-100 text-gray-600 border border-gray-200"
        )}>
          {mosque.has_biryani ? (
            <>বিরিয়ানি আছে! 🍗</>
          ) : (
            <>বিরিয়ানি নেই 🥤</>
          )}
        </div>
      </div>

      {mosque.has_biryani && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            ধরণ: চিকেন বিরিয়ানি
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-2 font-medium">ইফতার মেনু</p>
        <div className="flex flex-wrap gap-2">
          {mosque.menu_items.map((item, idx) => (
            <span 
              key={idx} 
              className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-100"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => handleVote('true')}
            disabled={!!hasVoted}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
              hasVoted === 'true'
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : hasVoted
                  ? "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400"
                  : "bg-white text-emerald-600 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200"
            )}
          >
            <Check className="w-4 h-4" />
            সঠিক <span className="ml-1 bg-emerald-200 px-1.5 rounded text-emerald-800 text-xs">{mosque.true_count || 0}</span>
          </button>

          <button
            onClick={() => handleVote('fake')}
            disabled={!!hasVoted}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
              hasVoted === 'fake'
                ? "bg-rose-100 text-rose-700 border-rose-200"
                : hasVoted
                  ? "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400"
                  : "bg-white text-rose-600 border-gray-200 hover:bg-rose-50 hover:border-rose-200"
            )}
          >
            <X className="w-4 h-4" />
            ভুল <span className="ml-1 bg-rose-200 px-1.5 rounded text-rose-800 text-xs">{mosque.fake_count || 0}</span>
          </button>
        </div>

        <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
          <MessageCircle className="w-5 h-5" />
        </button>
      </div>

      <a 
        href={`https://www.google.com/maps/search/?api=1&query=${mosque.latitude},${mosque.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-900 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        গুগল ম্যাপে দেখুন
      </a>
    </motion.div>
  );
}
