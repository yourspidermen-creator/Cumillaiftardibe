import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Search, Moon, MessageCircle, Plus } from 'lucide-react';
import { Mosque, INITIAL_MOSQUES } from '@/data/mosques';
import { IftarMap } from '@/components/IftarMap';
import { MosqueCard } from '@/components/MosqueCard';
import { AddMosqueModal } from '@/components/AddMosqueModal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function App() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mosques' }, () => fetchData())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, []);

  const fetchData = async () => {
    try {
      let allMosques = [...INITIAL_MOSQUES];

      if (isSupabaseConfigured()) {
        const { data: dbMosques } = await supabase.from('mosques').select('*');
        if (dbMosques && dbMosques.length > 0) {
          const dbIds = new Set(dbMosques.map(m => String(m.id)));
          const filteredInitial = INITIAL_MOSQUES.filter(m => !dbIds.has(String(m.id)));
          allMosques = [...dbMosques, ...filteredInitial];
        }

        const { data: votes } = await supabase.from('votes').select('mosque_id, vote_type');
        const voteCounts: Record<string, { true: number, fake: number }> = {};
        
        votes?.forEach((vote: any) => {
          const id = String(vote.mosque_id);
          if (!voteCounts[id]) voteCounts[id] = { true: 0, fake: 0 };
          if (vote.vote_type === 'true') voteCounts[id].true++;
          else voteCounts[id].fake++;
        });

        allMosques = allMosques.map(m => ({
          ...m,
          true_count: voteCounts[String(m.id)]?.true || 0,
          fake_count: voteCounts[String(m.id)]?.fake || 0
        }));
      }

      setMosques(allMosques);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (mosqueId: string | number, type: 'true' | 'fake') => {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.from('votes').insert([{ mosque_id: String(mosqueId), vote_type: type }]);
      fetchData();
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const handleAddMosque = async (mosqueData: any) => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('mosques')
        .insert([{ name: mosqueData.name, location: mosqueData.location }])
        .select();

      if (error) throw error;
      if (data) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      alert('তথ্য যোগ করতে সমস্যা হয়েছে। ডাটাবেস টেবিল ঠিক আছে কি না চেক করুন।');
    }
  };

  const filteredMosques = mosques
    .filter(m => 
      (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.location || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => ((b.true_count || 0) - (b.fake_count || 0)) - ((a.true_count || 0) - (a.fake_count || 0)));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="bg-zinc-900 text-white py-6 px-4 border-b border-zinc-800 relative overflow-hidden text-center md:text-left">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-6 relative z-10">
          <Moon className="w-8 h-8 text-amber-400 fill-amber-400" />
          <p className="text-sm md:text-base font-medium italic text-zinc-300">
            "রমাদানের এই পবিত্র মাসে আসুন আমরা গরিব-দুঃখীর পাশে দাঁড়াই।"
          </p>
        </div>
      </div>

      <header className="bg-zinc-800 text-white py-16 text-center relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-8">কুমিল্লা ইফতার ট্র্যাকার ২০২৬</h1>
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="মসজিদ বা এলাকা খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-4 px-6 rounded-full text-zinc-800 focus:outline-none shadow-lg"
            />
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 -mt-10 relative z-20 mb-12">
        <div className="bg-white p-4 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-zinc-600" /> ইফতার ম্যাপ
          </h2>
          {/* ম্যাপ ক্র্যাশ রোধে ফিল্টার যোগ করা হয়েছে */}
          <IftarMap mosques={filteredMosques.filter(m => m.lat && m.lng)} />
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">ইফতার আয়োজনসমূহ</h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-zinc-800 text-white px-6 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-5 h-5" /> নতুন তথ্য যোগ করুন
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMosques.map((mosque) => (
            <MosqueCard key={mosque.id} mosque={mosque} onVote={handleVote} />
          ))}
        </div>
      </section>

      <footer className="bg-zinc-900 text-white py-12">
        <div className="container mx-auto px-4 text-center md:text-left">
          <h3 className="text-2xl font-bold text-amber-400 mb-4">কুমিল্লা ইফতার ট্র্যাকার</h3>
          <p className="text-zinc-400 mb-8">আপনার একটি তথ্য হতে পারে অন্যের বড় সাহায্য।</p>
          <div className="inline-block bg-zinc-800 p-6 rounded-xl border border-zinc-700">
            <p className="font-bold">মইনুল ইসলাম</p>
            <a href="https://www.facebook.com/yourspidermen" target="_blank" className="text-amber-400 mt-2 inline-block">ফেসবুকে মেসেজ দিন →</a>
          </div>
        </div>
      </footer>

      <AddMosqueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddMosque} />
    </div>
  );
}

export default App;
