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
        className="w-full max-w-md bg-[#071638]/95 backdrop-blur-xl border border-blue-900/40 rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E51B22] to-[#FFE100]" />
 
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
              boxShadow: "0 10px 25px -4px rgba(255, 222, 0, 0.35)",
              transition: { type: "spring", stiffness: 300, damping: 15 }
            }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 bg-[#E51B22] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#E51B22]/20 cursor-pointer text-3xl font-black font-sans"
          >
            C
          </motion.div>
        </div>
 
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="text-2xl font-black font-sans text-white tracking-tight flex items-center justify-center gap-1"
        >
          <span>Andry</span> <span className="text-[#FFE100]">Nantenaina</span>
          <span className="text-xs bg-[#E51B22] text-white px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider scale-90 ml-1">PRO</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.05em" }}
          animate={{ opacity: 1, letterSpacing: "0.15em" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.45 }}
          className="text-xs font-mono text-blue-300 mt-1 mb-8 uppercase tracking-widest"
        >
          PORTAIL FOURNISSEUR CDISCOUNT
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
              className="w-full text-center bg-[#001A4F]/60 border border-blue-900/60 rounded-lg py-3 px-4 text-white font-mono font-bold tracking-[0.2em] placeholder:text-blue-300/40 placeholder:tracking-normal focus:outline-none focus:border-[#FFE100] focus:ring-1 focus:ring-[#FFE100]/25 transition-all text-sm"
              autoFocus
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-rose-400 font-mono text-xs font-semibold"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full py-3 bg-[#FFE100] hover:bg-[#fff04d] text-[#001A4F] font-black rounded-lg shadow-lg hover:shadow-[#FFE100]/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer font-sans uppercase tracking-wider"
          >
            <Lock className="w-4 h-4 text-[#001A4F]" />
            ACCÈS SÉCURISÉ LOGISTIQUE
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-blue-900/30 flex items-center justify-center gap-2 text-[10px] font-mono text-blue-400/50">
          <Lock className="w-3 h-3" />
          CDISCOUNT CARGO PARTNER PORTAL
        </div>
      </motion.div>
    </div>
  );
}
