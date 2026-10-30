import React, { useState, useEffect } from 'react';
import { Club, Language } from '../types';
import { ALL_CLUBS } from '../data/clubsData';
import { 
  normalizeAndValidateCustomDb, 
  getBaseModClubs, 
  getSafeDefaultClubs 
} from '../engine/moddingEngine';
import { clearLogoCache } from '../utils/logoCache';
import { safeSaveClubsDb, saveToIndexedDB } from '../utils/storageManager';

interface ModModalProps {
  lang: Language;
  clubsDb: Club[];
  isModActive?: boolean;
  onUpdateClubsDb: (clubs: Club[], isModActive: boolean) => void;
  showToast?: (msg: string, type: string) => void;
  onClose: () => void;
}

export const ModModal: React.FC<ModModalProps> = ({
  lang,
  clubsDb,
  isModActive = false,
  onUpdateClubsDb,
  showToast,
  onClose,
}) => {
  const isDe = lang === 'de';
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const isCustomJson = isModActive && typeof window !== 'undefined' && localStorage.getItem('fms_custom_mod_json') != null;

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Unified Toggle Switch Handler
  const handleToggleMod = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (isModActive) {
        // Toggle OFF -> Revert to Standard Default Database
        clearLogoCache();
        const safeClubs = getSafeDefaultClubs();
        localStorage.removeItem('fms_real_mod_active');
        localStorage.removeItem('fms_custom_mod_json');
        localStorage.removeItem('custom_db');
        onUpdateClubsDb(safeClubs, false);
        if (showToast) {
          showToast(
            isDe ? 'Standard-Datenbank wiederhergestellt.' : 'Standard database restored.',
            'info'
          );
        }
      } else {
        // Toggle ON -> Activate CR27_Footy Real Name Pack
        const communityClubs = getBaseModClubs();
        localStorage.setItem('fms_real_mod_active', 'true');
        localStorage.removeItem('fms_custom_mod_json');
        onUpdateClubsDb(communityClubs, true);
        if (showToast) {
          showToast(
            isDe
              ? `CR27_Footy Real Name Pack aktiviert (${communityClubs.length} Vereine geladen)!`
              : `CR27_Footy Real Name Pack activated (${communityClubs.length} clubs loaded)!`,
            'success'
          );
        }
      }
    } catch (e: any) {
      if (showToast) {
        showToast(`Error toggling mod: ${e?.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-apply official CR27_Footy Real Name Pack if a custom JSON was imported
  const handleResetToOfficialCommunity = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const communityClubs = getBaseModClubs();
      localStorage.setItem('fms_real_mod_active', 'true');
      localStorage.removeItem('fms_custom_mod_json');
      onUpdateClubsDb(communityClubs, true);
      if (showToast) {
        showToast(
          isDe ? 'CR27_Footy Real Name Pack wiederhergestellt.' : 'CR27_Footy Real Name Pack restored.',
          'success'
        );
      }
    } catch (e: any) {
      if (showToast) {
        showToast(`Failed to reset: ${e?.message || 'Error'}`, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Custom JSON Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const res = normalizeAndValidateCustomDb(data);
        
        if (res.valid && res.clubs && res.clubs.length > 0) {
          localStorage.setItem('fms_real_mod_active', 'true');
          
          // Save the massive JSON payload to IndexedDB and keep lightweight marker flag in localStorage
          localStorage.setItem('fms_custom_mod_json', 'true'); 
          await saveToIndexedDB('fms_custom_mod_json', data);
          await saveToIndexedDB('custom_db', res.clubs);
          
          onUpdateClubsDb(res.clubs, true);
          
          if (showToast) {
            showToast(
              isDe
                ? `Benutzerdefinierter Patch geladen (${res.clubs.length} Vereine)!`
                : `Custom roster patch loaded (${res.clubs.length} clubs)!`,
              'success'
            );
          }
        } else {
          const err = res.error || 'Invalid JSON mod file.';
          if (showToast) showToast(err, 'error');
        }
      } catch (err: any) {
        const msg = `Error parsing JSON: ${err?.message || 'Syntax error'}`;
        if (showToast) showToast(msg, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Export Base Database Template JSON (Robust Blob-based export for mobile & desktop)
  const handleExportTemplate = () => {
    try {
      const clubsToExport = clubsDb && clubsDb.length > 0 ? clubsDb : ALL_CLUBS;
      const jsonStr = JSON.stringify(clubsToExport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.href = url;
      dlAnchorElem.download = isCustomJson ? 'fms_custom_patch.json' : 'fms_cr27_database.json';
      document.body.appendChild(dlAnchorElem);
      dlAnchorElem.click();
      document.body.removeChild(dlAnchorElem);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (showToast) {
        showToast(
          isDe ? 'JSON-Datenbank erfolgreich exportiert!' : 'Roster JSON successfully exported!',
          'success'
        );
      }
    } catch (e: any) {
      if (showToast) {
        showToast(`Export failed: ${e?.message || 'Error'}`, 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-5 overflow-y-auto overscroll-contain">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-2xl transition-opacity cursor-pointer" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#12141c]/95 text-white rounded-[28px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-3xl flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-hidden">
        
        {/* Subtle Ambient Sky Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] text-sky-400 border border-white/[0.08] flex items-center justify-center text-base shadow-inner shrink-0">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90 mb-0.5">
                {isDe ? 'Modding & Datenpakete' : 'Modding & Data Packages'}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {isDe ? 'Datenbank & Community Mods' : 'Database & Community Mods'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center transition cursor-pointer text-zinc-400 hover:text-white shrink-0"
            aria-label={isDe ? 'Schliessen' : 'Close'}
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain custom-scrollbar flex flex-col gap-4 relative z-10 flex-1 min-h-0">
          
          {/* Main Community Mod Toggle Card */}
          <div 
            onClick={handleToggleMod}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative select-none shrink-0 ${
              isModActive
                ? 'bg-emerald-500/[0.06] border-emerald-400/30 shadow-sm'
                : 'bg-white/[0.03] hover:bg-white/[0.05] border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            {isModActive && (
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            )}

            <div className="flex items-start justify-between gap-3 sm:gap-4 relative z-10">
              <div className="space-y-1.5 flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-bold text-white flex items-center gap-2 tracking-tight">
                    <i className={`fa-solid fa-shield-halved ${isModActive ? 'text-emerald-400' : 'text-zinc-500'}`}></i>
                    CR27_Footy Real Name Pack
                  </span>
                  {isModActive && !isCustomJson && (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-400/30 uppercase tracking-wider shrink-0">
                      {isDe ? 'Aktiv' : 'Active'}
                    </span>
                  )}
                  {isCustomJson && (
                    <span className="text-[10px] font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-lg border border-sky-400/30 uppercase tracking-wider shrink-0">
                      Custom Patch
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-semibold text-zinc-400">
                  {isDe ? 'Erstellt von Community-Modder CR27_Footy' : 'Authored by community creator CR27_Footy'}
                </div>
                
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {isModActive
                    ? isCustomJson
                      ? (isDe ? 'Eigener benutzerdefinierter JSON-Patch geladen.' : 'Custom user-imported JSON patch is currently loaded.')
                      : (isDe ? '1.202 Vereine mit authentischen Namen, echten Wappen, echten Stadien und Historie geladen.' : '1,202 clubs worldwide with verified crest artwork, real-world team names, and historical lore.')
                    : (isDe ? 'Aktiviert den beliebten Community-Patch von CR27_Footy mit realen Vereinsidentitäten, Wappen und Stadien.' : 'Enable the popular community data pack by CR27_Footy with authentic team identities, crests, and lore.')}
                </p>
              </div>

              {/* The Toggle Switch - Aligned at top right, shrink-0 and guaranteed visible */}
              <div className="shrink-0 pt-0.5" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isModActive}
                  onClick={handleToggleMod}
                  disabled={isProcessing}
                  className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-md touch-manipulation ${
                    isModActive
                      ? 'bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                >
                  <span className="sr-only">
                    {isDe ? 'CR27_Footy Real Name Pack umschalten' : 'Toggle CR27_Footy Real Name Pack'}
                  </span>
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 sm:h-7 sm:w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isModActive ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Mobile Explicit Status & Tap Action Bar */}
            <div className="sm:hidden mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-300">
                {isModActive ? (isDe ? 'Pack ist aktiviert' : 'Pack is Active') : (isDe ? 'Standard-Datenbank' : 'Standard Database')}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                isModActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-white/[0.06] text-zinc-300 border-white/[0.1]'
              }`}>
                {isModActive ? (isDe ? 'Tippen zum Ausschalten' : 'Tap to Turn Off') : (isDe ? 'Tippen zum Einschalten' : 'Tap to Turn On')}
              </span>
            </div>

            {/* Custom JSON Active Alert / Revert Action */}
            {isCustomJson && (
              <div 
                className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs"
                onClick={e => e.stopPropagation()}
              >
                <span className="text-sky-300 text-[11px] font-medium">
                  {isDe ? 'Aktuell ist ein benutzerdefinierter Patch aktiv.' : 'A custom JSON file is currently active.'}
                </span>
                <button
                  type="button"
                  onClick={handleResetToOfficialCommunity}
                  className="text-white hover:text-emerald-400 font-semibold text-[11px] transition-colors underline underline-offset-2 cursor-pointer"
                >
                  {isDe ? 'Auf CR27_Footy Real Name Pack zurücksetzen' : 'Reset to CR27_Footy Real Name Pack'}
                </button>
              </div>
            )}
          </div>

          {/* Download, Export & Import JSON Management Section (Prominently placed per user instruction) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 shrink-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
                <i className="fa-solid fa-file-code text-sky-400 text-sm"></i>
                <span>{isDe ? 'Roster-Daten & JSON-Verwaltung' : 'Roster Data & JSON Backup'}</span>
              </div>
              <span className="text-[10px] font-semibold text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.06] tabular-nums">
                {clubsDb.length} Clubs
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              {isDe 
                ? 'Lade die vollständige Vereinsdatenbank als JSON herunter und exportiere sie für eigene Edits, oder importiere benutzerdefinierte Patches.' 
                : 'Download and export the verified roster database as JSON for editing, or import custom community patches.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button 
                type="button"
                onClick={handleExportTemplate}
                className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-400/50 px-4 py-3 rounded-xl font-bold cursor-pointer transition flex items-center justify-center gap-2.5 text-xs shadow-sm touch-manipulation active:scale-[0.98]"
              >
                <i className="fa-solid fa-download text-emerald-400 text-sm"></i>
                <span>{isDe ? 'JSON herunterladen & exportieren' : 'Download & Export JSON'}</span>
              </button>

              <label className="w-full text-center bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.14] text-white border border-white/[0.1] hover:border-white/[0.18] px-4 py-3 rounded-xl font-bold cursor-pointer transition flex items-center justify-center gap-2.5 text-xs shadow-sm touch-manipulation active:scale-[0.98]">
                <i className="fa-solid fa-upload text-sky-400 text-sm"></i>
                <span>{isDe ? 'JSON-Patch importieren' : 'Import Custom JSON'}</span>
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </label>
            </div>
          </div>

          {/* Database Status & Pack Features */}
          {isModActive ? (
            <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-emerald-400">
                  {isDe ? 'Aktive Pack-Funktionen' : 'Active Pack Features'}
                </span>
                <span className="tabular-nums font-bold text-emerald-300">
                  {clubsDb.length} {isDe ? 'Vereine' : 'Clubs'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="flex items-start gap-2 text-zinc-300">
                  <i className="fa-solid fa-check text-emerald-400 text-[11px] mt-0.5 shrink-0"></i>
                  <span className="leading-snug">
                    {isDe ? 'Echte Vereinsnamen & Wappen' : 'Authentic club names & crests'}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-zinc-300">
                  <i className="fa-solid fa-check text-emerald-400 text-[11px] mt-0.5 shrink-0"></i>
                  <span className="leading-snug">
                    {isDe ? 'Reale Stadionkapazitäten & Lore' : 'Real stadium capacities & historical lore'}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-zinc-300">
                  <i className="fa-solid fa-check text-emerald-400 text-[11px] mt-0.5 shrink-0"></i>
                  <span className="leading-snug">
                    {isDe ? '1.202 Vereine weltweit integriert' : '1,202 verified clubs worldwide'}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-zinc-300">
                  <i className="fa-solid fa-check text-emerald-400 text-[11px] mt-0.5 shrink-0"></i>
                  <span className="leading-snug">
                    {isDe ? 'Jederzeit umschaltbar ohne Spielverlust' : '100% save-game compatible anytime'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs text-zinc-400 shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                  {isDe ? 'Aktiver Datenstand' : 'Active Database Status'}
                </span>
                <span className="tabular-nums font-semibold text-zinc-300">
                  {clubsDb.length} {isDe ? 'Vereine (Standard)' : 'Clubs (Standard)'}
                </span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-xs">
                {isDe
                  ? 'Standard-Datenbank aktiv: Neutrale, lizenzfreie Vereinsnamen (z.B. Bavaria München, SV Leverkusen 04) und prozedurale Wappen.'
                  : 'Standard database active: Independent, copyright-safe club names (e.g. Bavaria München, SV Leverkusen 04) and procedural crests.'}
              </p>
            </div>
          )}

          {/* Unambiguous Legal Notice & Third-Party Disclaimer */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-zinc-400 leading-relaxed flex items-start gap-3 shrink-0">
            <i className="fa-solid fa-scale-balanced text-zinc-400 text-sm mt-0.5 shrink-0"></i>
            <div className="space-y-1">
              <div className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">
                {isDe ? 'Rechtlicher Hinweis & Unabhängigkeits-Erklärung' : 'Legal Notice & Third-Party Disclaimer'}
              </div>
              <p className="text-zinc-400">
                {isDe 
                  ? 'Der "CR27_Footy Real Name Pack" ist ein eigenständiges, von der Community erstelltes Datenpaket des Drittanbieters CR27_Footy. Football Manager Sim und seine Entwickler sind weder Urheber, Herausgeber, Hoster noch Sponsor dieses Pakets und stehen in keinerlei rechtlicher oder geschäftlicher Verbindung zu CR27_Footy oder Football Manager Sim. Football Manager Sim ist ein eigenständiges Simulationsspiel. Alle realen Vereins-, Stadion- und Markennamen in diesem Community-Pack sind ausschließlich nutzergenerierte Inhalte von Drittanbietern und verbleiben das ausschließliche Eigentum der jeweiligen Rechteinhaber.'
                  : 'The "CR27_Footy Real Name Pack" is an independent, unofficial, player-created community modification authored exclusively by third-party contributor CR27_Footy. Football Manager Sim and its developers did not create, host, license, publish, or sponsor this pack, and bear no affiliation with CR27_Footy. Football Manager Sim is an independent simulation game. All real-world trademarks, club identities, stadium names, and crest references contained within community modifications are strictly third-party player-generated content and remain the intellectual property of their respective trademark holders.'}
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-end shrink-0 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs rounded-xl border border-white/[0.08] transition-colors shadow-sm cursor-pointer"
          >
            {isDe ? 'Schliessen' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
