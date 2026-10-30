import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { ClubLogo } from './ClubLogo';
import { t as tr } from '../data/translations';
import { TEAMS } from '../mod-data/teams';

interface ClubCustomizationModalProps {
  state: GameState;
  lang: Language;
  isModActive?: boolean;
  onSave: (name: string, color: string, logo: string, narrative: string) => void;
  onClose: () => void;
}

export const ClubCustomizationModal: React.FC<ClubCustomizationModalProps> = ({
  state,
  lang,
  isModActive: isModActiveProp,
  onSave,
  onClose,
}) => {
  const isModActive = isModActiveProp !== undefined
    ? isModActiveProp
    : (typeof window !== 'undefined' && localStorage.getItem('fms_real_mod_active') === 'true');
  const [name, setName] = useState(state.club.name);
  const [color, setColor] = useState(state.club.color);
  const [logo, setLogo] = useState(() => {
    if (state.club.logo) return state.club.logo;
    if (isModActive) {
      const match = TEAMS.find(t => t.id === state.club.id || t.name.toLowerCase() === state.club.name.toLowerCase());
      if (match?.logo) return match.logo;
    }
    return '';
  });
  const [narrative, setNarrative] = useState(state.club.narrative || '');
  const t = (en: string, de?: string, es?: string) => tr(lang, en, de, es);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    onSave(name, color, logo, narrative);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1, ease: 'linear' }} className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/80 backdrop-blur-2xl" onClick={onClose}>
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }} className="bg-[#12141c]/95 text-white rounded-[28px] max-w-sm w-full shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/[0.08] backdrop-blur-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <i className="fas fa-palette"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">{t('Club Identity', 'Vereins-Identitaet')}</h2>
              <p className="text-xs text-[#8e8e93] font-medium">{t('Customize your club details', 'Passe deine Vereinsdetails an')}</p>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <ClubLogo name={name} id={state.club.id} color={color} logo={logo} fallbackLogo={state.club.fallbackLogo} isModActive={isModActive} className="w-20 h-20 drop-shadow-xl" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8e8e93] uppercase tracking-widest mb-1.5">
                {t('Club Name', 'Vereinsname')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8e8e93] uppercase tracking-widest mb-1.5">
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
                  className="flex-1 bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono uppercase focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8e8e93] uppercase tracking-widest mb-1.5">
                {t('Logo URL (Optional)', 'Logo URL (Optional)')}
              </label>
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8e8e93] uppercase tracking-widest mb-1.5">
                {t('Club Narrative / Vision', 'Vereins-Vision / Geschichte')}
              </label>
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder={t('e.g. Gritty working-class club playing heavy metal football...', 'z.B. Ein rauer Arbeiterverein, der Heavy-Metal-Fussball spielt...')}
                className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white min-h-[80px] focus:border-indigo-500 focus:outline-none transition-colors resize-y custom-scrollbar"
              />
              <p className="text-[10px] text-[#8e8e93] mt-1.5">
                {t('This adds unique context to your club events and end of season AI summaries.', 'Dies gibt den Vereins-Events und KI-Saisonrueckblicken einen einzigartigen Charakter.')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex gap-3">
          <button aria-label="Close modal"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
          >
            {t('Cancel', 'Abbrechen')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/50"
          >
            {t('Save Details', 'Speichern')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
