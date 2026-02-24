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

    // Realtime subscription: ডাটাবেসে ভোট বা নতুন ডেটা আসলে অটো আপডেট হবে
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
      // ১. ডাটাবেস থেকে মসজিদ ফেচ করা
      const { data: dbMosques, error: mosqueError } = await supabase
        .from('mosques')
        .select('*');

      if (mosqueError) console.warn('Mosque fetch warning:', mosqueError);
      
      // লোকাল এবং ডাটাবেসের মসজিদগুলো একত্রিত করা
      let allMosques = [...INITIAL_MOSQUES];
      if (dbMosques && dbMosques.length > 0) {
        const dbMosqueIds = new Set(dbMosques.map(m => String(m.id)));
        const nonDuplicateInitial = INITIAL_MOSQUES.filter(m => !dbMosqueIds.has(String(m.id)));
        allMosques = [...dbMosques, ...nonDuplicateInitial];
      }
      
      // ২. ভোট ফেচ করা
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

      // ৩. স্টেট আপডেট করা
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

    // লোকাললি সাথে সাথে আপডেট দেখানো (Optimistic UI)
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
      // ডাটাবেসে ভোট ইনসার্ট করা
      const { error } = await supabase
        .from('votes')
        .insert([{ 
          mosque_id: String(mosqueId), 
          vote_type: type 
        }]);

      if (error) {
        console.error('Error saving vote:', error);
        // যদি এরর হয়, তবে চাইলে লোকাল স্টেট আবার আগের অবস্থায় ফিরিয়ে আনা যায়
        fetchData();
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleAddMosque = async (mosqueData: any) => {
    if (!isSupabaseConfigured()) return;

    try {
      // ডাটাবেসে নতুন মসজিদ যোগ করা (lat, lng, menu ছাড়া)
      const { data, error } = await supabase
        .from('mosques')
        .insert([{
          name: mosqueData.name,
          location: mosqueData.location
        }])
        .select();

      if (error) {
        console.error('Supabase Insert Error:', error);
        alert('ডাটাবেসে সেভ করতে সমস্যা হয়েছে!');
        return;
      }

      if (data && data.length > 0) {
        // সফলভাবে সেভ হলে লোকাল স্টেট আপডেট করা হচ্ছে
        const newMosque = {
          ...data[0],
          true_count: 0,
          fake_count: 0
        };
        setMosques(prev => [newMosque, ...prev]);
        setIsModalOpen(false); // মডাল বন্ধ করা
      }
    } catch (error) {
      console.error('Error adding mosque:', error);
    }
  };

  const filteredMosques = mosques.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Top Banner */}
      <div className="bg-zinc-900 text-white py-6 px-4 border-b border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-5"></div>
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="bg-zinc-800 p-4 rounded-2xl flex-shrink-0 border border-zinc-700">
            <Moon className="w-8 h-8 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm md:text-base font-medium italic leading-relaxed text-zinc-300 text-center md:text-left">
              "রমাদানের এই পবিত্র মাসে আসুন আমরা মন থেকে প্রতিজ্ঞা করি যতটুকু সম্ভব পথশিশু, গরিব-দুঃখীর পাশে দাঁড়াই। তাদের জন্যই তো আমাদের অস্তিত্বের মানে! নিজ থেকে ছোট হলেও কোনো উদ্যোগ নেই তবু সেই সামান্য প্রচেষ্টাই হতে পারে তাদের কাছে বিরাট কিছু! আসুন, আমরা প্রত্যেকে নিজের জায়গা থেকে কিছু করি, পরিবর্তনটা শুরু হোক আমাদের হাত ধরেই!"
            </p>
            <div className="w-24 h-1 bg-amber-500/50 rounded-full mt-4 mx-auto md:mx-0"></div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <header className="bg-zinc-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block p-4 bg-zinc-700/50 rounded-full mb-6 backdrop-blur-sm"
          >
            <Moon className="w-12 h-12 text-amber-400 fill-amber-400" />
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight text-white">
            কুমিল্লা ইফতার ট্র্যাকার ২০২৬
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            কুমিল্লার সকল মসজিদের ইফতার আয়োজনের তথ্য এক ঠিকানায়। আপনার এলাকার মসজিদের তথ্য দিয়ে সাহায্য করুন।
          </p>

          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="মসজিদ বা এলাকা খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-4 pl-6 pr-16 rounded-full text-zinc-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-zinc-500/30 transition-shadow bg-white"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-full transition-colors shadow-md">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Map Section */}
      <section className="container mx-auto px-4 -mt-10 relative z-20 mb-12">
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-zinc-100">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-zinc-600" />
              ইফতার ম্যাপ
            </h2>
          </div>
          <IftarMap mosques={filteredMosques} />
        </div>
      </section>

      {/* Popular Iftar Events */}
      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-800">
              জনপ্রিয় ইফতার আয়োজন
            </h2>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-900 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            নতুন তথ্য যোগ করুন
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMosques.map((mosque) => (
            <MosqueCard 
              key={mosque.id} 
              mosque={mosque} 
              onVote={handleVote} 
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-12 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2 text-amber-400">কুমিল্লা ইফতার ট্র্যাকার</h3>
              <p className="text-zinc-400 max-w-md">
                আমাদের লক্ষ্য কুমিল্লার প্রতিটি মানুষের কাছে সঠিক ইফতারের তথ্য পৌঁছে দেওয়া। আপনার ছোট একটি তথ্য হতে পারে অন্যের জন্য অনেক বড় সাহায্য।
              </p>
            </div>
            
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center font-bold text-white text-xl">
                  MI
                </div>
                <div>
                  <h4 className="font-bold text-lg">মইনুল ইসলাম</h4>
                  <p className="text-zinc-400 text-xs tracking-widest uppercase">Moinul Islam</p>
                </div>
              </div>
              <p className="text-zinc-300 text-sm italic mb-4">
                "কোনো সমস্যা বা বাগ খুঁজে পেলে সরাসরি আমাকে জানান, আপনার মতামত আমাদের এগিয়ে যেতে সাহায্য করবে।"
              </p>
              <a 
                href="https://www.facebook.com/yourspidermen"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white text-zinc-900 py-3 rounded-lg font-bold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                ফেসবুকে মেসেজ দিন →
              </a>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
            <p>© ২০২৬ কুমিল্লা ইফতার ট্র্যাকার | সর্বস্বত্ব সংরক্ষিত</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">প্রাইভেসি পলিসি</a>
              <a href="#" className="hover:text-white transition-colors">শর্তাবলী</a>
            </div>
          </div>
        </div>
      </footer>

      <AddMosqueModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddMosque}
      />
    </div>
  );
}

export default App;
