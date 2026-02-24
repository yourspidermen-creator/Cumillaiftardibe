import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

interface VoteCounts {
  true_count: number;
  fake_count: number;
}

export function VoteCard() {
  const [counts, setCounts] = useState<VoteCounts>({ true_count: 0, fake_count: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<'true' | 'fake' | null>(null);
  const [hasVoted, setHasVoted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedVote = localStorage.getItem('user_vote');
    if (storedVote) {
      setHasVoted(storedVote);
    }
    fetchVotes();

    // Realtime subscription
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'votes',
          },
          (payload) => {
            const newVote = payload.new as { vote_type: string };
            setCounts((prev) => ({
              ...prev,
              [newVote.vote_type === 'true' ? 'true_count' : 'fake_count']:
                prev[newVote.vote_type === 'true' ? 'true_count' : 'fake_count'] + 1,
            }));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const fetchVotes = async () => {
    if (!isSupabaseConfigured()) {
      // Mock data for demo
      setCounts({ true_count: 124, fake_count: 45 });
      setLoading(false);
      return;
    }

    try {
      const { count: trueCount, error: trueError } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('vote_type', 'true');

      const { count: fakeCount, error: fakeError } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('vote_type', 'fake');

      if (trueError) throw trueError;
      if (fakeError) throw fakeError;

      setCounts({
        true_count: trueCount || 0,
        fake_count: fakeCount || 0,
      });
    } catch (err: any) {
      console.error('Error fetching votes:', err);
      setError('Failed to load votes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 'true' | 'fake') => {
    if (hasVoted) return;
    setVoting(type);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Mock vote for demo
      setTimeout(() => {
        setCounts((prev) => ({
          ...prev,
          [type === 'true' ? 'true_count' : 'fake_count']:
            prev[type === 'true' ? 'true_count' : 'fake_count'] + 1,
        }));
        setHasVoted(type);
        localStorage.setItem('user_vote', type);
        setVoting(null);
      }, 1000);
      return;
    }

    try {
      const { error } = await supabase.from('votes').insert([{ vote_type: type }]);
      if (error) throw error;

      setHasVoted(type);
      localStorage.setItem('user_vote', type);
      
      // Optimistic update (realtime will confirm)
      setCounts((prev) => ({
        ...prev,
        [type === 'true' ? 'true_count' : 'fake_count']:
          prev[type === 'true' ? 'true_count' : 'fake_count'] + 1,
      }));
    } catch (err: any) {
      console.error('Error voting:', err);
      setError('Failed to submit vote. Please try again.');
    } finally {
      setVoting(null);
    }
  };

  const totalVotes = counts.true_count + counts.fake_count;
  const truePercentage = totalVotes === 0 ? 0 : Math.round((counts.true_count / totalVotes) * 100);
  const fakePercentage = totalVotes === 0 ? 0 : Math.round((counts.fake_count / totalVotes) * 100);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
        কুমিল্লা কি ইফতার দিবে?
        <br />
        <span className="text-sm font-normal text-gray-500 mt-2 block">
          (Will Cumilla give Iftar?)
        </span>
      </h2>

      {!isSupabaseConfigured() && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Demo Mode Active</p>
            <p className="mt-1 opacity-90">
              Supabase is not configured. Votes will not be saved permanently.
              Please check the instructions below to connect your database.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleVote('true')}
          disabled={!!hasVoted || !!voting}
          className={cn(
            "relative h-32 rounded-xl flex flex-col items-center justify-center gap-3 transition-all border-2",
            hasVoted === 'true' 
              ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-200 ring-offset-2"
              : hasVoted 
                ? "bg-gray-50 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed"
                : "bg-white border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 shadow-sm hover:shadow-md"
          )}
        >
          {voting === 'true' ? (
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          ) : (
            <>
              <div className={cn(
                "p-3 rounded-full",
                hasVoted === 'true' ? "bg-emerald-100" : "bg-emerald-50"
              )}>
                <Check className={cn(
                  "w-8 h-8",
                  hasVoted === 'true' ? "text-emerald-600" : "text-emerald-500"
                )} />
              </div>
              <span className="font-bold text-lg">সত্য (True)</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleVote('fake')}
          disabled={!!hasVoted || !!voting}
          className={cn(
            "relative h-32 rounded-xl flex flex-col items-center justify-center gap-3 transition-all border-2",
            hasVoted === 'fake'
              ? "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200 ring-offset-2"
              : hasVoted
                ? "bg-gray-50 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed"
                : "bg-white border-rose-200 hover:border-rose-500 hover:bg-rose-50 text-gray-700 hover:text-rose-700 shadow-sm hover:shadow-md"
          )}
        >
          {voting === 'fake' ? (
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          ) : (
            <>
              <div className={cn(
                "p-3 rounded-full",
                hasVoted === 'fake' ? "bg-rose-100" : "bg-rose-50"
              )}>
                <X className={cn(
                  "w-8 h-8",
                  hasVoted === 'fake' ? "text-rose-600" : "text-rose-500"
                )} />
              </div>
              <span className="font-bold text-lg">ভুয়া (Fake)</span>
            </>
          )}
        </motion.button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>সত্য (True)</span>
            <span>{counts.true_count} votes ({truePercentage}%)</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${truePercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>ভুয়া (Fake)</span>
            <span>{counts.fake_count} votes ({fakePercentage}%)</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fakePercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-rose-500 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          Total Votes: {totalVotes} • {hasVoted ? "Thanks for voting!" : "Cast your vote now!"}
        </p>
      </div>
    </div>
  );
}
