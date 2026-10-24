import React from 'react';
import { motion } from 'motion/react';
import { GameState } from '../types';
import { getLeagueInfo, getMaxTier } from '../data/gameConstants';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useModalDismiss } from '../utils/modalUtils';

interface StatusChangeModalProps {
  type: 'promotion' | 'relegation';
  state: GameState;
  mappedData: any;
  lang?: 'en' | 'de' | 'es';
  onContinue: () => void;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({ type, state, mappedData, onContinue }) => {
  useModalDismiss(onContinue);
  const isPromo = type === 'promotion';
  const { width, height } = useWindowSize();
  
  const maxTier = getMaxTier(state.club.country || 'GER');
  const fromTier = mappedData.tier || 1;
  let toTier = mappedData.nextTier;
  if (!toTier || toTier === fromTier) {
    toTier = isPromo ? Math.max(1, fromTier - 1) : Math.min(maxTier, fromTier + 1);
  }
  const fromLeague = getLeagueInfo(fromTier, state.club.country || 'GER');
  let toLeague = getLeagueInfo(toTier, state.club.country || 'GER');
  if (!isPromo && toLeague.name === fromLeague.name) {
    toLeague = getLeagueInfo(fromTier + 1, state.club.country || 'GER');
  } else if (isPromo && toLeague.name === fromLeague.name && fromTier > 1) {
    toLeague = getLeagueInfo(fromTier - 1, state.club.country || 'GER');
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.3 }}
      onClick={onContinue}
      className={`fixed inset-0 flex items-center justify-center p-3 sm:p-5 z-[9999] backdrop-blur-2xl cursor-pointer ${isPromo ? 'bg-black/85' : 'bg-black/90'}`}
    >
      {isPromo && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} gravity={0.15} colors={['#10b981', '#34d399', '#fbbf24', '#f59e0b']} />}
      
      <motion.div 
        initial={{ scale: 0.95, y: 15, opacity: 0 }} 
        animate={{ scale: 1, y: 0, opacity: 1 }} 
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md flex flex-col cursor-default"
      >
        <div className={`rounded-2xl w-full shadow-[0_25px_70px_rgba(0,0,0,0.85)] border flex flex-col overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar relative bg-[#14151e] ${isPromo ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
          {/* Top Ambient Highlight */}
          <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${isPromo ? 'via-emerald-400/30' : 'via-rose-500/30'} to-transparent pointer-events-none`} />

          <div className="relative pt-10 pb-6 px-6 text-center overflow-hidden">
            <div className={`absolute inset-0 opacity-10 blur-2xl ${isPromo ? 'bg-emerald-500' : 'bg-rose-600'}`} />
            
            <div className="relative z-10 flex flex-col items-center gap-3">
              <motion.div 
                initial={{ scale: 0, rotate: isPromo ? -180 : 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, type: 'spring', bounce: 0.4, delay: 0.2 }}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border ${isPromo ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
              >
                <i className={`fas ${isPromo ? 'fa-arrow-up' : 'fa-arrow-down'} text-2xl`} />
              </motion.div>
              
              <div className="flex flex-col gap-1">
                <div className={`text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 ${isPromo ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isPromo ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span>Season <strong className="tabular-nums font-semibold">{mappedData.year}</strong> Result</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl font-semibold tracking-tight uppercase ${isPromo ? 'text-white' : 'text-rose-400'}`}>
                  {isPromo ? 'Promotion Achieved!' : 'Relegation Confirmed'}
                </h2>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-black/40 flex flex-col gap-5 border-t border-white/[0.04]">
            <div className="text-center text-zinc-300 leading-relaxed text-xs sm:text-sm font-normal">
              {isPromo 
                ? `Congratulations! ${mappedData.clubName} has successfully secured promotion and will compete in a higher tier next campaign.`
                : `Devastating outcome. ${mappedData.clubName} failed to secure safety points and will compete in a lower tier next season.`}
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center p-3.5 bg-[#10121a] rounded-2xl border border-white/[0.04] w-full">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">Previous Division</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-200 text-center">{fromLeague.name}</span>
              </div>
              <i className={`fas fa-chevron-right text-sm ${isPromo ? 'text-emerald-400' : 'text-rose-400'}`} />
              <div className={`flex flex-col items-center p-3.5 rounded-2xl border w-full ${isPromo ? 'bg-emerald-500/[0.05] border-emerald-500/20 text-emerald-400' : 'bg-rose-500/[0.05] border-rose-500/20 text-rose-400'}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isPromo ? 'text-emerald-400' : 'text-rose-400'}`}>Next Division</span>
                <span className={`text-xs sm:text-sm font-semibold text-center ${isPromo ? 'text-emerald-300' : 'text-rose-300'}`}>{toLeague.name}</span>
              </div>
            </div>
            
            <button
              onClick={onContinue}
              className={`w-full py-3.5 px-5 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                isPromo 
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' 
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
              }`}
            >
              <span>Continue to Season Review</span>
              <i className="fas fa-arrow-right text-xs" />
            </button>
          </div>
          
        </div>
      </motion.div>
    </motion.div>
  );
};
