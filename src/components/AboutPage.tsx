import React, { useState } from 'react';
import { Club, Language } from '../types';
import { ALL_CLUBS } from '../data/clubsData';
import { DatabaseModal } from './DatabaseModal';

interface AboutPageProps {
  clubsDb?: Club[];
  lang: Language;
  onStartCareer?: () => void;
  onUpdateClubsDb?: (clubs: Club[], isModActive: boolean) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ 
  lang, 
  onStartCareer, 
  clubsDb = [],
  onUpdateClubsDb
}) => {
  const [showDbModal, setShowDbModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'updates' | 'basics' | 'tactics' | 'economy' | 'regulations'>('all');
  const isDe = lang === 'de'; // Kept to prevent undefined errors elsewhere, but we will bypass it.

  const calculateTiers = () => {
    const countries = Array.from(new Set(ALL_CLUBS.map(c => c.country || 'GER')));
    const stats: Record<string, number> = {};
    for (const c of countries) {
      const clubsInCountry = ALL_CLUBS.filter(club => (club.country || 'GER') === c).length;
      stats[c] = Math.max(1, Math.round(clubsInCountry / 18));
    }
    return {
      totalNations: countries.length,
      ger: stats['GER'] || 11,
      eng: stats['ENG'] || 7,
      ita: stats['ITA'] || 6,
      esp: stats['ESP'] || 6,
      fra: stats['FRA'] || 5,
      usa: stats['USA'] || 5,
    };
  };
  const tiers = calculateTiers();

  const filterTabs = [
    { id: 'all', label: 'All Topics' },
    { id: 'updates', label: 'Patch Notes' },
    { id: 'basics', label: 'Career & Basics' },
    { id: 'tactics', label: 'Tactics & Match Engine' },
    { id: 'economy', label: 'Economy & Facilities' },
    { id: 'regulations', label: 'Rules & Regulations' },
  ];

  return (
    <div className="w-full max-w-4xl px-4 sm:px-6 mt-6 sm:mt-10 mx-auto pb-24 text-zinc-300">
      {/* Ambient Lighting Glows */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-sky-500/[0.07] rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="text-center mb-12 sm:mb-16 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-sky-400 mb-5 tracking-wide backdrop-blur-md">
          <i className="fa-solid fa-compass text-sky-400"></i>
          <span>{isDe ? 'Kompendium & Spielmechaniken' : 'Rulebook & Game Mechanics'}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">v2.2</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-5">
          {isDe ? (
            <>
              35 Saisons.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-200 to-white">
                Die Spielregeln.
              </span>
            </>
          ) : (
            <>
              35 Seasons.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-200 to-white">
                Full Game Mechanics.
              </span>
            </>
          )}
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-zinc-400 font-normal max-w-2xl mx-auto leading-relaxed mb-8">
          {isDe
            ? 'Schlüpfe in die Rolle eines Sportdirektors. Wähle einen Verein oder starte in den unteren Ligen und arbeite dich hoch. Du hast 35 Saisons Zeit. Deine Entscheidungen im Kaderbau, bei Sponsoren, Taktiken und Stadionausbauten entscheiden über Triumph oder Abstieg.'
            : "Step into the shoes of a Sporting Director. Pick a club or start in the lower divisions working your way up. You have 35 seasons. Your off-season decisions—squad wage planning, transfer deals, commercial pitches, tactical setups, and stadium expansions—directly determine your club's fate."}
        </p>

        {clubsDb && clubsDb.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowDbModal(true)}
              className="bg-white/[0.05] hover:bg-white/[0.09] text-white border border-white/[0.12] hover:border-sky-400/40 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2.5 shadow-sm active:scale-95 cursor-pointer backdrop-blur-xl group"
            >
              <i className="fa-solid fa-database text-sky-400 group-hover:scale-110 transition-transform"></i>
              <span>{isDe ? 'Globale Datenbank durchsuchen' : 'Browse Global Database'}</span>
              <span className="text-[11px] text-zinc-500 tabular-nums">({ALL_CLUBS.length.toLocaleString()} Clubs)</span>
            </button>
          </div>
        )}
      </div>

      {/* Progressive Disclosure Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-3 mb-8 sm:mb-10 sm:justify-center">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === tab.id
                ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30 shadow-sm'
                : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Bento Grid */}
      <div className="space-y-6">
        {/* v2.2 Spotlight Bento Box */}
        {activeSection === 'updates' && (
          <div className="bg-gradient-to-br from-[#131724]/90 via-[#10121a]/90 to-[#0e1017]/90 border border-sky-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 rounded-xl">
                  v2.2 Spotlight
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  11-Tier Road-to-Glory, Finals Integrity & Delta Save Engine
                </h2>
              </div>
              <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                <i className="fa-solid fa-sparkles text-amber-400"></i>
                <span>Latest Release</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. True Finals Strength & Post-Season Decay */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-emerald-500/30 transition">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm mb-3 border border-emerald-500/20">
                    <i className="fa-solid fa-ranking-star"></i>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    True Crunch-Final OVR Timing
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Squad aging, Top-5 league poaching, and off-season decay now execute strictly after Decision Day, Cup Finals, and Season History—so your squad plays every final at full current-season strength.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-emerald-300/90 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Post-Final Off-Season Turnover</span>
                </div>
              </div>

              {/* 2. Tier 1–11 Road-to-Glory & Leaderboard Scaling */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-sky-500/30 transition">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-sm mb-3 border border-sky-500/20">
                    <i className="fa-solid fa-stairs"></i>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    Tier 1–11 Road-to-Glory Scaling
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Full Global Leaderboard badge support and +4,000 pt promotion bonuses across Tiers 6–11, plus authentic winter transfer accounting and fresh club Prestige Legacy milestones whenever you switch clubs.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-sky-300/90 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Deep Pyramid Progression</span>
                </div>
              </div>

              {/* 3. Dynamic Immunity Shield Cap */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-purple-500/30 transition">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm mb-3 border border-purple-500/20">
                    <i className="fa-solid fa-shield-heart"></i>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    Persistent Prestige & Vision Shields
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Bronze Statue (+1), Managerial Immortality (+3), and Board Vision roadmap Immunity Shield rewards now persist across browser reloads and restore up to your dynamic Prestige ceiling on trophy wins.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-purple-300/90 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Up to 6+ Prestige & Vision Shields</span>
                </div>
              </div>

              {/* 4. Delta-Compressed Multi-Slot Saves */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-amber-500/30 transition">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm mb-3 border border-amber-500/20">
                    <i className="fa-solid fa-floppy-disk"></i>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    Delta-Compressed Save Slots
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Multi-slot career saves now delta-compress 1,200+ clubs and strip non-active league standings archives, cutting save payloads by ~85% so 35-season and Endless careers never hit storage limits.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-amber-300/90 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Zero-Bloat Multi-Slot Storage</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* v2.1 Historical Archive Bento Box */}
        {activeSection === 'updates' && (
          <div className="bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl transition-all relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-white/[0.08] border border-white/[0.12] px-2.5 py-1 rounded-xl">
                  v2.1 Archive
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-200 tracking-tight">
                  360° Engine Parity, Global Fanbases & Facility Mastery
                </h2>
              </div>
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <i className="fa-solid fa-clock-rotate-left text-zinc-500"></i>
                <span>Archived Milestone</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Authentic Global Fanbases & Credit */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-emerald-500/30 transition">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm mb-3 border border-emerald-500/20">
                    <i className="fa-solid fa-earth-americas"></i>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    Global Fanbases & Tier Credit
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Superclubs and continental heavyweights now command authentic multi-million global fanbases (up to 6M+ at launch), paired with tier-calibrated bank credit facilities and dynamic attendance caps for sleeping giants.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-emerald-300/90 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>2.5M–6M Mega-Club Fanbases</span>
                </div>
              </div>

              {/* 2. 5-Tier Infrastructure & La Masia Dividend */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-sky-500/30 transition">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-sm mb-3 border border-sky-500/20">
                    <i className="fa-solid fa-building-columns"></i>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    1–5 Facility Scale & Dividends
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Standardized 1–5 progression for Youth Academy and Medical Center. Unlock +1 NLZ OVR graduation boosts at Level 3, 15% Golden Boy rolls at Level 4, 25% La Masia sell-on dividends at Level 5, and up to 100% squad decay immunity.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-sky-300/90 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Level 1–5 Academy & Medical</span>
                </div>
              </div>

              {/* 3. Youth Pipeline & Coaching Sync */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-purple-500/30 transition">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm mb-3 border border-purple-500/20">
                    <i className="fa-solid fa-seedling"></i>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    Youth Pipeline & Coaching Sync
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Full parity across Youth Academy, Incubator, and Youth Championship. Prospect talent boosts directly power tournament ratings, Youth Whisperer & Youth Focus traits accelerate development, and NLZ graduation bonuses sync 1:1.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-purple-300/90 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>100% Academy & Coach Parity</span>
                </div>
              </div>

              {/* 4. Perks, Identities & Tactical Promises */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-amber-500/30 transition">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm mb-3 border border-amber-500/20">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    Perks, Identities & Tactics
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Every promised perk and tactical ethos is wired end-to-end: Board Darling sacking immunity, Board Favorite +15 trust floor, Defensive -40% negative GD & 4-year insolvency grace period, and persistent Macro Club Identities.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-amber-300/90 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>360° Perk & Tactical Integrity</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* v2.0 Historical Archive Bento Box */}
        {activeSection === 'updates' && (
          <div className="bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl transition-all relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-white/[0.08] border border-white/[0.12] px-2.5 py-1 rounded-xl">
                  v2.0 Archive
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-200 tracking-tight">
                  Game Logic Updates & Realism Engine
                </h2>
              </div>
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <i className="fa-solid fa-clock-rotate-left text-zinc-500"></i>
                <span>Archived Milestone</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Natural Points & Table Physics */}
              <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:border-white/[0.12] transition">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs mb-2.5 border border-emerald-500/20">
                    <i className="fa-solid fa-chart-line"></i>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-200 mb-1">
                    Natural Standings & Points Curves
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                    Authentic win, draw, and loss distributions across 34 matchdays. Smooth 2–3 point rank step-downs, realistic goal differences, and strict elimination of artificial point gaps.
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-zinc-400 pt-2 border-t border-white/[0.04] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Smooth Table Physics & Real Draws</span>
                </div>
              </div>

              {/* 2. Reserve Club Regulations */}
              <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:border-white/[0.12] transition">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs mb-2.5 border border-rose-500/20">
                    <i className="fa-solid fa-ban"></i>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-200 mb-1">
                    Reserve Club Promotion Caps
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                    Strict Tier 3 ceiling preventing B-teams and reserve squads from entering professional 1st and 2nd divisions, with automatic cascaded promotion spots for eligible clubs.
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-zinc-400 pt-2 border-t border-white/[0.04] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Tier 3 B-Team Ceiling & Cascade</span>
                </div>
              </div>

              {/* 3. Continental Spots & Coefficients */}
              <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:border-white/[0.12] transition">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center text-xs mb-2.5 border border-sky-500/20">
                    <i className="fa-solid fa-trophy"></i>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-200 mb-1">
                    Continental Spots & Tournaments
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                    Authentic qualification spot logic across UEFA Champions League, Europa League, and Conference League with domestic cup winner integration and prestige scaling.
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-zinc-400 pt-2 border-t border-white/[0.04] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>UEFA UCL, UEL & UECL Pathways</span>
                </div>
              </div>

              {/* 4. Dynamic Scoring & Pyramid Floor */}
              <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:border-white/[0.12] transition">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs mb-2.5 border border-amber-500/20">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-200 mb-1">
                    Dynamic Scoring & Pyramid Floor
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                    Wide dynamic match scoring range from gritty 1-0 defensive grinds to 5-3 thrillers and marathon sudden-death shootouts, alongside Sporting Relegation Pyramid Floor protection.
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-zinc-400 pt-2 border-t border-white/[0.04] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Pyramid Floor Dismissal & Scoring Range</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* v1.9 Historical Archive Bento Box */}
        {activeSection === 'updates' && (
          <div className="bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl transition-all relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-white/[0.08] border border-white/[0.12] px-2.5 py-1 rounded-xl">
                  v1.9 Archive
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-200 tracking-tight">
                  Editor, Design, Mods & World Cup
                </h2>
              </div>
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <i className="fa-solid fa-clock-rotate-left text-zinc-500"></i>
                <span>{isDe ? 'Archivierte Version' : 'Archived Milestone'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Club & Roster Editor */}
              <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:border-white/[0.12] transition">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center text-xs mb-2.5 border border-sky-500/20">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-200 mb-1">
                    {isDe ? 'Roster & Club Editor' : 'Roster & Club Editor'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                    {isDe
                      ? 'Vollständiger In-Game-Editor für alle Vereine: Passe Teamnamen, OVR-Stärke, Stadionkapazität und Finanzen direkt an und exportiere/importiere JSON-Patches.'
                      : 'Live roster & database editor: Customize any club name, OVR rating, stadium capacity, and transfer budget with instant JSON patch export & import.'}
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-zinc-400 pt-2 border-t border-white/[0.04] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Live DB & JSON Patches</span>
                </div>
              </div>

              {/* 2. v1.9 Design */}
              <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:border-white/[0.12] transition">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs mb-2.5 border border-indigo-500/20">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-200 mb-1">
                    {isDe ? 'v1.9 Modern Design' : 'Broadcast UI & Glass Theme'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                    {isDe
                      ? 'Dunkles Glasmorphismus-Interface, echte TV-Broadcast-Grafiken mit Senderlogos (BBC, ESPN, Sky), verfeinerte Typografie und mobil-optimierte Modals.'
                      : 'High-fidelity dark glassmorphic UI, authentic TV broadcast scoreboards (BBC, ESPN, Sky), refined typography, and responsive mobile modals.'}
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-zinc-400 pt-2 border-t border-white/[0.04] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Broadcast UI & Dark Theme</span>
                </div>
              </div>

              {/* 3. Community Mods */}
              <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:border-white/[0.12] transition">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs mb-2.5 border border-emerald-500/20">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-200 mb-1">
                    {isDe ? 'CR27 Community Mods' : 'CR27 Community Mods'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                    {isDe
                      ? '1-Klick-Aktivierung des Community-Datenpakets mit 1.202 authentischen Vereinen, Wappen und Stadien. Volle Unterstützung für eigene JSON-Dateien und Patches.'
                      : '1-click toggle for extended community database with 1,202 authentic clubs, crest artwork, and venues. Full custom JSON patch import and club lore support.'}
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-zinc-400 pt-2 border-t border-white/[0.04] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span className="tabular-nums">{isDe ? '1.202 Vereine & Wappen' : '1,202 Clubs & Crests'}</span>
                </div>
              </div>

              {/* 4. World Cups & Tournaments */}
              <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:border-white/[0.12] transition">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs mb-2.5 border border-amber-500/20">
                    <i className="fa-solid fa-earth-americas"></i>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-200 mb-1">
                    {isDe ? 'World Cup & Turniere' : 'World Cups & Tournaments'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                    {isDe
                      ? '4-Jahres-Turnierzyklus mit Host-Nations (2026 USA, 2030 Spanien, 2034 Japan, 2038 Deutschland, 2042 Brasilien). Steuere Kaderstrategie, Cheftrainer und Verbandsinvestitionen.'
                      : '4-year tournament cycle featuring host nation spotlights (2026 USA, 2030 Spain, 2034 Japan, 2038 Germany, 2042 Brazil). Take charge with squad directions, coach hiring, and federation investments.'}
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-zinc-400 pt-2 border-t border-white/[0.04] flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-400"></i>
                  <span>Group Stage & Knockout Finals</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 35-Year Career Objective */}
        {(activeSection === 'all' || activeSection === 'basics') && (
          <div className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition-all rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-lg border border-sky-500/20">
                <i className="fa-solid fa-trophy"></i>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 mb-1">
                  {isDe ? 'Karriereziel' : 'Career Objective'}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {isDe ? 'Das 35-Jahre-Karriereziel in weltweiten Ligen' : 'The 35-Year Career Objective Across Global Nations'}
                </h3>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              {isDe
                ? `Du hast genau 35 Saisons Zeit, um dir einen unvergesslichen Namen in der Weltfussball-Geschichte zu machen! Wähle aus ${tiers.totalNations} offiziellen Fussball-Nationen, darunter riesige Ligasysteme in Deutschland (${tiers.ger} Ligen), England (${tiers.eng} Ligen), Italien (${tiers.ita} Ligen), Spanien (${tiers.esp} Ligen), Frankreich (${tiers.fra} Ligen) und den USA (${tiers.usa} Ligen), bis hin zu weltweiten Ligen in Japan, Brasilien, Argentinien und Australien.`
                : `You have exactly 35 seasons to build an unassailable legacy in world football! Choose from ${tiers.totalNations} active football nations featuring massive pyramids in Germany (${tiers.ger} Leagues), England (${tiers.eng} Leagues), Italy (${tiers.ita} Leagues), Spain (${tiers.esp} Leagues), France (${tiers.fra} Leagues), and the USA (${tiers.usa} Leagues), alongside diverse global leagues like Japan, Brazil, Argentina, and Australia.`}
            </p>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-xs">
              <span className="font-semibold text-amber-300 block mb-1">
                {isDe ? 'Nationale & Internationale Pokaljagd:' : 'Domestic & International Cup Glory:'}
              </span>
              <p className="text-zinc-400 leading-relaxed">
                {isDe
                  ? 'Kämpfe um nationale Meisterschaften, prestigeträchtige Pokalwettbewerbe (National Cup, Regional Cup) und internationale Kontinental-Trophäen (Elite Cup, Euro Cup, Euro Challenge Cup, Americas Elite Cup & North American Elite Cup)!'
                  : 'Compete for domestic league championships, prestigious national cup runs (National Cup, Regional Cup), and continental silverware (Elite Cup, Euro Cup, Euro Challenge Cup, Americas Elite Cup & North American Elite Cup)!'}
              </p>
            </div>
          </div>
        )}

        {/* How to Play & Win (Core Loop) */}
        {(activeSection === 'all' || activeSection === 'basics') && (
          <div className="bg-gradient-to-br from-emerald-950/30 via-[#12141c] to-[#12141c] border border-emerald-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/30">
                <i className="fa-solid fa-gamepad"></i>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                  Instruction Manual
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  How to Play & Win
                </h3>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              Success requires balancing on-pitch results with boardroom finances. If you focus only on buying star players without upgrading your stadium or securing sponsors, you will go bankrupt. If you focus only on hoarding money, your squad will decay, and you will be relegated and sacked. Follow this core loop to survive your 35-season career:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-110"></div>
                <span className="text-sky-400 font-black text-2xl mb-2 block opacity-50">01</span>
                <strong className="text-white block mb-1.5 text-sm">Align the Club</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Select your <b>Club DNA (Tactic)</b> and hire a <b>Head Coach</b> whose preferred style matches it to gain a +2 OVR system synergy. Mismatches cause immediate squad mutinies.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-110"></div>
                <span className="text-amber-400 font-black text-2xl mb-2 block opacity-50">02</span>
                <strong className="text-white block mb-1.5 text-sm">Build the Squad</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Recruit wonderkids from your Academy, sign transfers, and pitch commercial sponsors to fund your wage bill. Keep your squad size manageable (18-50 players).
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-110"></div>
                <span className="text-purple-400 font-black text-2xl mb-2 block opacity-50">03</span>
                <strong className="text-white block mb-1.5 text-sm">Scale Infrastructure</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Expand your <b>Stadium</b> to meet league requirements and boost Matchday Revenue. Upgrade <b>Medical</b> and <b>Academy</b> facilities to attract elite coaches.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-110"></div>
                <span className="text-rose-400 font-black text-2xl mb-2 block opacity-50">04</span>
                <strong className="text-white block mb-1.5 text-sm">Survive & Adapt</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Simulate the season. <b>Never finish 3 consecutive seasons in debt</b>, or you face insolvency. Meet board targets to earn Immunity Shields, and adapt your tactics when they go stale.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Director Points & Reputation */}
        {(activeSection === 'all' || activeSection === 'basics') && (
          <div className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition-all rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg border border-amber-500/20">
                <i className="fa-solid fa-crown"></i>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1">
                  {isDe ? 'Progressionssystem' : 'Progression System'}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {isDe ? 'Direktor-Punkte & Ansehen-System' : 'Director Points & Reputation System'}
                </h3>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              {isDe
                ? 'Jeder Meisterschaftstitel, Aufstieg, Pokalsieg und gelöste Krisen bringen dir wertvolle Direktor-Punkte. Deine Direktor-Reputation ist bis 100 gedeckelt und bestimmt zusammen mit dem Vereins-Ansehen (1 bis 100), welche europäischen Top-Klubs dir Verträge anbieten.'
                : 'Every league title, promotion, cup victory, and resolved board crisis earns you valuable Director Points. Your Director Reputation is capped at 100 and works alongside Club Reputation (1 to 100) to unlock job offers from world-class clubs.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
                <span className="font-semibold text-amber-300 block mb-1">
                  {isDe ? 'Jobangebote von Top-Klubs' : 'Elite Job Offers'}
                </span>
                <span className="text-zinc-400 leading-relaxed">
                  {isDe
                    ? 'Höhere Reputation schaltet lukrative Angebote von europäischen Schwergewichten frei.'
                    : 'Higher reputation unlocks lucrative job offers from European giants.'}
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
                <span className="font-semibold text-yellow-300 block mb-1">
                  {isDe ? 'Vorstands-Puffer & Ultimatum-Schutz' : 'Board Trust & Crisis Cushion'}
                </span>
                <span className="text-zinc-400 leading-relaxed">
                  {isDe
                    ? 'Erfahrene Legenden geniessen bei Vorstand und Fans höhere Toleranz bei Schwächephasen.'
                    : 'Proved legendary directors gain higher board tolerance during temporary slumps.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tactics & Match Engine */}
        {(activeSection === 'all' || activeSection === 'tactics') && (
          <div className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition-all rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/20">
                <i className="fa-solid fa-chess-board"></i>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                  {isDe ? 'Simulations-Engine' : 'Simulation Engine'}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {isDe ? 'Taktik & Match-Engine' : 'Tactics & Match Engine'}
                </h3>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              {isDe
                ? 'Die Ergebnisse basieren auf dem Kader-GES (Gesamtwertung) deines Teams im Vergleich zum Ligaschnitt. Deine gewählte Taktik verändert Tore und Gegentore gezielt:'
                : "Match outcomes are simulated based on your squad's Overall Rating (OVR) relative to your league's average strength. Your tactical style directly modifies offensive and defensive outputs:"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <div className="font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-bolt"></i> Gegenpressing
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe
                    ? '+15% Tore erzielt, +10% Gegentore. Hohes Tempo & Risiko.'
                    : '+15% Goals Scored, +10% Goals Conceded. High tempo & chaos.'}
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <div className="font-semibold text-sky-400 mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-arrows-spin"></i> Tiki-Taka
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe
                    ? '+10% Tore erzielt, -5% Gegentore. Kontrollierter Ballbesitz.'
                    : '+10% Goals Scored, -5% Goals Conceded. Controlled possession.'}
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <div className="font-semibold text-purple-400 mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-fire"></i> Total Football
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe
                    ? '+20% Tore erzielt, +15% Gegentore. Maximale Offensive.'
                    : '+20% Goals Scored, +15% Goals Conceded. Maximum firepower.'}
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <div className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-shield-halved"></i> Park the Bus (Catenaccio)
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe
                    ? '-15% Tore erzielt, -25% Gegentore. Defensive Abwehrfestung.'
                    : '-15% Goals Scored, -25% Goals Conceded. Defensive lockdown.'}
                </p>
              </div>
            </div>

            {/* Tactical Meta Duels Note */}
            <div className="mt-4 bg-sky-500/[0.04] border border-sky-400/20 rounded-2xl p-4 text-xs">
              <span className="font-semibold text-sky-300 block mb-1">
                {isDe ? 'Liga-Meta & Pokal-Duelle:' : 'League Meta & Cup Run Duels:'}
              </span>
              <p className="text-zinc-400 leading-relaxed">
                {isDe
                  ? 'Gegenpressing schlägt Tiki-Taka, Direct Counter schlägt Gegenpressing, Catenaccio kontert Direct Counter und Tiki-Taka knackt Catenaccio. Das Auskontern der gegnerischen Ausrichtung sichert einen +6 GES Vorteil!'
                  : 'Gegenpressing beats Tiki-Taka, Direct Counter beats Gegenpress, Catenaccio blocks Direct Counter, and Tiki-Taka dismantles Catenaccio. Countering the opponent grants a crucial +6 OVR advantage!'}
              </p>
            </div>
          </div>
        )}

        {/* Director Archetypes */}
        {(activeSection === 'all' || activeSection === 'basics') && (
          <div className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition-all rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-lg border border-sky-500/20">
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 mb-1">
                  {isDe ? 'Spezialisierung' : 'Specialization'}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {isDe ? 'Direktor-Archetypen' : 'Director Archetypes'}
                </h3>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              {isDe
                ? 'Zu Beginn deiner Karriere wählst du einen Archetypen, der deinen Hintergrund und deine Spezialisierung als Sportdirektor definiert:'
                : 'At the start of your career, you select an archetype that defines your background and specialization as a Sporting Director:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
                <strong className="text-white block mb-1 text-sm">👔 {isDe ? 'Standard-Direktor' : 'Standard Director'}</strong>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe ? 'Ein ausgewogener Ansatz. Keine Boni oder Strafen. Du beginnst als unbeschriebenes Blatt.' : 'A balanced approach. No special bonuses or penalties. You start as a blank slate.'}
                </p>
              </div>

              <div className="bg-white/[0.02] p-4 rounded-2xl border border-amber-500/20">
                <strong className="text-amber-400 block mb-1 text-sm">⭐ {isDe ? 'Vereinslegende' : 'Club Legend'}</strong>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe ? 'Als ehemaliger Starspieler genießt du massiven Rückhalt. Startet mit leicht erhöhtem Ruf und +5 Team-Moral.' : 'As a former star player, you command dressing room authority. Starts with boosted reputation and +5 Team Morale.'}
                </p>
              </div>

              <div className="bg-white/[0.02] p-4 rounded-2xl border border-emerald-500/20">
                <strong className="text-emerald-400 block mb-1 text-sm">📈 {isDe ? 'Finanz-Guru' : 'Finance Guru'}</strong>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe ? 'Wirtschaftliche Weitsicht. Startet mit +25% Startbudget und einem +20% Verhandlungsbonus auf alle Sponsorenverträge.' : 'Financial acumen. Starts with +25% Starting Budget and a permanent +20% bonus on sponsor deal valuations.'}
                </p>
              </div>

              <div className="bg-white/[0.02] p-4 rounded-2xl border border-purple-500/20">
                <strong className="text-purple-400 block mb-1 text-sm">🔍 {isDe ? 'NLZ-Architekt (Talent-Scout)' : 'Academy Architect (Talent Scout)'}</strong>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe ? 'Meister der Nachwuchsförderung. Erhält 35% Rabatt auf alle NLZ-Ausbauten und startet mit Stufe 2.' : 'Master of youth development. Enjoys 35% discount on all Academy facility upgrade costs and starts with Level 2.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* The Head Coach Importance */}
        {(activeSection === 'all' || activeSection === 'basics' || activeSection === 'tactics') && (
          <div className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition-all rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-lg border border-rose-500/20">
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 mb-1">
                  Critical Personnel
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  The Power of the Head Coach
                </h3>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              The Head Coach is the most critical asset in your club. They are not just a static stat boost; they are the operational bottleneck of your entire footballing strategy. Hiring the wrong manager can destroy years of club development.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <strong className="text-white block mb-1 text-sm flex items-center gap-1.5"><i className="fa-solid fa-seedling text-emerald-400"></i> Academy Gatekeepers</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Wonderkids are useless if the manager refuses to play them. "Pragmatists" and "Disciplinarians" will actively halve the OVR impact of any youth prospect promoted to the senior squad.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <strong className="text-white block mb-1 text-sm flex items-center gap-1.5"><i className="fa-solid fa-arrows-split-up-and-left text-rose-400"></i> Tactical Mutinies</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Your coach's style must align with the Club DNA. Hiring a stubborn "Dogmatist" with a mismatched system will trigger an immediate Dressing Room Mutiny (-25 Morale, -5 OVR)!
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <strong className="text-white block mb-1 text-sm flex items-center gap-1.5"><i className="fa-solid fa-handshake text-sky-400"></i> Transfer Modifiers</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Coaches directly influence the transfer market. A "Talent Magnet" increases the success rate of marquee signings, while a "Cursed" manager will cause deals to flop.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <strong className="text-white block mb-1 text-sm flex items-center gap-1.5"><i className="fa-solid fa-building-columns text-amber-400"></i> Identity Rejection</strong>
                <p className="text-zinc-400 leading-relaxed">
                  The board enforces your Macro Club Identity. If you operate a "Galactico Enterprise" but hire a gritty "Pragmatic Grinder", the board will intervene and tank your Trust Score.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Infrastructure & Morale */}
        {(activeSection === 'all' || activeSection === 'economy') && (
          <div className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition-all rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/20">
                <i className="fa-solid fa-city"></i>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                  {isDe ? 'Infrastruktur' : 'Facilities & Chemistry'}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {isDe ? 'Vereinsinfrastruktur & Team-Moral' : 'Club Infrastructure & Squad Morale'}
                </h3>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              {isDe
                ? 'Der Bau von Vereinsinfrastruktur bringt mächtige Langzeitboni, erfordert jedoch diszipliniertes Kostenmanagement:'
                : 'Building club infrastructure provides powerful long-term bonuses but requires disciplined overhead management:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/[0.02] border border-emerald-500/20 rounded-2xl p-4">
                <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-graduation-cap"></i> {isDe ? 'Jugendakademie (Stufe 1–5)' : 'Youth Academy (Level 1–5)'}
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe
                    ? 'Fördert Jahrhundert-, Top- und Lokaltalente. Ab Stufe 3 gibt es +1 NLZ-GES beim Profivertrag, ab Stufe 4 eine 15% Golden-Boy-Chance und auf Stufe 5 eine 25% La-Masia-Verkaufsdividende.'
                    : 'Produces Generational, Top, and Local prospects. Unlock +1 NLZ OVR graduation boosts at Level 3, 15% Golden Boy rolls at Level 4, and a 25% La Masia sell-on dividend at Level 5.'}
                </p>
              </div>

              <div className="bg-white/[0.02] border border-pink-500/20 rounded-2xl p-4">
                <div className="font-semibold text-pink-400 mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-heart-pulse"></i> {isDe ? 'Medizinabteilung (Stufe 1–5)' : 'Medical Facility (Level 1–5)'}
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe
                    ? 'Schützt deinen Kader vor saisonalem Verschleiß und Altersverfall: Stufe 4 bietet 80% Schutz, Stufe 5 gewährt 100% Immunität gegen Kader-Verfall in der Sommerpause.'
                    : 'Protects your squad from off-season wear-and-tear decay: Level 4 provides 80% protection, while Level 5 grants 100% wear-and-tear decay immunity.'}
                </p>
              </div>

              <div className="bg-white/[0.02] border border-indigo-500/20 rounded-2xl p-4">
                <div className="font-semibold text-indigo-400 mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-users"></i> {isDe ? 'Kader-Moral & Egos' : 'Squad Morale & Egos'}
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  {isDe
                    ? 'Superstars (>85 GES) erfordern Balance. Fällt die Moral unter 40%, verweigern neue Stars Wechsel zu deinem Klub.'
                    : 'Managing superstars (>85 OVR) creates friction. Below 40% morale, marquee transfer targets will decline talks.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Economy, Scaling & Debt Rules */}
        {(activeSection === 'all' || activeSection === 'economy' || activeSection === 'regulations') && (
          <div className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition-all rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg border border-amber-500/20">
                <i className="fa-solid fa-file-invoice-dollar"></i>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1">
                  {isDe ? 'Finanzkontrolle & FFP' : 'Financial Controls & FFP'}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {isDe ? 'Finanzen, Gehaltsgefüge & Schuldenregeln' : 'Financial Economy, Wages & Debt Insolvency'}
                </h3>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              {isDe
                ? 'Das Wirtschaftssystem skaliert präzise über alle Ligen. Wer in Unterligen über seine Verhältnisse lebt, riskiert Verbandsstrafen:'
                : 'The financial engine scales strictly across all divisions. Overspending triggers regulatory intervention:'}
            </p>

            <div className="space-y-3 text-xs">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <div className="font-semibold text-white mb-1.5 flex items-center gap-2">
                  <i className="fa-solid fa-sack-dollar text-emerald-400"></i>
                  <span>{isDe ? 'Einnahmenquellen' : 'Revenue Channels'}</span>
                </div>
                <ul className="text-zinc-400 space-y-1 pl-1">
                  <li>• <strong>{isDe ? 'Spieltag' : 'Matchday'}:</strong> {isDe ? 'Zuschauer × Ticketpreis × 17 Heimspiele.' : 'Attendance × Ticket Price × 17 Home Fixtures.'}</li>
                  <li>• <strong>{isDe ? 'TV & Platzierung' : 'TV & Position'}:</strong> {isDe ? 'Skaliert dynamisch basierend auf deiner Liga.' : 'Scales dynamically by League Tier.'}</li>
                  <li>• <strong>{isDe ? 'Europapokal & Sponsoren' : 'Continental & Sponsors'}:</strong> {isDe ? 'Preise für Elite Cup / Euro Cup sowie Handgelder für Pitch-Ziele.' : 'Prize money from Elite Cup / Euro Cup plus commercial pitches.'}</li>
                </ul>
              </div>

              <div className="bg-rose-500/[0.04] border border-rose-500/20 rounded-2xl p-4">
                <div className="font-semibold text-rose-300 mb-1.5 flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
                  <span>{isDe ? 'Schulden & 3-Jahre-Insolvenzregel' : 'Debt & 3-Year Insolvency Rule'}</span>
                </div>
                <p className="text-zinc-400 leading-relaxed mb-2">
                  {isDe
                    ? 'Saisonabschluss im Minus führt zu 5% Zinsen und automatischen Liga-Punktabzügen (-3 Pkt. im 1. Schuldenjahr, -6 Pkt. im 2., -9 Pkt. im 3. Schuldenjahr).'
                    : 'Finishing in debt triggers 5% interest and automatic point deductions (-3 Pts in 1st debt year, -6 Pts in 2nd, -9 Pts in 3rd).'}
                </p>
                <div className="text-[11px] text-rose-300 font-medium">
                  {isDe
                    ? 'Nach 3 aufeinanderfolgenden Schuldenjahren droht die Insolvenz: Notverkäufe oder Zwangsabstieg! (Defensive / Catenaccio-Taktiken verlängern diese Frist auf 4 Jahre).'
                    : 'Finishing 3 consecutive years in the red forces an Insolvency Crisis: emergency fire sale or total demotion! (Defensive / Catenaccio tactics extend the 3-year insolvency grace period to 4 years).'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regulations: Stadiums & Reserve Teams */}
        {(activeSection === 'all' || activeSection === 'regulations') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stadium Standards */}
            <div className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition-all rounded-3xl p-6 backdrop-blur-2xl">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm mb-3 border border-purple-500/20">
                <i className="fa-solid fa-building"></i>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {isDe ? 'Stadion-Standards (ab League 3)' : 'Stadium Standards (League 3+)'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                {isDe
                  ? 'Offizielle Verbandskriterien: League 3 (10.000 Plätze), League 2 (15.000 Plätze), League 1 (25.000 Plätze). Wer im Untermaß spielt, zahlt Ausweichmiete und verliert Heimvorteil.'
                  : 'Official criteria: League 3 (10,000 seats), League 2 (15,000 seats), League 1 (25,000 seats). Undersized venues incur lease fees and crowd pressure handicaps.'}
              </p>
              <div className="text-[11px] text-purple-300 font-semibold pt-2 border-t border-white/[0.05]">
                {isDe ? 'Rechtzeitiger Ausbau spart Millionen' : 'Expand facilities early to retain gate receipts'}
              </div>
            </div>

            {/* Reserve Teams */}
            <div className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition-all rounded-3xl p-6 backdrop-blur-2xl">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm mb-3 border border-amber-500/20">
                <i className="fa-solid fa-ban"></i>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {isDe ? "Reserve-Teams ('II')" : "Reserve Sides ('II' Teams)"}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                {isDe
                  ? "Zweitvertretungen (z.B. FC Bavaria II) dürfen nicht in die 1. Liga aufsteigen, sind von nationalen und europäischen Pokalen ausgeschlossen und haben eine Fan-Deckelung auf 900 Zuschauer."
                  : 'Reserve clubs are barred from top-flight promotion, ineligible for cup competitions, and feature capped fanbases at max 900 supporters.'}
              </p>
              <div className="text-[11px] text-amber-300 font-semibold pt-2 border-t border-white/[0.05]">
                {isDe ? 'Erhalten dafür Mutterverein-Zuschüsse' : 'Receive automatic parent club operating grants'}
              </div>
            </div>
          </div>
        )}

        {/* Endless Mode & Highscores */}
        {(activeSection === 'all' || activeSection === 'basics') && (
          <div className="bg-gradient-to-r from-sky-500/[0.06] via-white/[0.02] to-amber-500/[0.06] border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <i className="fa-solid fa-infinity text-sky-400"></i>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  {isDe ? 'Post-Karriere' : 'Post-Career'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1.5">
                {isDe ? 'Endlosmodus & Weltweite Rangliste' : 'Endless Mode & Global Leaderboard'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isDe
                  ? 'Nach 35 Saisons wird dein Punktestand im weltweiten Leaderboard verewigt. Danach kannst du nahtlos im Endlosmodus weiterspielen.'
                  : 'After 35 seasons, your career score is officially etched into the global leaderboard. You can continue indefinitely in Endless Mode.'}
              </p>
            </div>
            <div className="bg-white/[0.04] px-5 py-3 rounded-2xl border border-white/[0.08] text-center shrink-0">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                {isDe ? 'Max. möglich' : 'Max Possible'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-white tabular-nums">~584.500</span>
            </div>
          </div>
        )}
      </div>

      {/* Career Launch Action */}
      {onStartCareer && (
        <div className="text-center mt-12 sm:mt-16">
          <button
            onClick={onStartCareer}
            className="inline-flex items-center gap-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm sm:text-base py-3.5 px-8 rounded-2xl transition active:scale-95 shadow-sm border border-sky-400/30 cursor-pointer group"
          >
            <span>{isDe ? 'Karriere starten' : 'Start Your Career'}</span>
            <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
      )}

      {showDbModal && clubsDb && clubsDb.length > 0 && (
        <DatabaseModal 
          clubs={clubsDb} 
          lang={lang} 
          onClose={() => setShowDbModal(false)} 
          onUpdateClubsDb={onUpdateClubsDb}
        />
      )}
    </div>
  );
};
