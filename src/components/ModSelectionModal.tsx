import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Club, Language } from '../types';
import { ALL_CLUBS } from '../data/clubsData';
import {
  REALDATA_MOD_NAME,
  REALDATA_MOD_FILE,
  REALDATA_MOD_VERSION,
  REALDATA_MOD_CLUBS_COUNT,
  isRealDataModActive,
  setRealDataModActive,
  getCustomDb,
  setCustomDb,
  getActiveClubs,
  getRealDataClubs,
  getDefaultClubs,
  fetchModDataDatabase,
  validateCustomDb,
} from '../utils/modManager';
import { useModalDismiss } from '../utils/modalUtils';

interface ModSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onDatabaseChange?: (clubs: Club[]) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  initialTab?: 'changelog' | 'mods';
}

export const ModSelectionModal: React.FC<ModSelectionModalProps> = ({
  isOpen,
  onClose,
  lang,
  onDatabaseChange,
  showToast,
  initialTab = 'changelog',
}) => {
  useModalDismiss(onClose, isOpen);
  const isDe = false;

  const [activeTab, setActiveTab] = useState<'changelog' | 'mods'>(initialTab);
  const [realDataActive, setRealDataActiveState] = useState<boolean>(isRealDataModActive());
  const [customClubs, setCustomClubsState] = useState<Club[] | null>(getCustomDb());
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isV20Expanded, setIsV20Expanded] = useState<boolean>(false);
  const [isV19Expanded, setIsV19Expanded] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setRealDataActiveState(isRealDataModActive());
      setCustomClubsState(getCustomDb());
      setFeedbackMsg(null);
      if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentClubs = customClubs ? customClubs : (realDataActive ? getRealDataClubs() : getDefaultClubs());
  const currentCount = currentClubs.length;

  const getActiveName = () => {
    if (customClubs) {
      return isDe ? 'Benutzerdefinierte Mod (Upload)' : 'Custom Community JSON Mod';
    }
    if (realDataActive) {
      return REALDATA_MOD_NAME;
    }
    return isDe ? 'Standard Handball Basis-Datenbank' : 'Standard Handball Base DB';
  };

  const handleToggleRealData = async () => {
    const nextState = !realDataActive;
    setRealDataActiveState(nextState);
    setRealDataModActive(nextState);

    // If custom database was uploaded and user toggles real data, clear custom
    if (customClubs) {
      setCustomDb(null);
      setCustomClubsState(null);
    }

    let updatedClubs = nextState ? getRealDataClubs() : getDefaultClubs();
    if (nextState) {
      try {
        const fetched = await fetchModDataDatabase();
        if (fetched && fetched.length > 0) {
          updatedClubs = fetched;
        }
      } catch (err) {
        console.warn('Fallback to bundled realdata', err);
      }
    }

    if (onDatabaseChange) {
      onDatabaseChange(updatedClubs);
    }

    const msg = nextState
      ? (isDe
          ? `${REALDATA_MOD_NAME} via ${REALDATA_MOD_FILE} aktiviert!`
          : `${REALDATA_MOD_NAME} activated via ${REALDATA_MOD_FILE}!`)
      : (isDe ? 'Standard-Datenbank wiederhergestellt.' : 'Default database restored.');

    setFeedbackMsg({ text: msg, type: 'success' });
    if (showToast) {
      showToast(msg, 'success');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (validateCustomDb(parsed)) {
          setCustomDb(parsed);
          setCustomClubsState(parsed);
          setRealDataActiveState(false);
          setRealDataModActive(false);

          if (onDatabaseChange) {
            onDatabaseChange(parsed);
          }

          const msg = isDe
            ? `Eigene Mod mit ${parsed.length} Vereinen erfolgreich geladen!`
            : `Custom Mod with ${parsed.length} clubs loaded successfully!`;

          setFeedbackMsg({ text: msg, type: 'success' });
          if (showToast) showToast(msg, 'success');
        } else {
          const err = isDe
            ? 'Ungültiges JSON-Format. Erforderlich: id, name, tier, baseOvr.'
            : 'Invalid JSON schema. Missing required fields: id, name, tier, baseOvr.';
          setFeedbackMsg({ text: err, type: 'error' });
          if (showToast) showToast(err, 'error');
        }
      } catch (err) {
        const errStr = isDe ? 'Fehler beim Parsen der JSON-Datei.' : 'Failed to parse JSON file.';
        setFeedbackMsg({ text: errStr, type: 'error' });
        if (showToast) showToast(errStr, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportBase = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ALL_CLUBS, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'handball_base_database.json');
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();

    const msg = isDe
      ? 'handball_base_database.json erfolgreich exportiert!'
      : 'handball_base_database.json exported successfully!';
    setFeedbackMsg({ text: msg, type: 'success' });
    if (showToast) showToast(msg, 'success');
  };

  const handleResetToDefault = () => {
    setCustomDb(null);
    setCustomClubsState(null);
    setRealDataActiveState(false);
    setRealDataModActive(false);

    if (onDatabaseChange) {
      onDatabaseChange(getDefaultClubs());
    }

    const msg = isDe ? 'Standard-Datenbank zurückgesetzt.' : 'Reset to default database.';
    setFeedbackMsg({ text: msg, type: 'success' });
    if (showToast) showToast(msg, 'info');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0a0a0c]/85 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* Modal Plaque Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl mx-auto my-auto max-h-[92vh] flex flex-col rounded-2xl bg-[#14151e] border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden z-10"
        >
          {/* Subtle Top Edge Hairline Highlight */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

          {/* Modal Header */}
          <div className="relative pt-6 px-6 sm:px-7 pb-4 text-center shrink-0 border-b border-white/[0.04]">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition duration-150 cursor-pointer active:scale-95"
              aria-label="Close"
            >
              <i className="fas fa-times text-xs" />
            </button>

            {/* Unboxed Eyebrow */}
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <i className="fas fa-database text-[10px] text-amber-400" />
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">
                COMMUNITY MODDING &amp; DATA
              </span>
            </div>

            {/* Hero Title */}
            <h2 className="text-2xl sm:text-[26px] font-semibold tracking-tight leading-tight uppercase text-white">
              DATA PACKAGES &amp; MODS
            </h2>

            {/* Body Prose */}
            <p className="text-[12px] sm:text-[13px] text-zinc-300 leading-relaxed font-normal max-w-md mx-auto mt-1.5">
              {activeTab === 'changelog'
                ? 'Overview of major game logic upgrades, handball realism calibrations, and version milestones.'
                : 'Activate official community rosters, authentic handball league structures, and custom database modifications.'}
            </p>

            {/* Segmented Tab Switcher with Ambient Tints */}
            <div className="flex items-center justify-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.04] max-w-xs sm:max-w-sm mx-auto mt-3">
              <button
                type="button"
                onClick={() => setActiveTab('changelog')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'changelog'
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-sm'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <i className="fas fa-sparkles text-[10px]" />
                <span>v2.1 Changelog</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mods')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'mods'
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-sm'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <i className="fas fa-database text-[10px]" />
                <span>Databases &amp; Mods</span>
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="relative p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            {/* Notification / Feedback Banner if any */}
            {feedbackMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                <i className={`fas ${feedbackMsg.type === 'success' ? 'fa-check-circle text-emerald-400' : 'fa-circle-exclamation text-rose-400'}`} />
                <span>{feedbackMsg.text}</span>
              </motion.div>
            )}

            {/* TAB 1: CHANGELOG & VERSION HISTORY */}
            {activeTab === 'changelog' && (
              <div className="space-y-4">
                {/* ACTIVE RELEASE CARD: v2.1 Game Logic Updates */}
                <div className="relative overflow-hidden rounded-2xl p-5 border border-emerald-500/20 bg-[#10121a]">
                  {/* Release Header */}
                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-3 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs tracking-tight shadow-sm">
                        v 2.1
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold text-white uppercase tracking-tight">
                        Game Logic Updates
                      </h3>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ACTIVE RELEASE
                    </span>
                  </div>

                  {/* Eyebrow */}
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90 mb-3">
                    DYNAMIC FACILITY MILESTONES, REBUILD PILLARS &amp; DEEP FINANCIAL ENGINE
                  </div>

                  {/* Bullet Highlights Grid */}
                  <div className="space-y-2.5 text-xs text-zinc-300">
                    <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                      <i className="fas fa-seedling text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold">5-Tier Youth Academy Capabilities (Lvl 1–5)</strong>
                        <span className="text-zinc-400 text-[11px] leading-relaxed">
                          Dynamic seasonal scouting capacity (1–5 prospects/yr), Lvl 2 Regional Hub (8 slots), Lvl 3 Anti-Poaching Legal Shielding, Lvl 4 Foreign Wonderkid Imports 🌍 (DEN, FRA, ESP, SWE, NOR, CRO, SLO), and Lvl 5 Global Dynasty (100% poaching &amp; Title Defender fatigue immunity).
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                      <i className="fas fa-heart-pulse text-purple-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold">5-Tier Medical Center &amp; Sports Science (Lvl 1–5)</strong>
                        <span className="text-zinc-400 text-[11px] leading-relaxed">
                          Lvl 2 In-House Rehab (€0 mid-season dilemma rehab &amp; -50% crisis cost), Lvl 3 Sports Science Lab (Dramatic Decay immunity &amp; 100% Star Injury bounce-back), Lvl 4 Cryo Chamber (max 1 annual retirement cap &amp; 50% Veteran Ringer OVR retention), and Lvl 5 Peak Performance (+1.0 Matchday OVR &amp; -50% Generational Turnover shield).
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                      <i className="fas fa-chess-knight text-sky-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold">End-Game Rebuild Pillars &amp; Anti-Metronome Tactics</strong>
                        <span className="text-zinc-400 text-[11px] leading-relaxed">
                          Generational Squad Rebuild (transfer windfall, wage relief &amp; wonderkid injection on a 5-year cooldown), Head Coach &amp; Sporting Director Archetypes, and rolling 4-season tactical staleness tracking that prevents 2-tactic alternating exploits.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                      <i className="fas fa-scale-balanced text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold">Deep Financial Realism, Luxury Tax &amp; Bank Loans</strong>
                        <span className="text-zinc-400 text-[11px] leading-relaxed">
                          Progressive Competitive Balance Luxury Tax &amp; Dynasty Repeater Levy, €2.5M Treasury Endowment Cap, Institutional Bank Loans (10/15/25-yr amortization &amp; early payoff rebates), Corporate IPO Shareholder Dividend Trap, and exact 1:1 Ledger synchronization.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                      <i className="fas fa-tv text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold">Decision Day, Playoff Parity &amp; Reserve Team Integrity</strong>
                        <span className="text-zinc-400 text-[11px] leading-relaxed">
                          Authoritative synchronization of Decision Day survival, direct relegation, and 3rd-place promotion playoffs across all broadcast modals and league tables, plus Reserve Team (&quot;II&quot;) academy rotation protection and 1,500-seat arena caps.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PREVIOUS MILESTONE ARCHIVE CARD: v2.0 (Collapsible Accordion Row) */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#10121a] transition-colors duration-200 hover:border-emerald-500/20">
                  <button
                    type="button"
                    onClick={() => setIsV20Expanded((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left transition hover:bg-emerald-500/[0.03] cursor-pointer focus:outline-none"
                    aria-expanded={isV20Expanded}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-full bg-black/40 text-zinc-400 border border-white/[0.04] font-semibold text-xs tracking-tight shadow-sm shrink-0">
                        v 2.0
                      </span>
                      <h3 className="text-sm sm:text-base font-semibold text-zinc-200 uppercase tracking-tight truncate">
                        {'Comprehensive Handball Realism World Audit'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 hidden xs:inline-block">
                        MILESTONE ARCHIVE
                      </span>
                      <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400">
                        <i
                          className={`fas fa-chevron-down text-[10px] transition-transform duration-200 ${
                            isV20Expanded ? 'rotate-180 text-white' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isV20Expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-white/[0.04] bg-black/20"
                      >
                        <div className="p-4 sm:p-5 space-y-2.5 text-xs">
                          <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                            <i className="fas fa-sitemap text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                              <strong className="text-white block font-semibold">18 European &amp; International League Pyramids</strong>
                              <span className="text-zinc-400 text-[11px] leading-relaxed">
                                Complete league pyramids, authentic national federations (DHB, DHF, FFHB, RFEBM, SHF, HRS, FPA, NHF, MKSZ, ZPRP, ÖHB, SHV, HSÍ, FRH, RFM, RZS, FIGH, EHA, USATH, FEH) and domestic cups.
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                            <i className="fas fa-calculator text-amber-400 mt-0.5 shrink-0" />
                            <div>
                              <strong className="text-white block font-semibold">Strict 2-1-0 Handball Points System</strong>
                              <span className="text-zinc-400 text-[11px] leading-relaxed">
                                2 points for a win, 1 point for a draw, 0 points for a loss across all league tables, simulations, and Decision Day standings.
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                            <i className="fas fa-stopwatch-20 text-sky-400 mt-0.5 shrink-0" />
                            <div>
                              <strong className="text-white block font-semibold">Decision Day &amp; Cup Run Results Variety</strong>
                              <span className="text-zinc-400 text-[11px] leading-relaxed">
                                Authentic goal bounds (20–36 goals/match), Overtime thrillers at 60&apos;, sudden-death 7-meter penalty shootouts in knockouts, and Cinderella cup upsets.
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* PREVIOUS MILESTONE ARCHIVE CARD: v1.9 (Collapsible Accordion Row) */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#10121a] transition-colors duration-200 hover:border-amber-500/20">
                  {/* Interactive Accordion Trigger Header */}
                  <button
                    type="button"
                    onClick={() => setIsV19Expanded((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left transition hover:bg-amber-500/[0.03] cursor-pointer focus:outline-none"
                    aria-expanded={isV19Expanded}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-full bg-black/40 text-zinc-400 border border-white/[0.04] font-semibold text-xs tracking-tight shadow-sm shrink-0">
                        v 1.9
                      </span>
                      <h3 className="text-sm sm:text-base font-semibold text-zinc-200 uppercase tracking-tight truncate">
                        {'Editor, Design, Mods & European Cups'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 hidden xs:inline-block">
                        MILESTONE ARCHIVE
                      </span>
                      <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400">
                        <i
                          className={`fas fa-chevron-down text-[10px] transition-transform duration-200 ${
                            isV19Expanded ? 'rotate-180 text-white' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Collapsible Accordion Content */}
                  <AnimatePresence initial={false}>
                    {isV19Expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-white/[0.04] bg-black/20"
                      >
                        <div className="p-4 sm:p-5 space-y-2.5 text-xs">
                          <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                            <i className="fas fa-database text-amber-400 mt-0.5 shrink-0" />
                            <div>
                              <strong className="text-white block font-semibold">Community Database Modding</strong>
                              <span className="text-zinc-400 text-[11px] leading-relaxed">
                                Custom JSON import, schema validation, and base dataset export (handball_base_database.json).
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                            <i className="fas fa-wand-magic-sparkles text-sky-400 mt-0.5 shrink-0" />
                            <div>
                              <strong className="text-white block font-semibold">Design Terminal System</strong>
                              <span className="text-zinc-400 text-[11px] leading-relaxed">
                                Unified rounded-2xl geometry, down-weighted typography, and frosted elevation backdrops.
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                            <i className="fas fa-trophy text-amber-300 mt-0.5 shrink-0" />
                            <div>
                              <strong className="text-white block font-semibold">European Cup Brackets</strong>
                              <span className="text-zinc-400 text-[11px] leading-relaxed">
                                Full continental knockouts for EHF Champions League, European League, and European Cup with two-leg aggregates.
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* TAB 2: DATABASES & MODS */}
            {activeTab === 'mods' && (
              <>

            {/* Featured Mod Card: HandballUniverse_Realdata */}
            <div
              className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-200 border ${
                realDataActive
                  ? 'border-amber-500/20 bg-[#10121a]'
                  : 'border-white/[0.04] bg-[#10121a]'
              }`}
            >
              {/* Subtle Corner Glow when Active */}
              {realDataActive && (
                <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              )}

              {/* Main Mod Header Row */}
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Emblem Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      realDataActive
                        ? 'bg-amber-400/10 border-amber-400/20 text-amber-400'
                        : 'bg-white/[0.04] border-white/[0.06] text-zinc-400'
                    }`}
                  >
                    <i className="fas fa-shield-halved text-lg" />
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight uppercase truncate">
                        {REALDATA_MOD_NAME}
                      </h3>
                    </div>

                    {/* Zero-Pill Unboxed Metadata */}
                    <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-amber-400/90 flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span>COMMUNITY DATASET</span>
                      <span aria-hidden="true" className="text-zinc-600">·</span>
                      <span>{REALDATA_MOD_VERSION}</span>
                      <span aria-hidden="true" className="text-zinc-600">·</span>
                      <span className="tabular-nums">{REALDATA_MOD_CLUBS_COUNT} CLUBS</span>
                      <span aria-hidden="true" className="text-zinc-600">·</span>
                      <span className="tabular-nums">13 NATIONS</span>
                    </div>
                  </div>
                </div>

                {/* Right: Luxury Toggle Switch */}
                <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={realDataActive}
                    onClick={handleToggleRealData}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out focus:outline-none ${
                      realDataActive
                        ? 'bg-amber-500/20 border-amber-400/40 shadow-sm'
                        : 'bg-zinc-800/80 border-white/10'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out mt-[3px] ml-[3px] ${
                        realDataActive
                          ? 'translate-x-6 bg-amber-400 border border-amber-300/50'
                          : 'translate-x-0 bg-zinc-400'
                      }`}
                    />
                  </button>

                  {/* Status Indicator */}
                  <div className="text-[10px] font-medium uppercase tracking-widest">
                    {realDataActive ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-zinc-500">DISABLED</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Source Folder Path Banner */}
              <div className="mt-3.5 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs relative z-10 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
                  <i className="fas fa-folder-open text-amber-400/90 text-xs" />
                  <span className="text-amber-200/90 font-semibold">{REALDATA_MOD_FILE}</span>
                </div>
                <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fas fa-check-double text-amber-400/60 text-[9px]" />
                  <span>TARGET DIRECTORY</span>
                </div>
              </div>

              {/* 2x2 Feature Grid */}
              <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px] relative z-10">
                <div className="flex items-center gap-2 text-zinc-300 font-medium bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                  <i className="fas fa-users text-amber-400 text-xs" />
                  <span>Authentic Rosters & Clubs</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300 font-medium bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                  <i className="fas fa-sitemap text-sky-400 text-xs" />
                  <span>13 League Pyramids</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300 font-medium bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                  <i className="fas fa-trophy text-amber-400 text-xs" />
                  <span>EHF & European Cups</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300 font-medium bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                  <i className="fas fa-coins text-emerald-400 text-xs" />
                  <span>Real Arenas & Budgets</span>
                </div>
              </div>
            </div>

            {/* Jewel-Toned Metric / Active Runtime Status Card */}
            <div className={`w-full relative overflow-hidden rounded-2xl border p-3.5 text-center ${
              realDataActive || customClubs
                ? 'bg-[#10121a] border-emerald-500/20'
                : 'bg-[#10121a] border-white/[0.04]'
            }`}>
              <div className={`text-[10px] font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5 mb-0.5 ${
                realDataActive || customClubs ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                <i className={`fas ${realDataActive || customClubs ? 'fa-circle-nodes text-emerald-400' : 'fa-database text-zinc-400'} text-xs`} />
                <span>{realDataActive || customClubs ? 'ACTIVE RUNTIME DATABASE' : (isDe ? 'STANDARD BASIS-DATENBANK (MOD AUS)' : 'STANDARD BASE DATABASE (MOD INACTIVE)')}</span>
              </div>
              <div className={`text-lg sm:text-xl font-semibold font-mono tracking-tight tabular-nums truncate px-2 ${
                realDataActive || customClubs ? 'text-emerald-300' : 'text-zinc-200'
              }`}>
                {getActiveName()}
              </div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mt-1">
                {customClubs
                  ? `${currentCount} CLUBS LOADED · CUSTOM USER ROSTERS`
                  : realDataActive
                  ? `${currentCount} CLUBS LOADED · 13 NATIONS · AUTHENTIC CRESTS & ROSTERS`
                  : `${currentCount} CLUBS LOADED · 10 BASE NATIONS · PROCEDURAL CRESTS & DEFAULT STRUCTURE`}
              </div>
            </div>

            {/* Custom Import & Creator Tools */}
            <div className="rounded-2xl bg-[#10121a] border border-white/[0.04] p-4 text-left">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/95 flex items-center gap-1.5 pb-2 mb-3 border-b border-white/[0.04]">
                <i className="fas fa-file-code text-amber-400 text-xs" />
                <span>{isDe ? 'CUSTOM MOD & DATEN IMPORT / EXPORT' : 'CUSTOM MOD & DATA IMPORT / EXPORT'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Upload Button */}
                <label className="flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-amber-400/30 text-white font-semibold text-xs py-3 px-4 rounded-xl transition duration-150 cursor-pointer active:scale-[0.98] text-center">
                  <i className="fas fa-file-arrow-up text-amber-400" />
                  <span>{isDe ? 'Eigene JSON Laden' : 'Import Custom JSON'}</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                {/* Export Button */}
                <button
                  onClick={handleExportBase}
                  className="flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-amber-400/30 text-white font-semibold text-xs py-3 px-4 rounded-xl transition duration-150 cursor-pointer active:scale-[0.98]"
                >
                  <i className="fas fa-file-arrow-down text-emerald-400" />
                  <span>{isDe ? 'Basis-DB Exportieren' : 'Export Base Database'}</span>
                </button>
              </div>

              {/* Reset to Default Action if custom is loaded */}
              {customClubs && (
                <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">
                    {isDe ? 'Aktuell ist ein eigener Upload aktiv.' : 'A custom JSON is currently active.'}
                  </span>
                  <button
                    onClick={handleResetToDefault}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
                  >
                    {isDe ? 'Auf Standard zurücksetzen' : 'Reset to Default'}
                  </button>
                </div>
              )}

              {/* Creator Hints */}
              <div className="mt-3 text-[11px] text-zinc-400 space-y-1">
                <p>
                  <strong className="text-zinc-200 font-medium">Format:</strong> {isDe ? 'JSON-Array von Vereinen mit id, name, tier, baseOvr, stadium, color, country (z.B. GER, POL, AUT, SUI, FRA, ESP, DEN).' : 'JSON array of clubs containing id, name, tier, baseOvr, stadium, color, country (e.g. GER, POL, AUT, SUI, FRA, ESP, DEN).'}
                </p>
                <p>
                  <strong className="text-zinc-200 font-medium">Logos:</strong> {isDe ? 'Fuege ein "logo"-Feld mit direkter Bild-URL hinzu, um offizielle Vereinswappen zu rendern.' : 'Add a "logo" field with direct image URL to render custom authentic crests.'}
                </p>
              </div>
            </div>
            </>
            )}
          </div>

          {/* Modal Footer / Championship CTA */}
          <div className="p-4 sm:p-5 border-t border-white/[0.04] text-center shrink-0">
            <button
              onClick={onClose}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 font-semibold text-sm sm:text-base py-3.5 rounded-2xl transition duration-150 active:scale-[0.99] cursor-pointer shadow-sm"
            >
              {isDe ? 'Fertig & Schliessen' : 'Save & Continue'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
