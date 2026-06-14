import { useState, useEffect } from 'react';
import { X, Scale, Maximize } from 'lucide-react';
import { SizeDetails } from '../types';

interface BoxModalProps {
  isOpen: boolean;
  sizeName: string;
  colorName: string;
  initialDetails: SizeDetails;
  onClose: () => void;
  onSave: (updated: SizeDetails) => void;
}

export default function BoxModal({
  isOpen,
  sizeName,
  colorName,
  initialDetails,
  onClose,
  onSave
}: BoxModalProps) {
  const [wPiece, setWPiece] = useState(0.25);
  const [wCarton, setWCarton] = useState(0.8);
  const [dimL, setDimL] = useState(61);
  const [diml, setDiml] = useState(41);
  const [dimH, setDimH] = useState(30);

  useEffect(() => {
    if (isOpen) {
      setWPiece(initialDetails.wPiece);
      setWCarton(initialDetails.wCarton);
      setDimL(initialDetails.dimL);
      setDiml(initialDetails.diml);
      setDimH(initialDetails.dimH);
    }
  }, [isOpen, initialDetails]);

  if (!isOpen) return null;

  const handleSave = () => {
    const totalVolumeCbm = (dimL * diml * dimH) / 1000000;
    onSave({
      ...initialDetails,
      wPiece,
      wCarton,
      dimL,
      diml,
      dimH,
      cbmUnit: totalVolumeCbm
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9500] backdrop-blur-xs px-4">
      <div className="bg-[#1a1d27] border border-slate-700/80 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-mono text-blue-400 font-semibold tracking-wider uppercase">
              ✏️ DÉTAILS DU COLISAGE
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Taille <span className="text-white font-mono font-bold leading-none">{sizeName}</span> de la couleur <span className="text-white font-semibold">{colorName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Section: Weight */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-505" />
              ⚖️ Poids (KG)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400">Poids Pièce (KG)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={wPiece}
                  onChange={(e) => setWPiece(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#222636] border border-slate-700 hover:border-slate-600 focus:border-blue-500 font-mono font-medium rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-all"
                  placeholder="0.250"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400">Poids Carton Vide (KG)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={wCarton}
                  onChange={(e) => setWCarton(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#222636] border border-slate-700 hover:border-slate-600 focus:border-blue-500 font-mono font-medium rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-all"
                  placeholder="0.80"
                />
              </div>
            </div>
          </div>

          {/* Section: Dimensions */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase flex items-center gap-1.5">
              <Maximize className="w-3.5 h-3.5 text-blue-505" />
              📐 Dimensions Carton (cm)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400">Longueur (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={dimL}
                  onChange={(e) => setDimL(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#222636] border border-slate-700 hover:border-slate-600 focus:border-blue-500 font-mono font-medium rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-all"
                  placeholder="60"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400">Largeur (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={diml}
                  onChange={(e) => setDiml(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#222636] border border-slate-700 hover:border-slate-600 focus:border-blue-500 font-mono font-medium rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-all"
                  placeholder="40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400">Hauteur (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={dimH}
                  onChange={(e) => setDimH(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#222636] border border-slate-700 hover:border-slate-600 focus:border-blue-500 font-mono font-medium rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-all"
                  placeholder="30"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#151821] border-t border-slate-800 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-transparent hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-lg text-sm transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg text-sm transition-all cursor-pointer"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
