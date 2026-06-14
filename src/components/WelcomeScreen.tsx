import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, FileSpreadsheet, Package } from 'lucide-react';

interface WelcomeScreenProps {
  onSuccess: () => void;
}

export default function WelcomeScreen({ onSuccess }: WelcomeScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (password === 'Naty') {
      onSuccess();
    } else {
      setError('❌ Accès refusé.');
      setIsShaking(true);
      setPassword('');
      setTimeout(() => setIsShaking(false), 400);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0c10] flex flex-col items-center justify-center z-[9999] px-4">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={
          isShaking
            ? { x: [-10, 10, -10, 10, -5, 5, 0], scale: [1, 0.98, 1.01, 1], transition: { duration: 0.4 } }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{
          y: -4,
          boxShadow: '"0 25px 50px -12px rgba(0, 0, 0, 0.5)"',
          borderColor: "rgba(59, 130, 246, 0.35)",
          transition: { duration: 0.4, ease: "easeOut" }
        }}
        className="w-full max-w-md bg-[#111422]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ff5000] to-[#ff9900]" />
 
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.4, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 140,
              damping: 11,
              delay: 0.15
            }}
            whileHover={{
              scale: 1.12,
              rotate: 8,
              boxShadow: "0 10px 25px -4px rgba(255, 80, 0, 0.35)",
              transition: { type: "spring", stiffness: 300, damping: 15 }
            }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 bg-gradient-to-tr from-[#ff5000] to-[#ff9a00] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            <Package className="w-8 h-8" />
          </motion.div>
        </div>
 
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="text-2xl font-black font-sans text-white tracking-tight"
        >
          Andry <span className="text-[#ff5000]">Nantenaina</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.05em" }}
          animate={{ opacity: 1, letterSpacing: "0.15em" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.45 }}
          className="text-xs font-mono text-slate-400 mt-1 mb-8 uppercase tracking-widest"
        >
          LOGISTIQUE OFFICER
        </motion.p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              placeholder="MOT DE PASSE"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className="w-full text-center bg-[#181c28] border border-slate-800 rounded-lg py-3 px-4 text-white font-mono font-bold tracking-[0.2em] placeholder:text-slate-500 placeholder:tracking-normal focus:outline-none focus:border-[#ff5000] transition-all text-sm"
              autoFocus
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 font-mono text-xs font-semibold"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#ff5000] to-[#ff9900] hover:brightness-110 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:shadow-orange-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer font-sans"
          >
            <Lock className="w-4 h-4" />
            ENTRER SÉCURISÉ
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500">
          <Lock className="w-3 h-3" />
          RESTRICTED TO LOGISTICS OFFICERS ONLY
        </div>
      </motion.div>
    </div>
  );
}
