import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Search, Moon, MessageCircle, Plus } from 'lucide-react';
import { Mosque, INITIAL_MOSQUES } from '@/data/mosques';
import { IftarMap } from '@/components/IftarMap';
import { MosqueCard } from '@/components/MosqueCard';
import { AddMosqueModal } from '@/components/AddMosqueModal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function App() {
  const [mosques, setMosques] = useState<Mosque[]>(INITIAL_MOSQUES);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'votes' },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const fetchData = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const { data: dbMosques, error: mosqueError } = await supabase
        .from('mosques')
        .select('*');

      if (mosqueError) console.warn('Mosque fetch warning:', mosqueError);
      
      let allMosques = [...INITIAL_MOSQUES];
      if (dbMosques && dbMosques.length > 0) {
        const dbMosqueIds = new Set(dbMosques.map(m => String(m.id)));
        const nonDuplicateInitial = INITIAL_MOSQUES.filter(m => !dbMosqueIds.has(String(m.id)));
        allMosques = [...dbMosques, ...nonDuplicateInitial];
      }
      
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('mosque_id, vote_type');

      if (votesError) throw votesError;

      const voteCounts: Record<string, { true: number, fake: number }> = {};
      
      votes?.forEach((vote: any) => {
        const mId = String(vote.mosque_id);
        if (!voteCounts[mId]) {
          voteCounts[mId] = { true: 0, fake: 0 };
        }
        if (vote.vote_type === 'true') voteCounts[mId].true++;
        else if (vote.vote_type === 'fake') voteCounts[mId].fake++;
      });

      const updatedMosques = allMosques.map(m => ({
        ...m,
        true_count: voteCounts[String(m.id)]?.true || 0,
        fake_count: voteCounts[String(m.id)]?.fake || 0
      }));

      setMosques(updatedMosques);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (mosqueId: string | number, type: 'true' | 'fake') => {
    if (!isSupabaseConfigured()) return;

    setMosques(prev => prev.map(m => {
      if (String(m.id) === String(mosqueId)) {
        return {
          ...m,
          true_count: type === 'true' ? (m.true_count || 0) + 1 : (m.true_count || 0),
          fake_count: type === 'fake' ? (m.fake_count || 0) + 1 : (m.fake_count || 0)
        };
      }
      return m;
    }));

    try {
      await supabase
        .from('votes')
        .insert([{ 
          mosque_id: String(mosqueId), 
          vote_type: type 
        }]);
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleAddMosque = async (mosqueData: any) => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data, error } = await supabase
        .from('mosques')
        .insert([{
          name: mosqueData.name,
          location: mosqueData.location
        }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newMosque = { ...data[0], true_count: 0, fake_count: 0 };
        setMosques(prev => [newMosque, ...prev]);
        setIsModalOpen(false); 
      }
    } catch (error) {
      console.error('Error adding mosque:', error);
      alert('তথ্য সেভ করা যায়নি। দয়া করে আবার চেষ্টা করুন।');
    }
  };

  const filteredMosques = mosques
    .filter(m => 
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.location || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const scoreA = (a.true_count || 0) - (a.fake_count || 0);
      const scoreB = (b.true_count || 0) - (b.fake_count || 0);
      return scoreB - scoreA;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="bg-zinc-900 text-white py-6 px-4 border-b border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-5"></div>
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="bg-zinc-800 p-4 rounded-2xl flex-shrink-0 border border-zinc-700">
            <Moon className="w-8 h-8 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm md:text-base font-medium italic leading-relaxed text-zinc-300 text-center md:text-left">
              "রমাদানের এই পবিত্র মাসে আসুন আমরা মন থেকে প্রতিজ্ঞা করি যতটুকু সম্ভব পথশিশু, গরিব-দুঃখীর পাশে দাঁড়াই।"
            </p>
            <div className="w-24 h-1 bg-amber-500/50 rounded-full mt-4 mx-auto md:mx-0"></div>
          </div>
        </div>
      </div>

      <header className="bg-zinc-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block p-4 bg-zinc-700/50 rounded-full mb-6 backdrop-blur-sm">
            <Moon className="w-12 h-12 text-amber-400 fill-amber-400" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">কুমিল্লা ইফতার ট্র্যাকার ২০২৬</h1>
          <div className="max-w-xl mx-auto relative mt-8">
            <input
              type="text"
              placeholder="মসজিদ বা এলাকা খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-4 pl-6 pr-16 rounded-full text-zinc-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-zinc-500/30 transition-shadow bg-white"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 -mt-10 relative z-20 mb-12">
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2 mb-4 px-2">
            <MapPin className="w-5 h-5 text-zinc-600" /> ইফতার ম্যাপ
          </h2>
          <IftarMap mosques={filteredMosques.filter(m => m.lat && m.lng)} />
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-800">জনপ্রিয় ইফতার আয়োজন</h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-zinc-800 hover:bg-zinc-900 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" /> নতুন তথ্য যোগ করুন
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMosques.map((mosque) => (
            <MosqueCard key={mosque.id} mosque={mosque} onVote={handleVote} />
          ))}
        </div>
      </section>

      <footer className="bg-zinc-900 text-white py-12 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2 text-amber-400">কুমিল্লা ইফতার ট্র্যাকার</h3>
              <p className="text-zinc-400 max-w-md">আপনার ছোট একটি তথ্য হতে পারে অন্যের জন্য অনেক বড় সাহায্য।</p>
            </div>
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center font-bold text-white text-xl">MI</div>
                <div>
                  <h4 className="font-bold text-lg">মইনুল ইসলাম</h4>
                  <p className="text-zinc-400 text-xs uppercase">Moinul Islam</p>
                </div>
              </div>
              <a href="https://www.facebook.com/yourspidermen" target="_blank" rel="noopener noreferrer" className="w-full bg-white text-zinc-900 py-3 rounded-lg font-bold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" /> ফেসবুকে মেসেজ দিন →
              </a>
            </div>
          </div>
        </div>
      </footer>

      <AddMosqueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddMosque} />
    </div>
  );
}

export default App;
