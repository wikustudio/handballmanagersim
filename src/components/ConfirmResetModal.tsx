import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Language } from '../types';
import { t as tr } from '../data/translations';
import { useModalDismiss } from '../utils/modalUtils';

interface ConfirmResetModalProps {
  lang: Language;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({
  lang,
  onConfirm,
  onClose,
}) => {
  const t = (en: string, _de?: string, _ignoredEs?: string) => en;

  useModalDismiss(onClose);

  const modal = (
    <motion.div
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10020] p-4 backdrop-blur-2xl cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }} 
        animate={{ scale: 1, y: 0, opacity: 1 }} 
        exit={{ scale: 0.95, y: 10 }} 
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] w-full max-w-sm rounded-2xl border border-white/[0.04] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative cursor-default overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        {/* Top Radiant Rose Glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-rose-500/[0.05] border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
            <i className="fas fa-rotate-right text-lg"></i>
          </div>
          
          <h2 className="text-lg font-semibold text-white text-center mb-2 tracking-tight">
            {t('Start New Career?', 'Neue Karriere starten?')}
          </h2>
          <p className="text-xs text-zinc-400 font-normal text-center mb-7 px-4 leading-relaxed">
            {t(
              'Are you sure you want to start over? All your current club progress, trophies, season history, and treasury funds will be reset.',
              'Bist du sicher, dass du neu anfangen möchtest? Alle Vereinsfortschritte, Trophäen, Saisonhistorien und das Budget werden zurückgesetzt.'
            )}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium text-xs sm:text-sm text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition active:scale-[0.99] cursor-pointer"
            >
              {t('Keep Playing', 'Weiterspielen')}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl font-medium text-xs sm:text-sm text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-[0_4px_16px_rgba(244,63,94,0.25)] border border-rose-400/20 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fas fa-rotate-right text-xs"></i>
              {t('Reset Career', 'Karriere zurücksetzen')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
  return createPortal(modal, document.body);
};
