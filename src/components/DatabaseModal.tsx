import React, { useState, useMemo } from 'react';
import { Club, Language } from '../types';
import { getLeagueInfo } from '../data/gameConstants';
import { ClubLogo } from './ClubLogo';
import { ALL_CLUBS } from '../data/clubsData';
import { normalizeAndValidateCustomDb } from '../engine/moddingEngine';
import { safeSaveClubsDb } from '../utils/storageManager';

interface DatabaseModalProps {
  clubs: Club[];
  lang: Language;
  onClose: () => void;
  onUpdateClubsDb?: (clubs: Club[], isModActive: boolean) => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ 
  clubs: initialClubs, 
  lang, 
  onClose,
  onUpdateClubsDb 
}) => {
  const isDe = lang === 'de';
  const t = (en: string, de: string) => isDe ? de : en;

  // Local state for live editing
  const [clubsList, setClubsList] = useState<Club[]>(initialClubs && initialClubs.length > 0 ? initialClubs : ALL_CLUBS);
  const [selectedCountry, setSelectedCountry] = useState<string>('GER');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const mainScrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [selectedCountry, searchQuery]);

  // Editable fields for currently selected club
  const [editName, setEditName] = useState<string>('');
  const [editOvr, setEditOvr] = useState<number>(70);
  const [editStadium, setEditStadium] = useState<number>(25000);
  const [editBudget, setEditBudget] = useState<number>(5000000);
  const [editColor, setEditColor] = useState<string>('#ffffff');

  // Handle selecting a club for edit
  const handleSelectClubForEdit = (club: Club) => {
    setEditingClub(club);
    setEditName(club.name);
    setEditOvr(club.baseOvr || 70);
    setEditStadium(club.stadium || 25000);
    const rawBudget = club.currentBudget ? (club.currentBudget < 100000 ? club.currentBudget * 1000 : club.currentBudget) : 5000000;
    setEditBudget(rawBudget);
    setEditColor(club.color || '#3b82f6');
    setSaveSuccessMsg(null);
  };

  // Save changes to current club
  const handleSaveClub = () => {
    if (!editingClub) return;

    const updatedClubs = clubsList.map(c => {
      if (c.id === editingClub.id) {
        return {
          ...c,
          name: editName.trim() || c.name,
          baseOvr: Math.max(10, Math.min(99, Number(editOvr) || 70)),
          stadium: Math.max(1000, Number(editStadium) || 10000),
          currentBudget: Math.max(100000, Number(editBudget) || 1000000),
          color: editColor || c.color,
        };
      }
      return c;
    });

    setClubsList(updatedClubs);
    const updatedTarget = updatedClubs.find(c => c.id === editingClub.id) || null;
    setEditingClub(updatedTarget);

    // Persist to custom_db and activate custom mod
    try {
      safeSaveClubsDb('custom_db', updatedClubs);
      safeSaveClubsDb('fms_custom_mod_json', updatedClubs);
      localStorage.setItem('fms_real_mod_active', 'true');
      localStorage.setItem('fms_custom_mod_json', 'true');
      if (onUpdateClubsDb) {
        onUpdateClubsDb(updatedClubs, true);
      }
      setSaveSuccessMsg(isDe ? `"${editName}" erfolgreich gespeichert!` : `"${editName}" saved to custom database!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e: any) {
      console.error('Failed to save to localStorage', e);
    }
  };

  // Reset club to original ALL_CLUBS default
  const handleResetClub = () => {
    if (!editingClub) return;
    const original = ALL_CLUBS.find(c => c.id === editingClub.id);
    if (!original) return;

    handleSelectClubForEdit(original);
    const updatedClubs = clubsList.map(c => c.id === original.id ? { ...original } : c);
    setClubsList(updatedClubs);
    try {
      safeSaveClubsDb('custom_db', updatedClubs);
      safeSaveClubsDb('fms_custom_mod_json', updatedClubs);
      if (onUpdateClubsDb) onUpdateClubsDb(updatedClubs, true);
      setSaveSuccessMsg(isDe ? 'Verein auf Standard zurückgesetzt.' : 'Club reset to default.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Export current database to JSON
  const handleExportJson = () => {
    try {
      const jsonStr = JSON.stringify(clubsList, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fms_edited_database.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  // Import JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const res = normalizeAndValidateCustomDb(data);
        if (res.valid && res.clubs && res.clubs.length > 0) {
          setClubsList(res.clubs);
          safeSaveClubsDb('custom_db', res.clubs);
          safeSaveClubsDb('fms_custom_mod_json', res.clubs);
          localStorage.setItem('fms_real_mod_active', 'true');
          localStorage.setItem('fms_custom_mod_json', 'true');
          if (onUpdateClubsDb) onUpdateClubsDb(res.clubs, true);
          setSaveSuccessMsg(isDe ? `${res.clubs.length} Vereine geladen!` : `${res.clubs.length} clubs imported!`);
          setTimeout(() => setSaveSuccessMsg(null), 3500);
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const allCountries = useMemo(() => {
    return Array.from(new Set(clubsList.map(c => c.country || 'GER'))).sort();
  }, [clubsList]);

  const filteredClubs = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return clubsList.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.country || '').toLowerCase().includes(q)
      );
    }
    return clubsList.filter(c => (c.country || 'GER') === selectedCountry);
  }, [clubsList, searchQuery, selectedCountry]);

  const maxTier = filteredClubs.length > 0 ? Math.max(...filteredClubs.map(c => c.tier)) : 1;
  const leagues = Array.from({ length: maxTier }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-2xl animate-in fade-in duration-100 overflow-y-auto overscroll-contain">
      <div className="bg-[#12141c] w-full max-w-5xl rounded-[28px] sm:rounded-[32px] flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shadow-[0_24px_64px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden text-white animate-in zoom-in-98 duration-100 ease-out shrink-0">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-lg shadow-inner shrink-0">
              <i className="fa-solid fa-pen-to-square"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                {t('Database & Roster Editor', 'Datenbank & Roster-Editor')}
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{t('Roster & Club Editor', 'Roster- & Vereins-Editor')}</span>
                <span className="text-xs font-normal text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10 tabular-nums">
                  {clubsList.length.toLocaleString()} {t('Clubs', 'Vereine')}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Export database as JSON"
            >
              <i className="fa-solid fa-download text-[11px]"></i>
              <span className="hidden sm:inline">{t('Export JSON', 'JSON exportieren')}</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer">
              <i className="fa-solid fa-upload text-[11px] text-sky-400"></i>
              <span className="hidden sm:inline">{t('Import Patch', 'Patch importieren')}</span>
              <input type="file" accept=".json" className="hidden" onChange={handleImportJson} />
            </label>

            <button 
              aria-label="Close modal" 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer text-zinc-300 hover:text-white shrink-0 ml-1"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>

        {/* Search & Notification Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-white/[0.06] bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('Search by club name or country...', 'Verein oder Land suchen...')}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            )}
          </div>

          {saveSuccessMsg ? (
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
              <i className="fa-solid fa-circle-check"></i>
              <span>{saveSuccessMsg}</span>
            </div>
          ) : (
            <div className="text-[11px] text-zinc-400 font-normal">
              <i className="fa-solid fa-hand-pointer text-[10px] text-sky-400 mr-1.5"></i>
              <span>{t('Click any club to edit name, rating, stadium & budget', 'Klicke auf einen Verein zum Bearbeiten')}</span>
            </div>
          )}
        </div>

        {/* Content Body: Sidebar + Main Area + Optional Live Editor Drawer */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          
          {/* Sidebar - Countries (hidden when actively searching) */}
          {!searchQuery && (
            <div className="md:w-56 border-r border-white/10 overflow-y-auto custom-scrollbar p-2 bg-black/30 shrink-0 max-h-[22vh] md:max-h-full">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-2 mt-2">
                {t('Countries', 'Laender')} ({allCountries.length})
              </div>
              <div className="flex md:flex-col flex-row gap-1 overflow-x-auto md:overflow-visible">
                {allCountries.map(country => (
                  <button
                    key={country}
                    onClick={() => {
                      setSelectedCountry(country);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap md:whitespace-normal text-left cursor-pointer ${
                      selectedCountry === country 
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-sm' 
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <i className="fas fa-flag text-[10px] opacity-70"></i>
                    <span>{country}</span>
                    <span className="ml-auto text-[10px] font-bold opacity-60 bg-black/30 px-1.5 py-0.5 rounded tabular-nums">
                      {clubsList.filter(c => (c.country || 'GER') === country).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main List Area */}
          <div ref={mainScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-3 sm:p-5 bg-[#12141c]/60">
            {searchQuery && (
              <div className="mb-4 text-xs text-zinc-400">
                {t('Found', 'Gefunden')}: <span className="font-bold text-white tabular-nums">{filteredClubs.length}</span> {t('clubs for', 'Vereine für')} "{searchQuery}"
              </div>
            )}

            {filteredClubs.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <i className="fa-solid fa-database text-3xl mb-3 opacity-30"></i>
                <p className="text-sm">{t('No clubs found matching your search.', 'Keine Vereine gefunden.')}</p>
              </div>
            ) : searchQuery ? (
              /* Search results grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredClubs.map(club => (
                  <div 
                    key={club.id} 
                    onClick={() => handleSelectClubForEdit(club)}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer border ${
                      editingClub?.id === club.id
                        ? 'bg-sky-500/15 border-sky-400/40 shadow-sm'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <ClubLogo
                        name={club.name}
                        color={club.color}
                        logo={club.logo}
                        fallbackLogo={club.fallbackLogo}
                        className="w-7 h-7 shrink-0 object-contain drop-shadow"
                      />
                      <div className="truncate">
                        <div className="font-semibold text-xs text-white truncate">{club.name}</div>
                        <div className="text-[10px] text-zinc-500">{club.country || 'GER'} · Tier {club.tier}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/10 text-xs font-bold text-sky-400 tabular-nums">
                        {club.baseOvr}
                      </span>
                      <i className="fa-solid fa-pen text-[10px] text-zinc-500"></i>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Tier / League Sections */
              leagues.map(tier => {
                const leagueInfo = getLeagueInfo(tier, selectedCountry);
                const tierClubs = filteredClubs.filter(c => c.tier === tier).sort((a, b) => b.baseOvr - a.baseOvr);
                if (tierClubs.length === 0) return null;

                return (
                  <div key={tier} className="mb-6 last:mb-0">
                    <div className={`flex items-center justify-between px-3.5 py-2 rounded-t-xl ${leagueInfo.css} border-b-0`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center shrink-0 shadow-inner">
                          <i className="fas fa-trophy text-white/80 text-xs"></i>
                        </div>
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm tracking-tight text-white">{leagueInfo.name}</h3>
                          <p className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
                            {tierClubs.length} {t('Clubs', 'Vereine')} &bull; Tier {tier}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/25 border border-white/10 rounded-b-xl p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {tierClubs.map(club => (
                        <div 
                          key={club.id} 
                          onClick={() => handleSelectClubForEdit(club)}
                          className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                            editingClub?.id === club.id
                              ? 'bg-sky-500/15 border-sky-400/40 shadow-sm'
                              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/[0.12]'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <ClubLogo
                              name={club.name}
                              color={club.color}
                              logo={club.logo}
                              fallbackLogo={club.fallbackLogo}
                              className="w-6 h-6 shrink-0 object-contain drop-shadow"
                            />
                            <span className="font-semibold text-xs truncate text-white">{club.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {club.isReserve && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase tracking-wider border border-amber-500/30">
                                Res
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[11px] font-bold text-zinc-300 tabular-nums">
                              {club.baseOvr}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Editor Drawer for Selected Club */}
          {editingClub && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-[#161822] p-4 sm:p-5 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <ClubLogo
                      name={editingClub.name}
                      color={editColor}
                      logo={editingClub.logo}
                      fallbackLogo={editingClub.fallbackLogo}
                      className="w-8 h-8 object-contain drop-shadow"
                    />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                        {t('Editing Club', 'Verein bearbeiten')}
                      </div>
                      <div className="text-xs font-bold text-white truncate max-w-[160px]">
                        {editingClub.name}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingClub(null)}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white text-xs cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      {t('Club Name', 'Vereinsname')}
                    </label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-sky-400/50"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        {t('Base OVR Rating', 'Gesamtstärke (OVR)')}
                      </label>
                      <span className="font-bold text-sky-400 text-xs tabular-nums">{editOvr}</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="99" 
                      value={editOvr} 
                      onChange={e => setEditOvr(Number(e.target.value))} 
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      {t('Stadium Capacity', 'Stadionkapazität')}
                    </label>
                    <input 
                      type="number" 
                      step="500"
                      min="1000"
                      max="120000"
                      value={editStadium} 
                      onChange={e => setEditStadium(Number(e.target.value))} 
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white font-medium tabular-nums focus:outline-none focus:border-sky-400/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      {t('Starting Budget (€)', 'Startbudget (€)')}
                    </label>
                    <input 
                      type="number" 
                      step="500000"
                      min="100000"
                      value={editBudget} 
                      onChange={e => setEditBudget(Number(e.target.value))} 
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white font-medium tabular-nums focus:outline-none focus:border-sky-400/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      {t('Club Color', 'Vereinsfarbe')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={/^#[0-9A-Fa-f]{6}$/.test(editColor) ? editColor : '#3b82f6'} 
                        onChange={e => setEditColor(e.target.value)} 
                        className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={editColor} 
                        onChange={e => setEditColor(e.target.value)} 
                        className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-sky-400/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/[0.08] space-y-2 mt-4">
                <button
                  onClick={handleSaveClub}
                  className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>{t('Save Club to Custom DB', 'Änderungen speichern')}</span>
                </button>

                <button
                  onClick={handleResetClub}
                  className="w-full py-2 px-4 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-rotate-left text-[10px]"></i>
                  <span>{t('Reset to Original', 'Auf Standard zurücksetzen')}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
