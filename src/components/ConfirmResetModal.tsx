import React from 'react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { t as tr } from '../data/translations';

interface ConfirmResetModalProps {
  lang: Language;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({
  lang,
  onConfirm,
  onCancel,
}) => {
  const t = (en: string, de?: string, _ignoredEs?: string) => tr(lang, en, de);

  // Isolate Escape key so resetting confirmation closes cleanly
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={onCancel}
      className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[70] p-2.5 sm:p-4 backdrop-blur-xl cursor-pointer overflow-y-auto overscroll-contain"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1c1c1e] w-full max-w-md rounded-[32px] p-5 sm:p-8 shadow-2xl border border-white/15 text-center relative overflow-hidden cursor-default max-h-[92vh] sm:max-h-[88vh] flex flex-col min-h-0 my-auto shrink-0"
      >
        {/* Glow backdrop accent */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-rose-500/20 rounded-full blur-[50px] pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-rose-500/10 rounded-full blur-[50px] pointer-events-none"></div>

        {/* Warning Badge Icon */}
        <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 text-rose-400 flex items-center justify-center text-2xl mx-auto mb-5 border border-rose-500/30 shadow-lg shadow-rose-500/10">
          <i className="fas fa-rotate-right"></i>
        </div>

        {/* Title */}
        <h3 className="relative z-10 text-2xl font-black text-white tracking-tight mb-2">
          {t('Start New Career?', 'Karriere Neu Starten?')}
        </h3>

        {/* Description */}
        <p className="relative z-10 text-xs sm:text-sm text-[#8e8e93] font-medium leading-relaxed mb-8 px-2">
          {t(
            'Are you sure you want to start over? All your current club progress, trophies, season history, and treasury funds will be reset.',
            'Moechtest du wirklich eine neue Karriere beginnen? Dein aktueller Vereinsfortschritt, Titel, Saisondaten und Kontostand werden zurueckgesetzt.'
          )}
        </p>

        {/* Action Buttons */}
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-bold py-3.5 px-4 rounded-2xl transition active:scale-95 text-xs sm:text-sm cursor-pointer border border-white/10 shadow-sm"
          >
            {t('Keep Playing', 'Weiterbauen')}
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold py-3.5 px-4 rounded-2xl transition active:scale-95 text-xs sm:text-sm cursor-pointer shadow-lg shadow-rose-600/25 border border-rose-400/30 flex items-center justify-center gap-2"
          >
            <i className="fas fa-arrows-rotate text-xs"></i>
            <span>{t('Reset Career', 'Neu Starten')}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
