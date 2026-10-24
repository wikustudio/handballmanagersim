import React, { useEffect } from 'react';
import { triggerRealisticConfetti } from '../utils/confettiHelper';
import { motion } from 'motion/react';
import { GameEvent, Language } from '../types';
import { EventUI } from './EventUI';
import { useModalScrollLock } from '../utils/modalUtils';

interface ActiveEventModalProps {
  event: GameEvent;
  lang: Language;
  onResolve: (choiceIndex: number) => void;
}

export const ActiveEventModal: React.FC<ActiveEventModalProps> = ({ event, lang, onResolve }) => {
  useModalScrollLock(true);
  useEffect(() => {
    if (event.type === 'platinum' || event.type === 'celebration' || (event.title.en && event.title.en.toLowerCase().includes('winner'))) {
        setTimeout(() => {
            triggerRealisticConfetti();
        }, 300);
    }
  }, [event]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      {/* Frosted Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-0"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          delay: (event.type === 'platinum' || event.type === 'celebration' || (event.title.en && event.title.en.toLowerCase().includes('winner'))) ? 1.2 : 0, 
          type: 'spring',
          damping: 26,
          stiffness: 340
        }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-md max-h-[92vh] flex flex-col rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <EventUI event={event} lang={lang} onResolve={onResolve} />
      </motion.div>
    </div>
  );
};
