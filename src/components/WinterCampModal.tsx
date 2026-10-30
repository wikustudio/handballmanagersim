import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { t } from '../data/translations';
import { getLeagueScaledVal, formatMoney } from '../data/gameConstants';

interface WinterCampModalProps {
  state: GameState;
  lang: Language;
  onSelectCamp: (type: 'local' | 'spain' | 'dubai', cost: number) => void;
  onFireCoach?: () => void;
  onPullYouth?: () => void;
  onClose: () => void;
  creditLimit?: number;
}

export const WinterCampModal: React.FC<WinterCampModalProps> = ({ 
  state, 
  lang, 
  onSelectCamp, 
  onFireCoach, 
  onPullYouth, 
  onClose,
  creditLimit 
}) => {
  const tier = state.club.tier;
  const country = state.club.country || 'GER';
  
  const costSpain = getLeagueScaledVal(tier, 9000, country);
  const costDubai = getLeagueScaledVal(tier, 25000, country);

  const canAfford = (c: number) => state.budget - c >= -(creditLimit || 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col justify-center items-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-[500px] bg-[#1c1c1e] rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/5 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{t(lang, 'Winter Training Camp', 'Winter-Trainingslager')}</h2>
            <p className="text-sm text-emerald-300 font-medium">{t(lang, 'Prepare for the 2nd Half', 'Vorbereitung auf die Rückrunde')}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors cursor-pointer">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Compact 1-Line Halfway Status Strip */}
        <div className="bg-[#141518] px-5 sm:px-6 py-2.5 border-b border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-medium tracking-tight">
          <span>{t(lang, 'Mid-Season', 'Hinrunde')}: <strong className="text-white font-bold">{state.midSeasonPts || 24} Pts</strong></span>
          <span className="text-zinc-600">·</span>
          <span>{t(lang, 'Board Target', 'Saisonziel')}: <strong className="text-sky-400 font-bold">Top {state.boardTargetFinish || 12}</strong></span>
          <span className="text-zinc-600">·</span>
          <span>{t(lang, 'Squad Morale', 'Kader-Moral')}: <strong className={`font-bold ${(state.club.morale ?? 100) >= 75 ? 'text-emerald-400' : (state.club.morale ?? 100) >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{state.club.morale ?? 100}%</strong></span>
        </div>

        <div className="p-5 sm:p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar space-y-4">
          <p className="text-[12px] text-[#8e8e93] font-medium leading-relaxed">
            {t(lang, 'Select a training camp destination to boost morale, tactical sharpness, and squad performance before the season resumes.', 'Wähle ein Trainingslager, um Moral, Taktik und Kaderform vor der Rückrunde gezielt zu stärken.')}
          </p>
          
          <div className="flex gap-2 mb-4">
            {onFireCoach && (
              <button onClick={onFireCoach} className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-bold py-2 px-3 rounded-xl transition text-[11px] flex items-center justify-center gap-2 cursor-pointer">
                <i className="fas fa-users-viewfinder"></i> {t(lang, 'Hire / Fire Coach', 'Trainer einstellen / feuern')}
              </button>
            )}
            {onPullYouth && state.youthPipeline && state.youthPipeline.length > 0 && (() => {
              const hasEligible = state.youthPipeline.some(y => y.timer <= 1);
              const hasLvl3 = (state.club.academyLevel || 1) >= 3;
              const disabled = !hasEligible || !hasLvl3;
              let tooltip = '';
              if (!hasLvl3) tooltip = t(lang, 'Requires Level 3 Youth Academy', 'Benötigt Akademie-Level 3');
              else if (!hasEligible) tooltip = t(lang, 'No eligible prospects next season', 'Kein Talent für nächste Saison bereit');

              return (
                <button 
                  onClick={disabled ? undefined : onPullYouth} 
                  title={tooltip}
                  disabled={disabled}
                  className={`flex-1 font-bold py-2 px-3 rounded-xl transition text-[11px] flex items-center justify-center gap-2 ${disabled ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-50' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 cursor-pointer'}`}>
                  <i className="fas fa-child"></i> {t(lang, 'Pull Youth', 'Talent vorziehen')}
                </button>
              );
            })()}
          </div>

          {/* Option 1: Domestic Tactical Lab */}
          <button onClick={() => onSelectCamp('local', 0)} className="w-full bg-[#2c2c2e]/60 hover:bg-[#3a3a3c] p-4 rounded-2xl border border-white/5 text-left transition cursor-pointer flex justify-between items-center group">
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <i className="fa-solid fa-flask-vial text-sky-400 text-xs"></i>
                <span>{t(lang, 'Domestic Tactical Lab', 'Heimisches Taktik-Labor')}</span>
              </div>
              <div className="text-[11px] text-[#8e8e93] mt-1">{t(lang, 'Tactical drills & intense video analysis.', 'Taktikschulung & Videoanalyse auf heimischer Anlage.')}</div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span>+6 {t(lang, 'Morale', 'Moral')}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-sky-300">{t(lang, '35% Chance +1 OVR (if Morale >= 80%)', '35% Chance auf +1 GES (bei Moral ≥ 80%)')}</span>
              </div>
            </div>
            <div className="text-xs font-black text-white bg-white/10 px-3 py-1.5 rounded-lg shrink-0">Free</div>
          </button>

          {/* Option 2: Warm-Weather Camp · Marbella */}
          <button onClick={() => onSelectCamp('spain', costSpain)} disabled={!canAfford(costSpain)} className="w-full bg-[#2c2c2e]/60 hover:bg-[#3a3a3c] p-4 rounded-2xl border border-white/5 text-left transition cursor-pointer flex justify-between items-center disabled:opacity-50 disabled:grayscale relative overflow-hidden group">
            <div className="relative z-10">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <i className="fa-solid fa-sun text-amber-400 text-xs"></i>
                <span>{t(lang, 'Warm-Weather Camp (Marbella)', 'Warmwetter-Camp (Marbella)')}</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Popular</span>
              </div>
              <div className="text-[11px] text-[#8e8e93] mt-1">{t(lang, 'Sunny conditions, youth integration & match sharpness.', 'Südliche Sonne, Talentförderung & Spielpraxis.')}</div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span>+12 {t(lang, 'Morale', 'Moral')}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-amber-300">45% {t(lang, 'Chance +1 OVR', 'Chance +1 GES')}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-sky-300">50% {t(lang, '+1 Youth OVR', '+1 Talent-GES')}</span>
              </div>
            </div>
            <div className={`relative z-10 text-xs font-black px-3 py-1.5 rounded-lg shrink-0 ${canAfford(costSpain) ? 'text-rose-300 bg-rose-500/10 border border-rose-500/20' : 'text-rose-400/50 bg-rose-500/5'}`}>
              -{formatMoney(costSpain, country)}
            </div>
          </button>

          {/* Option 3: Elite Commercial Tour (Doha/Tokyo) */}
          <button onClick={() => onSelectCamp('dubai', costDubai)} disabled={!canAfford(costDubai)} className="w-full bg-gradient-to-r from-amber-950/20 to-[#2c2c2e]/60 hover:from-amber-950/35 p-4 rounded-2xl border border-amber-500/25 text-left transition cursor-pointer flex justify-between items-center disabled:opacity-50 disabled:grayscale group">
            <div>
              <div className="font-bold text-amber-400 text-sm flex items-center gap-2">
                <i className="fa-solid fa-plane-departure text-amber-400 text-xs"></i>
                <span>{t(lang, 'Elite Commercial Tour (Doha/Tokyo)', 'Elite-Tour (Doha/Tokio)')}</span>
              </div>
              <div className="text-[11px] text-[#8e8e93] mt-1">{t(lang, 'World-class facilities & high-profile sponsor friendlies.', 'Weltklasse-Infrastruktur & lukrative Testspiele.')}</div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span>+20 {t(lang, 'Morale', 'Moral')}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-amber-300">65% {t(lang, 'Chance +1 OVR', 'Chance +1 GES')}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-sky-300">+2 Rep & Fans</span>
              </div>
            </div>
            <div className={`text-xs font-black px-3 py-1.5 rounded-lg shrink-0 ${canAfford(costDubai) ? 'text-rose-300 bg-rose-500/10 border border-rose-500/20' : 'text-rose-400/50 bg-rose-500/5'}`}>
              -{formatMoney(costDubai, country)}
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
