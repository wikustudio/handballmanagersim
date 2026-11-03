import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { ClubLogo } from './ClubLogo';
import { t as tr } from '../data/translations';
import { useModalDismiss } from '../utils/modalUtils';

interface ClubCustomizationModalProps {
  state: GameState;
  lang: Language;
  onSave: (name: string, color: string, logo: string, narrative: string) => void;
  onClose: () => void;
}

export const ClubCustomizationModal: React.FC<ClubCustomizationModalProps> = ({
  state,
  lang,
  onSave,
  onClose,
}) => {
  useModalDismiss(onClose);
  const [name, setName] = useState(state.club.name);
  const [color, setColor] = useState(state.club.color);
  const [logo, setLogo] = useState(state.club.logo || '');
  const [narrative, setNarrative] = useState(state.club.narrative || '');
  const t = (en: string, _de?: string, _es?: string) => en;

  const handleSave = () => {
    onSave(name, color, logo, narrative);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={onClose} className="fixed inset-0 flex items-center justify-center p-3 sm:p-5 z-[100] bg-black/80 backdrop-blur-2xl cursor-pointer">
      <motion.div initial={{ scale: 0.95, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 10, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 340 }} onClick={(e) => e.stopPropagation()} className="bg-[#14151e] text-white rounded-2xl max-w-sm w-full shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-white/[0.04] flex flex-col max-h-[90vh] cursor-default relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent pointer-events-none" />

        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/[0.05] border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <i className="fas fa-palette text-sm"></i>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white leading-tight tracking-tight">{t('Club Identity', 'Vereins-Identitaet')}</h2>
              <p className="text-xs text-zinc-400 font-normal">{t('Customize your club details', 'Passe deine Vereinsdetails an')}</p>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <ClubLogo name={name} color={color} logo={logo} className="w-20 h-20 drop-shadow-xl" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                {t('Club Name', 'Vereinsname')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#181924] border border-white/[0.04] rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:border-indigo-500/40 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                {t('Primary Color', 'Hauptfarbe')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 bg-[#181924] border border-white/[0.04] rounded-xl px-3 py-2.5 text-sm text-white font-mono uppercase focus:border-indigo-500/40 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                {t('Logo URL (Optional)', 'Logo URL (Optional)')}
              </label>
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-[#181924] border border-white/[0.04] rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500/40 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                {t('Club Narrative / Vision', 'Vereins-Vision / Geschichte')}
              </label>
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder={t('e.g. Gritty working-class club playing aggressive, fast-break handball...', 'z.B. Ein rauer Arbeiterverein, der aggressiven Tempogegenstoss-Handball spielt...')}
                className="w-full bg-[#181924] border border-white/[0.04] rounded-xl px-3 py-2.5 text-sm text-white min-h-[80px] focus:border-indigo-500/40 focus:outline-none transition-colors resize-y custom-scrollbar"
              />
              <p className="text-[10px] text-zinc-400 mt-1.5">
                {t('This adds unique context to your club events and end of season AI summaries.', 'Dies gibt den Vereins-Events und KI-Saisonrueckblicken einen einzigartigen Charakter.')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-white/[0.04] bg-[#14151e] flex gap-3 shrink-0">
          <button aria-label="Close modal"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition active:scale-[0.99] cursor-pointer"
          >
            {t('Cancel', 'Abbrechen')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_4px_16px_rgba(37,99,235,0.25)] border border-blue-400/20 active:scale-[0.99] cursor-pointer"
          >
            {t('Save Details', 'Speichern')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
