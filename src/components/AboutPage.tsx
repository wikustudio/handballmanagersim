import React from 'react';
import { Club, Language } from '../types';

interface AboutPageProps {
  clubsDb?: Club[];
  lang?: Language;
  isCourtside?: boolean;
  onStartCareer?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  lang = 'en',
  isCourtside = false,
  onStartCareer,
}) => {
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
      const target =
        section || (view === 'tactics' ? 'tactics' : view === 'leagues' ? 'rules' : null);
      if (target) {
        setTimeout(() => {
          scrollTo(target);
        }, 150);
      }
    } catch {
      // ignore
    }
  }, []);

  const cardSurface = isCourtside
    ? 'courtside-card p-5 sm:p-6'
    : 'p-5 sm:p-6 rounded-2xl bg-[#12141e] border border-white/[0.06]';
  const subSurface = isCourtside
    ? 'p-4 rounded-2xl bg-[#F6F5F1] border border-black/[0.05]'
    : 'p-4 rounded-xl bg-black/30 border border-white/[0.05]';
  const headingPrimary = isCourtside ? 'text-[#14161D]' : 'text-white';
  const bodyCopy = isCourtside ? 'text-[#454B59]' : 'text-zinc-300';
  const mutedCopy = isCourtside ? 'text-[#6E7381]' : 'text-zinc-400';
  const accentText = isCourtside ? 'text-[#DF642A]' : 'text-amber-400';
  const dividerBorder = isCourtside ? 'border-black/[0.06]' : 'border-white/[0.08]';

  return (
    <article
      className={`w-full max-w-5xl px-4 sm:px-8 py-6 sm:py-10 mx-auto pb-24 font-sans ${bodyCopy}`}
    >
      {/* Top Header */}
      <header
        className={`mb-8 pb-6 border-b ${dividerBorder} flex flex-col md:flex-row md:items-end justify-between gap-5`}
      >
        <div>
          <div className={`flex items-center gap-2 mb-2 text-xs font-semibold ${mutedCopy}`}>
            <span className={accentText}>
              {isDe ? 'Offizielles Spielhandbuch' : 'Official Game Manual'}
            </span>
            <span aria-hidden="true">·</span>
            <span>v 3.0 Courtside Edition</span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight text-balance ${headingPrimary}`}
          >
            {isDe ? 'Über Handball Manager & Spielregeln' : 'About Handball Manager & Rules'}
          </h1>
          <p className={`text-sm sm:text-base mt-2 leading-relaxed max-w-2xl ${mutedCopy}`}>
            {isDe
              ? 'Der vollständige Leitfaden zu 20 europäischen Ligapyramiden, dem 2-1-0-Punktesystem, der 3D-40×20m-Halle bis 30.000 Plätze, Taktik, Vereinsfinanzen und Nachwuchsförderung.'
              : 'The complete guide to European club pyramids, 2-1-0 handball scoring, live 3D 40×20m arenas scaling up to 30,000 seats, training gym warmups, club commerce, and U19 youth development.'}
          </p>
        </div>

        {onStartCareer && (
          <button
            type="button"
            onClick={onStartCareer}
            className={`shrink-0 min-h-[42px] py-2.5 px-5 rounded-full font-semibold text-xs transition cursor-pointer flex items-center gap-2 self-start md:self-auto whitespace-nowrap ${
              isCourtside
                ? 'bg-[#18191F] hover:bg-[#2A2D37] text-white'
                : 'bg-white hover:bg-zinc-200 text-slate-950'
            }`}
          >
            <i aria-hidden="true" className="fas fa-arrow-left text-xs" />
            <span>{isDe ? 'Zurück zum Verein' : 'Return to Career'}</span>
          </button>
        )}
      </header>

      {/* Quick Table of Contents */}
      <nav
        aria-label="Table of contents"
        className={`mb-8 py-3.5 px-4 rounded-2xl text-xs flex flex-wrap items-center gap-x-3.5 gap-y-2 ${
          isCourtside
            ? 'bg-white border border-black/[0.06] text-[#525866]'
            : 'bg-white/[0.03] border border-white/[0.06] text-zinc-400'
        }`}
      >
        <span className={`font-bold ${headingPrimary}`}>{isDe ? 'Inhalt:' : 'Contents:'}</span>
        {[
          { id: 'intro', label: isDe ? 'Einführung & v3.0' : 'Overview & v3.0' },
          { id: 'rules', label: isDe ? '01. 2-1-0 Wertung' : '01. 2-1-0 Scoring' },
          { id: 'relegation', label: isDe ? '02. Auf- & Abstieg' : '02. Promotion & Floor' },
          { id: 'career', label: isDe ? '03. 35-Jahre-Karriere' : '03. 35-Season Career' },
          { id: 'cups', label: isDe ? '04. Europapokal' : '04. EHF & Domestic Cups' },
          { id: 'tactics', label: isDe ? '05. Taktik & Kader' : '05. Squad & Tactics' },
          { id: 'arena', label: isDe ? '06. 3D-Halle & Fans' : '06. 3D Arena & Fan Strategy' },
          { id: 'finances', label: isDe ? '07. Büro & Finanzen' : '07. Commercial & IPO' },
          { id: 'youth', label: isDe ? '08. U19 & Medizin' : '08. U19 Cup & Facilities' },
          { id: 'network', label: isDe ? '09. Weitere Sport-Sims' : '09. Sister Sports Sims' },
        ].map((item, idx) => (
          <React.Fragment key={item.id}>
            {idx > 0 && <span aria-hidden="true" className="opacity-40">·</span>}
            <button
              type="button"
              onClick={() => scrollTo(item.id)}
              className={`hover:${accentText} font-medium transition cursor-pointer whitespace-nowrap`}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* Main Content Sections */}
      <div className="space-y-6 leading-relaxed text-sm sm:text-[15px]">
        {/* Section 0: Overview & v3.0 */}
        <section id="intro" className={`scroll-mt-20 ${cardSurface} space-y-4`}>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingPrimary}`}>
            {isDe
              ? 'Authentischer Europäischer Vereinshandball'
              : 'Authentic European Club Handball Management'}
          </h2>
          <p>
            {isDe
              ? 'Handball Manager Sim verbindet die rasante Dynamik des Hallenhandballs (50 bis 70 Tore pro Spiel, 6:0- und 3:2:1-Deckungssysteme, Siebenmeter und Tempospiel) mit tiefgreifendem Vereinsmanagement. Als vereinter Cheftrainer und General Manager verantwortest du Taktik, Kaderplanung, Sponsoren, Hallenausbau und Pressearbeit.'
              : 'Handball Manager Sim captures the high-tempo intensity of indoor club handball—50 to 70 goals per match, painted 6m goal creases, dashed 9m free-throw arcs, tactical 7v6 power plays, and deafening arena atmospheres—paired with deep executive club management. Operating as unified Head Coach and General Manager, you control matchday systems, transfers, U19 youth development, commercial deals, and arena infrastructure.'}
          </p>
          <div className={subSurface}>
            <strong className={`block font-bold text-sm mb-1.5 ${headingPrimary}`}>
              {isDe
                ? 'Neu in Version 3.0 (Courtside Edition)'
                : 'What’s New in Version 3.0 (Courtside Edition)'}
            </strong>
            <ul className={`list-disc pl-5 space-y-1 text-xs sm:text-sm ${bodyCopy}`}>
              <li>
                <strong className={headingPrimary}>Real-Life Calibrated Attendance Across All 13 Nations:</strong>{' '}
                Starting crowds, fanbases, and arena turnstiles across Daikin HBL, StarLigue, Herreligaen, ASOBAL, ORLEN Superliga, K&amp;H Liga, and every European pyramid reflect authentic 2024/25 real-world club attendances with dynamic multi-season growth.
              </li>
              <li>
                <strong className={headingPrimary}>Multi-Scene Live 3D 40×20m Handball Arena (Up to 30,000 Seats):</strong>{' '}
                Dynamic 3D match sequences (passing build-up, fast-break transitions, and goal celebrations), luxury 14k+ hospitality bowls, dynamic sideline-to-corner crowd fill, and clean perimeter signage for active sponsors.
              </li>
              <li>
                <strong className={headingPrimary}>3D Squad Training Gym, Level 1–5 HQ &amp; 3D Boardroom:</strong>{' '}
                Run synchronized warmups on the Squad tab, scale Club HQ from Level 1 to Level 5 via Academy &amp; Medical upgrades, and navigate the 3D executive conference table on the Board view.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 1: 2-1-0 Scoring */}
        <section id="rules" className={`scroll-mt-20 ${cardSurface} space-y-4`}>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingPrimary}`}>
            01. The 2-1-0 Scoring System &amp; European Pyramids
          </h2>
          <p>
            European handball operates under the classic <strong>2-1-0 points system</strong> across a double round-robin league calendar. Parity in the table is broken by Points, Goal Difference, Goals Scored, and Head-to-Head record.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
            <div className={`${subSurface} text-center`}>
              <span className="text-2xl font-extrabold text-emerald-600 block">2 pts</span>
              <strong className={`text-xs font-bold block mt-0.5 ${headingPrimary}`}>Win</strong>
              <span className={`text-[11px] ${mutedCopy}`}>Victory after 60 minutes</span>
            </div>
            <div className={`${subSurface} text-center`}>
              <span className={`text-2xl font-extrabold block ${accentText}`}>1 pt</span>
              <strong className={`text-xs font-bold block mt-0.5 ${headingPrimary}`}>Draw</strong>
              <span className={`text-[11px] ${mutedCopy}`}>Shared points at full-time</span>
            </div>
            <div className={`${subSurface} text-center`}>
              <span className="text-2xl font-extrabold text-rose-600 block">0 pts</span>
              <strong className={`text-xs font-bold block mt-0.5 ${headingPrimary}`}>Loss</strong>
              <span className={`text-[11px] ${mutedCopy}`}>Zero points awarded</span>
            </div>
          </div>
          <p className={`text-xs sm:text-sm ${mutedCopy}`}>
            Playable domestic pyramids span Germany (6 divisions down to Regionalliga), Denmark, France, Spain, Sweden, Norway, Hungary, Poland, Croatia, Portugal, Slovenia, Iceland, Switzerland, Austria, Romania, North Macedonia, Italy, and more.
          </p>
        </section>

        {/* Section 2: Promotion & Relegation */}
        <section id="relegation" className={`scroll-mt-20 ${cardSurface} space-y-3.5`}>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingPrimary}`}>
            02. Promotion, Relegation &amp; Pyramid Floor Rules
          </h2>
          <p>
            Division champions and top finishers earn promotion to the tier above, while clubs finishing in the drop zone are relegated—including authentic promotion/relegation playoffs on Decision Day.
          </p>
          <div className={subSurface}>
            <strong className={`block text-xs sm:text-sm font-bold mb-1 ${headingPrimary}`}>
              Lowest Division Floor Rule
            </strong>
            <p className={`text-xs sm:text-sm ${bodyCopy}`}>
              Clubs in the bottom playable tier of a national pyramid cannot drop out of the game world, preserving full division tables—however, finishing inside the red relegation zone still triggers immediate board dismissal for sporting failure unless protected by an Immunity Shield.
            </p>
          </div>
        </section>

        {/* Section 3: 35-Season Career */}
        <section id="career" className={`scroll-mt-20 ${cardSurface} space-y-3.5`}>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingPrimary}`}>
            03. 35-Season Career Horizon &amp; Endless Dynasty Mode
          </h2>
          <p>
            Official Hall of Fame leaderboard runs are evaluated across a 35-season managerial career, after which Endless Mode unlocks so you can continue building your dynasty indefinitely. When you accept job offers elsewhere in Europe, the simulation preserves every club’s arena expansions, academy upgrades, and financial history.
          </p>
        </section>

        {/* Section 4: Cups */}
        <section id="cups" className={`scroll-mt-20 ${cardSurface} space-y-3.5`}>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingPrimary}`}>
            04. EHF Continental Competitions, National Cups &amp; Supercups
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className={subSurface}>
              <strong className={`block font-bold mb-1 ${headingPrimary}`}>
                EHF Champions League (Top 2)
              </strong>
              <span className={mutedCopy}>
                Europe’s premier club competition culminating at the EHF FINAL4, unlocking the IHF Super Globe club world cup.
              </span>
            </div>
            <div className={subSurface}>
              <strong className={`block font-bold mb-1 ${headingPrimary}`}>
                EHF European League &amp; Cup (Places 3–6)
              </strong>
              <span className={mutedCopy}>
                Continental knockout silverwares for upper-table clubs and domestic cup winners.
              </span>
            </div>
            <div className={subSurface}>
              <strong className={`block font-bold mb-1 ${headingPrimary}`}>
                National Cups (DHB-Pokal, Santander Cup, etc.)
              </strong>
              <span className={mutedCopy}>
                Single-elimination domestic cups offering major prize purses and European qualification.
              </span>
            </div>
            <div className={subSurface}>
              <strong className={`block font-bold mb-1 ${headingPrimary}`}>
                Season-Opening Supercup
              </strong>
              <span className={mutedCopy}>
                Reigning league champions and cup holders clash before Matchday 1 for early silverware and treasury prize money.
              </span>
            </div>
          </div>
        </section>

        {/* Section 5: Squad & Tactics */}
        <section id="tactics" className={`scroll-mt-20 ${cardSurface} space-y-3.5`}>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingPrimary}`}>
            05. Squad Building, Training Warmups &amp; Tactical Systems
          </h2>
          <p>
            On the <strong>Squad</strong> workspace, your players warm up in a 3D indoor Sporthalle alongside five core management hubs: <strong>Squad Overview</strong> (OVR, Squad Size, Morale, Youth Slots, Funds Available), <strong>Transfer Market</strong>, <strong>Youth Academy</strong>, <strong>Youth Tournament</strong>, and <strong>Team Retreat</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className={subSurface}>
              <strong className={`block font-bold mb-1 ${headingPrimary}`}>
                Total Handball &amp; Fast Break
              </strong>
              <span className={mutedCopy}>
                Balanced two-way handball or relentless first-wave counterattacks (+18% goals scored, +10% conceded).
              </span>
            </div>
            <div className={subSurface}>
              <strong className={`block font-bold mb-1 ${headingPrimary}`}>
                6:0 Wall, Offensive 3:2:1 &amp; 7v6 Power Play
              </strong>
              <span className={mutedCopy}>
                Compact crease protection, high-pressure interception traps, or pulling the keeper for an extra backcourt attacker.
              </span>
            </div>
          </div>
        </section>

        {/* Section 6: Arena & Fan Strategy */}
        <section id="arena" className={`scroll-mt-20 ${cardSurface} space-y-3.5`}>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingPrimary}`}>
            06. 3D Arena Architecture (Up to 30,000 Seats) &amp; Fan Strategy
          </h2>
          <p>
            Your venue scales organically up to <strong>30,000 seats</strong> via modular <strong>Arena Expansions</strong> or commissioning a landmark <strong>New Arena Complex</strong> with 10–25 year municipal financing. Choose between four 40×20m court designs and tailor your matchday <strong>Fan Strategy</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className={subSurface}>
              <strong className={`block font-bold mb-0.5 ${headingPrimary}`}>Home Fortress</strong>
              <span className={mutedCopy}>+2 Home OVR cauldron roar · -8% ticket yield.</span>
            </div>
            <div className={subSurface}>
              <strong className={`block font-bold mb-0.5 ${headingPrimary}`}>Grassroots</strong>
              <span className={mutedCopy}>+25% long-term supporter &amp; youth pull growth.</span>
            </div>
            <div className={subSurface}>
              <strong className={`block font-bold mb-0.5 ${headingPrimary}`}>VIP Hospitality</strong>
              <span className={mutedCopy}>+30% matchday gate revenue · -1 Home OVR.</span>
            </div>
            <div className={subSurface}>
              <strong className={`block font-bold mb-0.5 ${headingPrimary}`}>Balanced</strong>
              <span className={mutedCopy}>Standard ticket yield and neutral home-court balance.</span>
            </div>
          </div>
        </section>

        {/* Section 7: Commercial & IPO */}
        <section id="finances" className={`scroll-mt-20 ${cardSurface} space-y-3.5`}>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingPrimary}`}>
            07. Commercial Headquarters, Multi-Year Sponsors, Loans &amp; IPO
          </h2>
          <p>
            Manage five commercial pillars around your 3D Club Office: <strong>Treasury</strong>, <strong>Sponsorship Deals</strong> (1–3 year Standard, Megadeal, and Performance contracts), <strong>Marketing &amp; PR</strong>, <strong>Loans</strong> (10, 15, or 25-year amortization with early-repayment rebates), and <strong>Go Public / IPO</strong>. Avoid ending 3 consecutive seasons in debt to pass league licensing!
          </p>
        </section>

        {/* Section 8: U19 Youth Cup & Facilities */}
        <section id="youth" className={`scroll-mt-20 ${cardSurface} space-y-3.5`}>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingPrimary}`}>
            08. Youth Academy, U19 National Tournament &amp; Sports Medicine (Lvl 1–5)
          </h2>
          <p>
            Upgrade both your <strong>Youth Academy</strong> (6 to 14 prospect slots, foreign wonderkid scouting, and poaching shields) and <strong>Medical Department</strong> (injury rehab savings, retirement caps, and +1.0 Matchday OVR at Lvl 5). Once 6 active U19 prospects are enrolled, enter the annual <strong>Youth Tournament</strong> to compete for a permanent <strong>+1 Senior OVR</strong> and <strong>+15% Morale</strong> championship boost.
          </p>
        </section>

        {/* Section 9: Sister Sports Management Sims */}
        <section id="network" className={`scroll-mt-20 ${cardSurface} space-y-4`}>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingPrimary}`}>
              09. Sister Sports Management Sims
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${mutedCopy}`}>
              Enjoying Handball Manager Sim? Take charge of a football club or a basketball franchise in our companion management simulations:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <a
              href="https://footballmanagersim.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${subSurface} flex items-center justify-between gap-3 group transition ${
                isCourtside ? 'hover:bg-[#ECE9E0]' : 'hover:bg-white/[0.06]'
              }`}
            >
              <div>
                <strong className={`text-sm font-bold block ${headingPrimary}`}>
                  Football Manager Sim
                </strong>
                <span className={`text-xs block mt-0.5 ${mutedCopy}`}>
                  Domestic pyramids, European nights, transfers &amp; stadium dynasties — footballmanagersim.com
                </span>
              </div>
              <i
                aria-hidden="true"
                className={`fas fa-arrow-up-right-from-square text-xs shrink-0 ${mutedCopy}`}
              />
            </a>

            <a
              href="https://basketballmanagersim.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${subSurface} flex items-center justify-between gap-3 group transition ${
                isCourtside ? 'hover:bg-[#ECE9E0]' : 'hover:bg-white/[0.06]'
              }`}
            >
              <div>
                <strong className={`text-sm font-bold block ${headingPrimary}`}>
                  Basketball Manager Sim
                </strong>
                <span className={`text-xs block mt-0.5 ${mutedCopy}`}>
                  Draft lottery, salary cap strategy, hardwood tactics &amp; playoff runs — basketballmanagersim.com
                </span>
              </div>
              <i
                aria-hidden="true"
                className={`fas fa-arrow-up-right-from-square text-xs shrink-0 ${mutedCopy}`}
              />
            </a>
          </div>
        </section>
      </div>

      {/* Bottom Action Footer */}
      {onStartCareer && (
        <div className={`text-center pt-8 mt-10 border-t ${dividerBorder}`}>
          <button
            type="button"
            onClick={onStartCareer}
            className={`inline-flex items-center gap-2.5 min-h-[44px] py-3 px-7 rounded-full font-semibold text-xs sm:text-sm transition cursor-pointer ${
              isCourtside
                ? 'bg-[#18191F] hover:bg-[#2A2D37] text-white'
                : 'bg-white hover:bg-zinc-200 text-slate-950'
            }`}
          >
            <i aria-hidden="true" className="fas fa-arrow-left text-xs" />
            <span>{isDe ? 'Zurück zum Dashboard' : 'Return to Career Dashboard'}</span>
          </button>
        </div>
      )}
    </article>
  );
};
