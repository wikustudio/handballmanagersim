import React from 'react';
import { Club, Language } from '../types';

interface AboutPageProps {
  clubsDb?: Club[];
  lang?: Language;
  onStartCareer?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ lang = 'en', onStartCareer }) => {
  const isDe = lang === 'de';

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const section = params.get('section');
      const target = section || (view === 'tactics' ? 'tactics' : view === 'leagues' ? 'rules' : null);
      if (target) {
        setTimeout(() => {
          scrollTo(target);
        }, 150);
      }
    } catch {}
  }, []);

  return (
    <article className="w-full max-w-4xl px-4 sm:px-8 py-8 sm:py-12 mx-auto text-zinc-300 pb-28 font-sans selection:bg-amber-500/30 selection:text-white">
      {/* Top Header */}
      <header className="mb-10 pb-6 border-b border-white/[0.08] flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              {isDe ? 'Offizielles Spielhandbuch' : 'Official Game Manual'}
            </span>
            <span className="text-zinc-600 select-none">·</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
              v 2.1 Game Logic
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
            {isDe ? 'Über Handball Manager & Spielregeln' : 'About Handball Manager & Rules'}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-2 leading-relaxed max-w-2xl">
            {isDe
              ? 'Ein umfassender Leitfaden zu den 18 europäischen Ligapyramiden, dem 2-1-0-Punktesystem, Abstiegsregeln, Matchday-Taktiken, Hallenwirtschaft und Nachwuchsförderung.'
              : 'A comprehensive reference guide to the 18 European league pyramids, the 2-1-0 scoring system, relegation rules, tactical match variety, arena economics, and youth development.'}
          </p>
        </div>

        {onStartCareer && (
          <button
            onClick={onStartCareer}
            className="shrink-0 py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-2 self-start md:self-auto active:scale-95"
          >
            <i className="fas fa-arrow-left text-xs" />
            <span>{isDe ? 'Zurück zum Spiel' : 'Return to Career'}</span>
          </button>
        )}
      </header>

      {/* Quick Table of Contents - Clean inline text links */}
      <nav aria-label="Table of contents" className="mb-12 py-3.5 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <span className="font-extrabold uppercase tracking-wider text-zinc-200">{isDe ? 'Inhalt:' : 'Contents:'}</span>
        <button onClick={() => scrollTo('intro')} className="hover:text-amber-400 transition cursor-pointer">
          {isDe ? 'Einführung' : 'Overview'}
        </button>
        <span className="text-zinc-600 select-none">·</span>
        <button onClick={() => scrollTo('rules')} className="hover:text-amber-400 transition cursor-pointer">
          {isDe ? '1. 2-1-0 Wertung & Ligen' : '1. 2-1-0 Scoring & Pyramids'}
        </button>
        <span className="text-zinc-600 select-none">·</span>
        <button onClick={() => scrollTo('relegation')} className="hover:text-amber-400 transition cursor-pointer">
          {isDe ? '2. Abstieg & Untere Ligen' : '2. Relegation & Floor Rules'}
        </button>
        <span className="text-zinc-600 select-none">·</span>
        <button onClick={() => scrollTo('career')} className="hover:text-amber-400 transition cursor-pointer">
          {isDe ? '3. 35-Jahre-Karriere' : '3. 35-Season Career'}
        </button>
        <span className="text-zinc-600 select-none">·</span>
        <button onClick={() => scrollTo('cups')} className="hover:text-amber-400 transition cursor-pointer">
          {isDe ? '4. Europapokal & Pokale' : '4. Continental & National Cups'}
        </button>
        <span className="text-zinc-600 select-none">·</span>
        <button onClick={() => scrollTo('tactics')} className="hover:text-amber-400 transition cursor-pointer">
          {isDe ? '5. Taktik & Decision Day' : '5. Tactics & Decision Day'}
        </button>
        <span className="text-zinc-600 select-none">·</span>
        <button onClick={() => scrollTo('arena')} className="hover:text-amber-400 transition cursor-pointer">
          {isDe ? '6. Halle & Fankultur' : '6. Arena & Supporter Focus'}
        </button>
        <span className="text-zinc-600 select-none">·</span>
        <button onClick={() => scrollTo('finances')} className="hover:text-amber-400 transition cursor-pointer">
          {isDe ? '7. Finanzen & Lizenzierung' : '7. Finances & Licensing'}
        </button>
        <span className="text-zinc-600 select-none">·</span>
        <button onClick={() => scrollTo('youth')} className="hover:text-amber-400 transition cursor-pointer">
          {isDe ? '8. Jugend & Medizin (Lvl 1–5)' : '8. Academy & Medical (Lvl 1–5)'}
        </button>
        <span className="text-zinc-600 select-none">·</span>
        <button onClick={() => scrollTo('mods')} className="hover:text-amber-400 transition cursor-pointer">
          {isDe ? '9. Mods & Datenbank' : '9. Mods & Community Data'}
        </button>
      </nav>

      {/* Main Editorial Text Flow */}
      <div className="space-y-12 leading-relaxed text-sm sm:text-base">

        {/* Section 0: Overview */}
        <section id="intro" className="scroll-mt-10 space-y-4">
          <div className="flex items-center gap-2.5 text-amber-400">
            <i className="fas fa-hand-fist text-lg" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {isDe ? 'Handball als Sportmanager neu erleben' : 'Authentic European Handball Simulation'}
            </h2>
          </div>
          <p>
            {isDe
              ? 'Handball Manager ist eine authentische, tiefgründige Sportsimulation des europäischen Vereinshandballs. Im Gegensatz zum Fußball zeichnet sich Spitzenhandball durch extrem hohes Tempo, intensive Physis, 50 bis 70 Tore pro Partie und ständige Führungswechsel aus. Als sportlicher Leiter und Cheftrainer steuerst du deinen Verein durch Auf- und Abstiege, managst Spielerverträge, baust deine Halle zur Festung aus und führst dein Team in die EHF Champions League.'
              : 'Handball Manager is a fast-paced, deeply authentic simulation of European club handball. Unlike association football, handball features relentless physical duels, rapid transitions, 50 to 70 total goals per match, and constant momentum swings. As head coach and sporting director, you oversee every aspect of your club: steering tactics on matchday, navigating promotions and relegations, balancing payroll, expanding your home arena into a deafening cauldron, and conquering Europe.'}
          </p>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] flex items-start gap-3.5">
            <i className="fas fa-sparkles text-amber-400 mt-1 shrink-0" />
            <div className="text-xs sm:text-sm text-zinc-300 space-y-2">
              <div>
                <strong className="text-white block font-bold mb-1">
                  {isDe
                    ? 'Neu in Version 2.1: Dynamische Vereins-Infrastruktur (Stufe 1–5), Umbruch-Säulen & Tiefen-Finanzmodell'
                    : 'New in Version 2.1: Dynamic Facility Milestones (Lvl 1–5), Rebuild Pillars & Deep Financial Realism'}
                </strong>
                <span>
                  {isDe
                    ? 'Das v2.1-Update erweitert die Simulation um 5-stufige Meilenstein-Fähigkeiten für Jugendakademie (inkl. Auslands-Scouting & Dynastie-Immunität) und Medizinisches Zentrum (In-House-Reha, Sportwissenschafts-Labor, Kryokammer & +1.0 Matchday-OVR), den Generationen-Umbruch (5-Jahres-Zyklus), Anti-Metronom-Taktikverschleiß, Institutionelle Bankdarlehen (10/15/25 Jahre), Luxus- & Dynastie-Steuern sowie eine 100% synchronisierte Decision-Day- und Playoff-Engine.'
                    : 'The v2.1 update introduces 5-tier capability milestones for both the Youth Academy (scaled scouting quotas, legal anti-poaching shields, foreign wonderkid imports 🌍, and Level 5 Dynasty Immunity) and the Medical Center (In-House Rehab, Sports Science Lab, Cryo & Biomechanics retirement caps, and +1.0 Matchday Conditioning OVR), alongside Generational Squad Rebuilds, Anti-Metronome tactical staleness tracking, Institutional Bank Loans (10/15/25-yr amortization), Competitive Balance Luxury Taxes, and authoritative Decision Day & Playoff synchronization.'}
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.06] text-xs text-zinc-400">
                <strong className="text-zinc-200 font-semibold">
                  {isDe ? 'v2.0 Fundament:' : 'v2.0 Core Foundation:'}
                </strong>{' '}
                {isDe
                  ? '18 kalibrierte europäische und internationale Ligapyramiden, striktes 2-1-0-Punktesystem, authentische TV-Broadcaster sowie Verlängerungen und Siebenmeterwerfen.'
                  : '18 calibrated European and international league pyramids, strict 2-1-0 handball scoring, authentic public broadcasters, and knockout overtime & 7-meter penalty shootouts.'}
              </div>
            </div>
          </div>
        </section>

        <hr className="border-white/[0.06]" />

        {/* Section 1: Core Rules, Scoring & 18 Leagues */}
        <section id="rules" className="scroll-mt-10 space-y-4">
          <div className="flex items-center gap-2.5 text-sky-400">
            <span className="text-sky-400 text-lg font-mono font-bold">01.</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {isDe ? 'Das 2-1-0 Punktesystem & 18 Ligen' : 'The 2-1-0 Scoring System & 18 League Pyramids'}
            </h2>
          </div>
          <p>
            {isDe
              ? 'Der europäische Vereinshandball folgt traditionell dem klassischen 2-1-0-Punktesystem und nicht der modernen Drei-Punkte-Regel des Fußballs. Jede reguläre Spielzeit umfasst Hin- und Rückrunde mit Heim- und Auswärtsspielen.'
              : 'European handball historically operates under the classic 2-1-0 Points System rather than the three-point football rule. Every standard league season consists of a double round-robin format with balanced home and away fixtures.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] text-center">
              <span className="text-2xl font-black text-emerald-400 block mb-0.5">2</span>
              <strong className="text-white text-xs uppercase tracking-wider block font-bold">{isDe ? 'Punkte bei Sieg' : 'Points for Win'}</strong>
              <span className="text-zinc-400 text-[11px]">{isDe ? 'Erfolg nach 60 Minuten' : 'Victory after 60 regulation minutes'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] text-center">
              <span className="text-2xl font-black text-amber-400 block mb-0.5">1</span>
              <strong className="text-white text-xs uppercase tracking-wider block font-bold">{isDe ? 'Punkt bei Remis' : 'Point for Draw'}</strong>
              <span className="text-zinc-400 text-[11px]">{isDe ? 'Unentschieden bei Abpfiff' : 'Both teams share the points'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] text-center">
              <span className="text-2xl font-black text-rose-400 block mb-0.5">0</span>
              <strong className="text-white text-xs uppercase tracking-wider block font-bold">{isDe ? 'Punkte bei Niederlage' : 'Points for Loss'}</strong>
              <span className="text-zinc-400 text-[11px]">{isDe ? 'Keine Punkte gutgeschrieben' : 'Zero points awarded'}</span>
            </div>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li>
              <strong className="text-white">{isDe ? 'Tabellen-Reihenfolge:' : 'Standings Hierarchy & Tiebreakers:'}</strong>{' '}
              {isDe
                ? 'Bei Punktgleichheit entscheiden nacheinander Tordifferenz, erzielte Tore und direkter Vergleich.'
                : 'Standings parity is resolved by Total Points, followed by Goal Difference, Total Goals Scored, and Head-to-Head record.'}
            </li>
            <li>
              <strong className="text-white">{isDe ? '18 Spielbare Nationen:' : '18 Playable Nations & Pyramids:'}</strong>{' '}
              {isDe
                ? 'Deutschland (6 Ligen bis zur Regionalliga), Dänemark, Frankreich, Spanien, Schweden, Kroatien, Portugal, Norwegen, Ungarn, Island, Polen, Österreich, Schweiz, Slowenien, Italien, Nordmazedonien, Rumänien und die USA.'
                : 'Germany (6 tiers down to Regionalliga), Denmark, France, Spain, Sweden, Croatia, Portugal, Norway, Hungary, Iceland, Poland, Austria, Switzerland, Slovenia, Italy, North Macedonia, Romania, and the United States.'}
            </li>
          </ul>
        </section>

        <hr className="border-white/[0.06]" />

        {/* Section 2: Relegation & Lowest Tier Floor Retention */}
        <section id="relegation" className="scroll-mt-10 space-y-4">
          <div className="flex items-center gap-2.5 text-rose-400">
            <span className="text-rose-400 text-lg font-mono font-bold">02.</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {isDe ? 'Abstiegsregeln & Untere Ligen' : 'Promotion, Relegation & Lowest Tier Floor Rules'}
            </h2>
          </div>
          <p>
            {isDe
              ? 'Auf- und Abstiege verbinden die Spielklassen jeder Nation. Am Saisonende steigen die Tabellenletzten ab, während die Meister der unteren Staffeln aufsteigen.'
              : 'Promotions and relegations form the connective tissue of each country’s league pyramid. At the end of Matchday 34, clubs in the red drop zone are relegated, while tier champions ascend to the division above.'}
          </p>
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <i className="fas fa-shield-halved text-rose-400" />
              <span>{isDe ? 'Besondere Regelung für die tiefste Liga (z.B. Liga 6 in Deutschland):' : 'Special Division Floor Retention Rule (e.g. Tier 6 in Germany):'}</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {isDe
                ? 'Vereine in der untersten Liga einer Nation behalten die rote Abstiegszonen-Markierung („R“) in der Tabelle für vollständige visuelle Spannung. Die Teams können jedoch nicht unter den Boden der Pyramide abstürzen und verbleiben in der Liga. Wenn du als Manager jedoch in der Abstiegszone landest, wirst du vom Vorstand wegen sportlichen Misserfolgs fristlos entlassen!'
                : 'Clubs situated in the lowest division of any national pyramid retain the red relegation drop-zone marker ("R") for authentic league tension. However, clubs cannot physically drop below the pyramid floor and remain in the division. If you as manager finish inside the drop zone, the board terminates your contract immediately for sporting failure!'}
            </p>
          </div>
        </section>

        <hr className="border-white/[0.06]" />

        {/* Section 3: Career Progression & Endless Mode */}
        <section id="career" className="scroll-mt-10 space-y-4">
          <div className="flex items-center gap-2.5 text-amber-400">
            <span className="text-amber-400 text-lg font-mono font-bold">03.</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {isDe ? 'Die 35-Jahre-Karriere & Endlos-Modus' : 'The 35-Season Career & Endless Mode'}
            </h2>
          </div>
          <p>
            {isDe
              ? 'Deine Trainerlaufbahn erstreckt sich über einen Horizont von 35 Saisons. Du kannst einen europäischen Spitzenclub an der Spitze halten oder einen unterklassigen Traditionsverein aus der Regionalliga nach oben führen. Nach Saison 35 kannst du nahtlos in den Endlos-Modus wechseln, um unbegrenzt weiterzuspielen.'
              : 'Your managerial tenure spans a core 35-season window to build an indelible legacy. You can take charge of an established continental powerhouse or choose a regional underdog and engineer an ascent up the European pyramid. Completing Season 35 unlocks Endless Mode so you can manage indefinitely.'}
          </p>
          <p>
            {isDe
              ? 'Trainerwechsel & Vereinsgedächtnis: Als erfolgreicher Manager erhältst du Angebote von anderen Vereinen. Wenn du zu einem neuen Club wechselst, speichert das Spiel den Fortschritt deines bisherigen Vereins (Hallenkapazität, Jugendakademie, medizinisches Zentrum). Kehrst du Jahre später zurück, findest du all deine aufgebauten Strukturen intakt vor.'
              : 'Managerial Mobility & World Continuity: You are never locked to one club. As your reputation grows, European clubs will extend contract offers. When you change clubs, the persistent universe remembers your previous club’s arena expansions, youth academy, and medical investments, ensuring seamless continuity if you return years later.'}
          </p>
        </section>

        <hr className="border-white/[0.06]" />

        {/* Section 4: Continental & National Cups */}
        <section id="cups" className="scroll-mt-10 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <span className="text-emerald-400 text-lg font-mono font-bold">04.</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {isDe ? 'Europapokal & Nationale Pokale' : 'Continental Tournaments & National Cups'}
            </h2>
          </div>
          <p>
            {isDe
              ? 'Der europäische Handball bietet ein renommiertes internationales Pokalsystem, organisiert von der EHF (European Handball Federation) und IHF, sowie traditionsreiche nationale Pokalwettbewerbe:'
              : 'European club handball features a prestigious continental pyramid organized by the European Handball Federation (EHF) and International Handball Federation (IHF), alongside rich domestic cup tournaments:'}
          </p>
          <div className="space-y-3 text-zinc-300">
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <i className="fas fa-trophy text-amber-400 text-xs" />
                <span>{isDe ? 'EHF Champions League (Platz 1 & 2)' : 'EHF Champions League (Places 1 & 2)'}</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {isDe
                  ? 'Die Königsklasse des Welthandballs. Die beiden Erstplatzierten der 1. Liga qualifizieren sich direkt für dieses Elite-Turnier bis zum spektakulären EHF FINAL4 in der LANXESS arena in Köln.'
                  : 'The pinnacle of club handball. Finishing 1st or 2nd in Tier 1 grants direct entry into Europe’s premier club tournament culminating in the prestigious EHF FINAL4 at the LANXESS arena in Cologne.'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <i className="fas fa-shield text-sky-400 text-xs" />
                <span>{isDe ? 'EHF European League (Platz 3 bis 5 & Pokalsieger)' : 'EHF European League (Places 3 to 5 & Cup Winners)'}</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {isDe
                  ? 'Der zweithöchste kontinentale Wettbewerb. Teams auf den Rängen 3 bis 5 sowie der Sieger des nationalen Pokals treten hier in Gruppen- und K.-o.-Phasen an.'
                  : 'The second-tier continental showcase. Teams finishing 3rd through 5th, plus national cup winners, qualify for the European League.'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <i className="fas fa-medal text-emerald-400 text-xs" />
                <span>{isDe ? 'EHF European Cup (Platz 6)' : 'EHF European Cup (Place 6)'}</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {isDe
                  ? 'Der dritte kontinentale Pokalwettbewerb für qualifizierte Clubs europäischer Verbände.'
                  : 'The third continental cup contested by eligible European contenders.'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <i className="fas fa-earth-europe text-indigo-400 text-xs" />
                <span>{isDe ? 'Nationale Pokalwettbewerbe & IHF Super Globe' : '18 Domestic Cups & IHF Super Globe'}</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {isDe
                  ? 'Alle 18 Nationen besitzen ihren offiziellen Verbandspokal (DHB-Pokal, Santander Cup, Coupe de France, Copa del Rey, Pokal Slovenije, Coppa Italia usw.) mit Endspielen in legendären Arenen. Der Champions-League-Sieger qualifiziert sich für den IHF Super Globe zur Vereins-WM.'
                  : 'All 18 nations feature their authentic national cup (DHB-Pokal, Santander Cup, Coupe de France, Copa del Rey, Pokal Slovenije, Coppa Italia, etc.) with finals in legendary arenas. The Champions League winner unlocks the IHF Super Globe club world championship.'}
              </p>
            </div>
          </div>
        </section>

        <hr className="border-white/[0.06]" />

        {/* Section 5: Tactics, Match Simulation & Decision Day */}
        <section id="tactics" className="scroll-mt-10 space-y-4">
          <div className="flex items-center gap-2.5 text-indigo-400">
            <span className="text-indigo-400 text-lg font-mono font-bold">05.</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {isDe ? 'Taktik, Match-Vielfalt & Decision Day' : 'Match Tactics, Results Variety & Decision Day'}
            </h2>
          </div>
          <p>
            {isDe
              ? 'Deine taktische Ausrichtung beeinflusst Tore, Gegentore und Spieltempo direkt im Match:'
              : 'Your tactical instructions directly alter match simulation scores, goal frequency, and defensive rigidity:'}
          </p>
          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
              <strong className="text-white block font-bold">Total Handball:</strong>
              <span className="text-zinc-400">{isDe ? 'Ausgewogenes modernes Spiel mit disziplinierter 6-0 Abwehr und geregeltem Positionsangriff.' : 'Balanced modern game emphasizing disciplined transition play and sound 6-0 defensive retreats.'}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
              <strong className="text-white block font-bold">{isDe ? 'Tempospiel / Erste Welle (+18% Tore, +10% Gegentore):' : 'Fast Break (+18% Scored, +10% Conceded):'}</strong>
              <span className="text-zinc-400">{isDe ? 'Höchstes Tempo über schnelle Außen, sorgt für torreiche Schlagabtausche.' : 'Rapid counter-attacks and wing rushes, producing high-scoring contests.'}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
              <strong className="text-white block font-bold">{isDe ? 'Abwehrbollwerk 6:0 (-38% Tore, -48% Gegentore):' : 'Defensive Wall 6:0 (-38% Scored, -48% Conceded):'}</strong>
              <span className="text-zinc-400">{isDe ? 'Körperbetonter, massiver Abwehrriegel am eigenen Kreis, der das Spieltempo drosselt.' : 'A physically imposing low-block defense creating gritty, low-scoring battles.'}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
              <strong className="text-white block font-bold">{isDe ? 'Offensive 3:2:1 Deckung:' : 'Offensive 3:2:1 (Interception Hunting):'}</strong>
              <span className="text-zinc-400">{isDe ? 'Aggressives Vorrücken zur Passunterbrechung, birgt aber Lücken gegen wendige Kreisläufer.' : 'Active perimeter pressure designed to force turnovers, but leaves vulnerabilities against agile line pivots.'}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
              <strong className="text-white block font-bold">{isDe ? 'Überzahl 7 gegen 6:' : 'Power Play 7v6 (Empty Net Attack):'}</strong>
              <span className="text-zinc-400">{isDe ? 'Nimmt den Torwart für einen siebten Feldspieler heraus, birgt aber die Gefahr von Gegentoren ins leere Tor.' : 'Pulls the goalkeeper for an extra outfield attacker to crack defensive blocks, at the risk of conceding empty-net goals.'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2 mt-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <i className="fas fa-chess-knight text-amber-400 text-xs" />
              <span>{isDe ? 'Taktischer Verschleiß (Anti-Metronom) & Trainer-Archetypen' : 'Tactical Staleness (Anti-Metronome) & Staff Archetypes'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300">
              {isDe
                ? 'Gegnerische Trainer entschlüsseln dein Spielsystem über ein rollierendes 4-Saisons-Fenster: Selbst wer nur zwischen zwei Taktiken hin- und herwechselt, erleidet ab dem 3. Einsatzjahr spürbare Effizienzverluste. Zudem kannst du Cheftrainer- und Sportdirektor-Archetypen (z. B. Taktiker, Jugendförderer, Finanzmogul) verpflichten, um deine Vereinsphilosophie gezielt zu schärfen.'
                : 'Opposing coaches scout and adapt to your tactical system across a rolling 4-season window—preventing two-tactic alternating exploits and requiring genuine tactical evolution after 3 seasons of heavy usage. You can also appoint specialized Head Coach and Sporting Director archetypes (Tactician, Youth Developer, Continental Legend, Financial Mogul) to shape your club identity.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2 mt-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <i className="fas fa-tv text-sky-400 text-xs" />
              <span>{isDe ? 'Decision Day (34. Spieltag) & Live-Broadcaster' : 'Decision Day (Matchday 34) & Authentic Broadcasters'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300">
              {isDe
                ? 'Am 34. Spieltag schaltet das Spiel in den Decision Day-Modus: Meisterschaftsfinale, direkter Aufstiegskampf, Relegationsduelle (Platz 16 gegen 2. Liga Platz 3) und direkter Abstiegskampf werden live von authentischen TV-Sendern (ARD, ZDF, Dyn, DR, France TV, TVP, NRK, SVT, ORF, SRF, DAZN) begleitet und 1:1 mit der Abschlusstabelle synchronisiert.'
                : 'Matchday 34 triggers Decision Day mode: Title deciders, direct promotion shootouts, 3rd-place promotion/relegation playoffs, and survival dogfights are staged with live score tickers on authentic regional broadcasters (ARD, ZDF, Dyn, DR, France TV, TVP, NRK, SVT, ORF, SRF, DAZN) and strictly synchronized with the final league standings.'}
            </p>
          </div>
        </section>

        <hr className="border-white/[0.06]" />

        {/* Section 6: Arena Operations & Supporter Culture */}
        <section id="arena" className="scroll-mt-10 space-y-4">
          <div className="flex items-center gap-2.5 text-rose-400">
            <span className="text-rose-400 text-lg font-mono font-bold">06.</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {isDe ? 'Hallen-Wirtschaft & Fankultur' : 'Arena Operations & Supporter Culture'}
            </h2>
          </div>
          <p>
            {isDe
              ? 'Deine Heimspielstätte ist das wirtschaftliche Herzstück des Vereins. Zuschauereinnahmen entstehen aus dem Zusammenspiel von Ticketnachfrage und Hallenkapazität. Ist die Nachfrage größer als die Halle, gehen wertvolle Einnahmen verloren.'
              : 'Your home venue is your primary operational engine. Ticket revenue scales with matchday attendance, which is governed by active supporter demand and physical seat capacity. When demand exceeds capacity, fans are turned away and potential ticket receipts are lost.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.04]">
              <strong className="text-white block font-bold mb-1">{isDe ? 'Hexenkessel & Fanclubs:' : 'Acoustic Cauldron & Fan Clubs:'}</strong>
              <span className="text-zinc-400">{isDe ? 'Vergünstigte Stehplätze, Pauken und Trommeln erzeugen ohrenbetäubenden Lärm (+2 Heim-OVR-Boost bei -8% Ticketausbeute).' : 'Discount standing terraces and marching drums create a deafening arena roar (+2 Home OVR boost, -8% ticket yield).'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.04]">
              <strong className="text-white block font-bold mb-1">{isDe ? 'Basis & Familien:' : 'Grassroots & Family:'}</strong>
              <span className="text-zinc-400">{isDe ? 'Schulaktionen und Familienblöcke steigern das langfristige Fanwachstum um +25%.' : 'Family sectors and school clinic visits boost long-term fanbase growth by +25%.'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.04]">
              <strong className="text-white block font-bold mb-1">{isDe ? 'VIP & Firmen-Logen:' : 'VIP & Corporate Hospitality:'}</strong>
              <span className="text-zinc-400">{isDe ? 'Geschäftskunden und VIP-Pakete maximieren die Ticketeinnahmen (+30%), dämpfen aber die Stimmung leicht (-1 OVR).' : 'Executive hospitality suites increase ticket revenue by +30% at a slight cost to crowd intensity (-1 OVR).'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.04]">
              <strong className="text-white block font-bold mb-1">{isDe ? 'Ausgewogen:' : 'Balanced Standard:'}</strong>
              <span className="text-zinc-400">{isDe ? 'Klassischer Mittelweg aus Stimmung, Wachstum und Einnahmen.' : 'Traditional baseline balancing atmosphere, growth, and finances.'}</span>
            </div>
          </div>
        </section>

        <hr className="border-white/[0.06]" />

        {/* Section 7: Finances, Debt & Licensing */}
        <section id="finances" className="scroll-mt-10 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <span className="text-emerald-400 text-lg font-mono font-bold">07.</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {isDe ? 'Vereinsfinanzen, Schulden & Lizenzierung' : 'Club Finances, Debt & Licensing'}
            </h2>
          </div>
          <p>
            {isDe
              ? 'Handballclubs wirtschaften mit realistischen europäischen Etats (ca. 500.000 € in unteren Klassen bis zu 10–15 Millionen € bei Champions-League-Spitzenteams). Die Liga prüft die Finanzen streng:'
              : 'Handball clubs operate on realistic European balance sheets (€500k in lower divisions to €10M–€15M at elite top-flight clubs). The league enforces strict licensing criteria:'}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li>
              <strong className="text-white">{isDe ? 'Punkteabzug bei Minusbilanz:' : 'Point Deductions for Deficits:'}</strong>{' '}
              {isDe ? 'Schließt du eine Saison im Minus ab, startet dein Verein mit Strafpunkten in die Folgesaison.' : 'Ending a season with a negative treasury balance incurs disciplinary point deductions next season.'}
            </li>
            <li>
              <strong className="text-white">{isDe ? '3-Jahre-Insolvenzregel:' : '3-Year Insolvency Threat:'}</strong>{' '}
              {isDe ? 'Drei aufeinanderfolgende Saisons mit Schulden führen zur Lizenzverweigerung und sofortigen Entlassung.' : 'Finishing 3 consecutive seasons in deficit triggers an insolvency crisis and board dismissal.'}
            </li>
            <li>
              <strong className="text-white">{isDe ? 'Regionales Partner-Konsortium:' : 'Regional Partner Consortium (Emergency Relief):'}</strong>{' '}
              {isDe ? 'Einmal alle 3 Saisons kannst du bei drohender Zahlungsunfähigkeit das Konsortium lokaler Förderer einberufen. Die Partner übernehmen 50% der aufgelaufenen Schulden.' : 'Once every 3 seasons, clubs facing severe debt can convene regional business patrons to inject capital and absorb 50% of outstanding debt.'}
            </li>
            <li>
              <strong className="text-white">{isDe ? 'Sponsoren-Verhandlungen:' : 'Commercial Sponsorship Pitches:'}</strong>{' '}
              {isDe ? 'Verhandle mit Ausrüstern und Werbepartnern (Kempa, SELECT, Liqui Moly, Hummel) über Vorabzahlungen zur Liquiditätssicherung.' : 'Negotiate deals with commercial handball brands (Kempa, SELECT, Liqui Moly, Hummel) for upfront cash infusions.'}
            </li>
            <li>
              <strong className="text-white">{isDe ? 'Institutionelle Bankdarlehen & Vorzeitige Tilgung:' : 'Institutional Bank Loans & Early Settlement Rebates:'}</strong>{' '}
              {isDe
                ? 'Nimm zweckgebundene Vereinsdarlehen mit Laufzeiten von 10 (3,5%), 15 (4,5%) oder 25 Jahren (5,5%) für Hallen- und Infrastrukturprojekte auf. Sondertilgungen gewähren sofortige Zinsrabatte.'
                : 'Access institutional credit facilities across 10-year (3.5%), 15-year (4.5%), and 25-year (5.5%) amortization terms, with interest rebates for early principal settlement.'}
            </li>
            <li>
              <strong className="text-white">{isDe ? 'Gehalts-Soft-Cap, Luxussteuer & Dynastie-Abgabe:' : 'Payroll Soft Cap, Luxury Tax & Dynasty Repeater Levy:'}</strong>{' '}
              {isDe
                ? 'Progressive Luxussteuern auf gehortete Milliarden-Reserven (Endowment-Rendite gedeckelt bei max. 2,5 Mio. €/Jahr) sowie eine Gehalts-Luxusabgabe für überdimensionierte Galactico-Kader sichern die langfristige Wettbewerbsbalance.'
                : 'Progressive Competitive Balance Luxury Taxes on excessive cash hoarding (with annual treasury endowment yields capped at €2.5M) and a Squad Payroll Soft Cap & Dynasty Repeater Levy prevent runaway financial monopolies.'}
            </li>
            <li>
              <strong className="text-white">{isDe ? 'Börsengang (IPO) & Aktienmarkt:' : 'Corporate Equity (IPO) & Stock Market:'}</strong>{' '}
              {isDe 
                ? 'Wandle deinen Verein in eine börsennotierte Kapitalgesellschaft (z. B. AG in Deutschland, SAD in Portugal/Spanien, PLC) um und gehe an die Börse, um massiv Kapital einzusammeln. Aber Vorsicht: Fällt der Aktienkurs unter den IPO-Wert, wird eine Strafdividende (Shareholder Dividend Trap) von bis zu 60% deiner operativen Marge fällig!' 
                : 'Transform your club into a public corporation (e.g. AG in Germany, SAD in Portugal/Spain, PLC) and launch an IPO for a massive capital injection. Beware the Shareholder Dividend Trap: if your live stock price falls below the initial offering price, the board will siphon up to 60% of your operating margin to appease angry shareholders!'}
            </li>
          </ul>
        </section>

        <hr className="border-white/[0.06]" />

        {/* Section 8: Youth Academy & Medical Center (Levels 1-5) */}
        <section id="youth" className="scroll-mt-10 space-y-4">
          <div className="flex items-center gap-2.5 text-sky-400">
            <span className="text-sky-400 text-lg font-mono font-bold">08.</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {isDe ? 'Jugendakademie & Medizinisches Zentrum (Stufe 1–5)' : 'Youth Academy & Medical Center Milestones (Levels 1–5)'}
            </h2>
          </div>
          <p>
            {isDe
              ? 'Beide Säulen deiner Vereinsinfrastruktur lassen sich über 5 Ausbaustufen entwickeln (max. 2 Baukräne pro Saison) und schalten auf jeder Stufe einzigartige strategische Vorteile frei:'
              : 'Both pillars of your club infrastructure scale across 5 upgrade levels (up to 2 active construction cranes per season), unlocking transformative strategic capabilities at every tier:'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Academy Milestones Card */}
            <div className="p-4 rounded-2xl bg-emerald-950/15 border border-emerald-500/25 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <i className="fas fa-seedling" />
                <span>{isDe ? 'Nachwuchsleistungszentrum (Stufe 1–5)' : 'Youth Academy Progression (Lvl 1–5)'}</span>
              </div>
              <ul className="space-y-1.5 text-zinc-300 text-xs leading-relaxed">
                <li><strong className="text-white">Lvl 1 (6 Slots):</strong> {isDe ? '1 Scouting-Mission pro Saison + 1 kostenloser Schul-Tryout.' : '1 paid scouting mission per season + 1 free regional school trialist.'}</li>
                <li><strong className="text-emerald-300">Lvl 2 · Regional Hub (8 Slots):</strong> {isDe ? 'Schaltet 2 Scouting-Missionen pro Saison frei (+1 OVR Potenzial für bestehende Talente).' : 'Unlocks 2 scouting missions per season & elevates existing prospects (+1 OVR potential).'}</li>
                <li><strong className="text-emerald-300">Lvl 3 · National NLZ (10 Slots):</strong> {isDe ? '3 Scouts/Saison & Rechtsschild-Abwerbeschutz gegen Top-Clubs.' : '3 scouts/season & unlocks Anti-Poaching Legal Shielding against rival predators.'}</li>
                <li><strong className="text-emerald-300">Lvl 4 · Continental Setup (12 Slots):</strong> {isDe ? '4 Scouts/Saison & Internationale Top-Talente 🌍 (DEN, FRA, ESP, SWE, NOR, CRO, SLO) mit erhöhtem Basis-Potenzial.' : '4 scouts/season & unlocks Foreign Wonderkid Imports 🌍 (DEN, FRA, ESP, SWE, NOR, CRO, SLO) with enhanced skill baselines.'}</li>
                <li><strong className="text-emerald-300">Lvl 5 · Global Dynasty (14 Slots):</strong> {isDe ? '5 Scouts/Saison, 100% Abwerbe-Immunität & permanente Befreiung vom „Target on the Back“-Meister-Malus.' : '5 scouts/season, 100% poaching immunity & permanent immunity from the "Target on the Back" multi-year title defender penalty.'}</li>
              </ul>
            </div>

            {/* Medical Milestones Card */}
            <div className="p-4 rounded-2xl bg-purple-950/15 border border-purple-500/25 space-y-2.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <i className="fas fa-heart-pulse" />
                <span>{isDe ? 'Medizinisches Zentrum (Stufe 1–5)' : 'Medical Center Progression (Lvl 1–5)'}</span>
              </div>
              <ul className="space-y-1.5 text-zinc-300 text-xs leading-relaxed">
                <li><strong className="text-white">Lvl 1:</strong> {isDe ? 'Basis-Physiotherapie zur Standard-Belastungssteuerung.' : 'Baseline physiotherapy and standard squad recovery.'}</li>
                <li><strong className="text-purple-300">Lvl 2 · In-House Rehab Suite:</strong> {isDe ? 'Kostenlose Reha bei Saison-Verletzungsdilemmas (0 € statt 40.000 €) & -50% Krisen-Rehakosten.' : 'Free mid-season injury dilemma rehab (€0 vs €40k) & -50% crisis rehabilitation cost.'}</li>
                <li><strong className="text-purple-300">Lvl 3 · Sports Science Lab:</strong> {isDe ? 'Permanente Immunität gegen dramatischen Kaderverfall, 100% Star-Playmaker-Genesung & -50% Meister-Ermüdung.' : 'Permanent immunity from Dramatic Squad Decay, 100% Star Injury recovery & -50% Title Defender fatigue tax.'}</li>
                <li><strong className="text-purple-300">Lvl 4 · Cryo &amp; Biomechanics:</strong> {isDe ? 'Begrenzt Karriereenden auf max. 1 Spieler/Jahr & bewahrt 50% des Veteran-Ringer-OVR-Bonus bei Rücktritt.' : 'Caps annual retirements at max 1 player/yr & retains 50% of Veteran Ringer OVR bonus upon retirement.'}</li>
                <li><strong className="text-purple-300">Lvl 5 · Peak Performance Institute:</strong> {isDe ? '+1.0 Matchday-Konditions-OVR in jedem Pflichtspiel, -50% Generationen-Fluktuationsschutz & Dynastie-Immunität.' : '+1.0 Matchday Conditioning OVR in every match, -50% Generational Turnover shield & permanent Dynasty Immunity.'}</li>
              </ul>
            </div>
          </div>

          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li>
              <strong className="text-white">{isDe ? 'Generationen-Umbruch (5-Jahres-Cooldown):' : 'Generational Squad Rebuild (5-Season Cooldown):'}</strong>{' '}
              {isDe ? 'Verkaufe alternde Großverdiener für eine hohe Transfer-Abfindung, senke sofort die Gehaltsliste und führe 2 hochveranlagte Akademietalente in den Kader ein.' : 'Liquidate aging high-earners for an immediate transfer windfall, slash bloated wage bills, and inject 2 high-ceiling wonderkids into your academy pipeline.'}
            </li>
            <li>
              <strong className="text-white">{isDe ? 'Kooperationsverein-Leihe (+1 OVR) & Zweitvertretungen („II“):' : 'Affiliate Farm Loan (+1 OVR) & Reserve Teams ("II"):'}</strong>{' '}
              {isDe ? 'Verleihe Talente für 1 Saison (+1 OVR Bonus bei Rückkehr). Zweitmannschaften (z. B. Füchse Berlin II) rotieren automatisch Nachwuchsspieler ohne Notfall-Abzüge und sind auf 1.500 Hallenplätze begrenzt.' : 'Loan prospects for 1 season for a guaranteed +1 OVR developmental boost. Reserve clubs ("II") automatically rotate academy affiliates without emergency callup penalties and operate under an authentic 1,500-seat arena cap.'}
            </li>
          </ul>
        </section>

        <hr className="border-white/[0.06]" />

        {/* Section 9: Mods & Community Data */}
        <section id="mods" className="scroll-mt-10 space-y-4">
          <div className="flex items-center gap-2.5 text-amber-400">
            <span className="text-amber-400 text-lg font-mono font-bold">09.</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {isDe ? 'Community-Datenbanken & Mods' : 'Community Database Mods & Base Export'}
            </h2>
          </div>
          <p>
            {isDe
              ? 'Passe Handball Manager mit benutzerdefinierten Community-Datenbanken nach deinen Wünschen an:'
              : 'Customize Handball Manager with authentic community rosters, real team names, or custom universe files:'}
          </p>
          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.04] flex items-start gap-3">
              <i className="fas fa-file-arrow-up text-amber-400 mt-1 shrink-0" />
              <div>
                <strong className="text-white block font-bold">{isDe ? 'Eigene JSON-Mods importieren:' : 'Upload Custom JSON Database:'}</strong>
                <span className="text-zinc-400">{isDe ? 'Lade eine eigene Club- und Spielerdatei im JSON-Format hoch. Das System validiert das Schema in Echtzeit.' : 'Import your custom clubs and rosters in JSON format with real-time schema validation.'}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.04] flex items-start gap-3">
              <i className="fas fa-file-arrow-down text-emerald-400 mt-1 shrink-0" />
              <div>
                <strong className="text-white block font-bold">{isDe ? 'Basis-Datenbank exportieren:' : 'Export Base Handball Database:'}</strong>
                <span className="text-zinc-400">{isDe ? 'Lade die vollständige Basis-Datenbank (handball_base_database.json) mit einem Klick herunter, um als Vorlage für eigene Modifikationen zu dienen.' : 'Download the complete canonical database (handball_base_database.json) with one click to use as a starting template for your own mods.'}</span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Bottom Action Footer */}
      {onStartCareer && (
        <div className="text-center pt-10 mt-14 border-t border-white/[0.08]">
          <button
            onClick={onStartCareer}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider py-3.5 px-8 rounded-xl transition active:scale-95 shadow-xl cursor-pointer"
          >
            <i className="fas fa-play text-xs" />
            <span>{isDe ? 'Zurück zum Spielgeschehen' : 'Return to Career Dashboard'}</span>
          </button>
        </div>
      )}
    </article>
  );
};
