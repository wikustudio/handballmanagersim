import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameState } from '../types';
import { formatMoney, getCountryCurrency, getCountryMult, normalizeCountryCode, calculateClubFinancials } from '../data/gameConstants';

interface IPOModalProps {
  state: GameState;
  isModActive?: boolean;
  onClose: () => void;
  onExecuteIpo: (
    finalIpoPrice: number,
    capitalRaisedK: number,
    stockPrice?: number,
    trustDelta?: number,
    repDelta?: number,
    moraleDelta?: number,
    toastMessage?: string,
    toastType?: 'success' | 'error' | 'info'
  ) => void;
}

const PITCH_PHRASES = [
  'Pitching to Goldman Sachs syndicate...',
  'Hedge funds balking at premium...',
  'Retail order book filling rapidly...',
  'Bookbuilding with Sovereign Wealth...',
  'Morgan Stanley assessing subscription...',
  'Syndicate pricing desks balancing spreads...',
  'Private equity roadshow Q&A live...',
  'Institutional allocations closing...',
  'Wall Street analysts debating multiples...',
  'Global macro funds placing bids...'
];

export const IPOModal: React.FC<IPOModalProps> = ({
  state,
  isModActive = false,
  onClose,
  onExecuteIpo,
}) => {
  const bankName = isModActive ? 'J.P. Morgan & Goldman Sachs' : 'FMS Global Investment Bank';
  const isTier1 = state.club.tier === 1;
  const currentFanbase = state.club.fanBase || 0;
  const hasFanbaseReq = currentFanbase >= 1000000;
  const canFloatIpo = isTier1 && hasFanbaseReq && !state.isPublic;

  const rawCurrency = getCountryCurrency(state.club.country);
  const currency =
    typeof rawCurrency === 'string'
      ? { symbol: rawCurrency, rate: 1 }
      : (rawCurrency as { symbol: string; rate?: number }) || { symbol: '€', rate: 1 };
  const formatSharePrice = (eurVal: number) => {
    const localVal = eurVal * (currency.rate || 1);
    return `${currency.symbol}${localVal >= 100 ? Math.round(localVal).toLocaleString() : localVal.toFixed(2)}`;
  };

  const countryCode = normalizeCountryCode(state.club.country);
  const regulatorMap: Record<string, string> = {
    IND: 'Securities and Exchange Board of India (SEBI)',
    USA: 'U.S. Securities and Exchange Commission (SEC)',
    CAN: 'Canadian Securities Administrators (CSA)',
    ENG: 'UK Financial Conduct Authority (FCA)',
    SCO: 'UK Financial Conduct Authority (FCA)',
    WAL: 'UK Financial Conduct Authority (FCA)',
    JPN: 'Financial Services Agency of Japan (FSA)',
    KOR: 'Financial Services Commission of Korea (FSC)',
    AUS: 'Australian Securities and Investments Commission (ASIC)',
    BRA: 'Comissão de Valores Mobiliários (CVM)',
    ARG: 'Comisión Nacional de Valores (CNV)',
    MEX: 'Comisión Nacional Bancaria y de Valores (CNBV)',
    SUI: 'Swiss Financial Market Supervisory Authority (FINMA)',
    TUR: 'Capital Markets Board of Türkiye (SPK)',
    IDN: 'Otoritas Jasa Keuangan (OJK)',
    COL: 'Superintendencia Financiera de Colombia (SFC)',
    CHI: 'Comisión para el Mercado Financiero (CMF)',
    PER: 'Superintendencia del Mercado de Valores (SMV)',
    ECU: 'Superintendencia de Compañías, Valores y Seguros (SCVS)',
  };
  const eurozoneAndEu = ['GER', 'ESP', 'ITA', 'FRA', 'POR', 'AUT', 'POL', 'GRE', 'CRO', 'SVK', 'DEN', 'NOR', 'SWE'];
  const regulatorName =
    regulatorMap[countryCode] ||
    (eurozoneAndEu.includes(countryCode)
      ? 'European Securities and Markets Authority (ESMA)'
      : 'International Securities & Markets Commission (ISMC)');

  // Step 1: Base valuation calibrated for v2.1 multi-million global fanbases & local league economy
  const cMult = getCountryMult(state.club.country || 'GER');
  const fanMultiple = Math.pow(Math.max(1, currentFanbase / 1000000), 0.55) * 14;
  const repMultiple = Math.max(0.6, (state.reputation || 50) / 50);
  const econScale = Math.max(0.25, Math.min(1.25, cMult));
  const rawBase = Math.max(
    5.0,
    Math.min(65.0, fanMultiple * repMultiple * econScale)
  );
  const basePrice = Number(rawBase.toFixed(2));
  const totalShares = state.sharesOutstanding || 10000000;
  const floatShares = 2500000; // 25%
  const liveFinancials = calculateClubFinancials({ ...state, isManaged: true });

  // Tier 1: Institutional Discount (Safe) -> basePrice * 0.8
  const conservativePrice = Number((basePrice * 0.8).toFixed(2));
  const conservativeCashK = Math.round((floatShares * conservativePrice) / 1000);
  const conservativePopPrice = Number((conservativePrice * 1.2).toFixed(2));

  // Tier 2: Fair Market Value -> basePrice
  const fairPrice = Number(basePrice.toFixed(2));
  const fairCashK = Math.round((floatShares * fairPrice) / 1000);

  // Tier 3: "Greed is Good" (High Risk) -> basePrice * 1.6
  const aggressivePrice = Number((basePrice * 1.6).toFixed(2));
  const aggressiveCashK = Math.round((floatShares * aggressivePrice) / 1000);

  // Step 3: Roadshow Gamble Spinner state
  const [isPitching, setIsPitching] = useState(false);
  const [flashText, setFlashText] = useState('');
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Post-IPO metrics
  const ticker = state.club.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() + ' PLC';
  const currentPrice = state.stockPrice || basePrice;
  const ipoReferencePrice = state.ipoPrice || basePrice;
  const allTimeDeltaPct =
    ipoReferencePrice > 0
      ? Number((((currentPrice - ipoReferencePrice) / ipoReferencePrice) * 100).toFixed(1))
      : 0;
  const marketCapK = Math.round((totalShares * currentPrice) / 1000);
  const publicFloatValueK = Math.round((floatShares * currentPrice) / 1000);

  // Roadshow Strategy Handlers
  const handleConservativeIpo = () => {
    if (!canFloatIpo || isPitching) return;
    onExecuteIpo(
      conservativePrice,
      conservativeCashK,
      conservativePopPrice, // Day 1 Pop: Stock instantly rises 20% post-IPO
      10, // +10 Board Trust
      0,
      0,
      `Institutional Discount IPO Success! Issued at ${formatSharePrice(conservativePrice)}/share (+${formatMoney(conservativeCashK)}). Day 1 Pop boosted stock to ${formatSharePrice(conservativePopPrice)} (+10 Board Trust)!`,
      'success'
    );
  };

  const handleFairMarketIpo = () => {
    if (!canFloatIpo || isPitching) return;
    onExecuteIpo(
      fairPrice,
      fairCashK,
      fairPrice,
      0,
      0,
      0,
      `Fair Market IPO Executed! 2.5M shares floated cleanly at ${formatSharePrice(fairPrice)}/share (+${formatMoney(fairCashK)} equity capital).`,
      'success'
    );
  };

  const handleAggressiveIpo = () => {
    if (!canFloatIpo || isPitching) return;
    setIsPitching(true);
    setFlashText(PITCH_PHRASES[0]);

    // Flashing interval every 80ms
    intervalRef.current = window.setInterval(() => {
      const randomIndex = Math.floor(Math.random() * PITCH_PHRASES.length);
      setFlashText(PITCH_PHRASES[randomIndex]);
    }, 80);

    // After 2500ms, lock in gamble outcome
    timeoutRef.current = window.setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPitching(false);

      const roll = Math.random();
      if (roll > 0.65) {
        // Roll > 0.65 (Unicorn Jackpot - 35% chance)
        onExecuteIpo(
          aggressivePrice,
          aggressiveCashK,
          aggressivePrice,
          5, // trust +5
          5, // rep += 5
          10, // morale += 10
          `Unicorn IPO Jackpot! Wall Street bought the aggressive hype at ${formatSharePrice(aggressivePrice)}/share (+${formatMoney(aggressiveCashK)}, +5 Rep, +10 Morale)!`,
          'success'
        );
      } else {
        // Roll <= 0.65 (Botched IPO - Disaster - 65% chance)
        const botchedPrice = Number((basePrice * 0.5).toFixed(2));
        const botchedCashK = Math.round((floatShares * botchedPrice) / 1000);
        onExecuteIpo(
          botchedPrice,
          botchedCashK,
          botchedPrice,
          -20, // trust -= 20
          -10, // rep -= 10
          -10, // morale -= 10
          `Botched IPO Disaster! Underwriters forced a humiliating 50% firesale at ${formatSharePrice(botchedPrice)}/share (-20 Board Trust, -10 Rep). Slashed IPO price creates severe future dividend traps!`,
          'error'
        );
      }
    }, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={() => {
        if (!isPitching) onClose();
      }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-2xl cursor-pointer overflow-y-auto overscroll-contain"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#12141c]/90 backdrop-blur-3xl rounded-[28px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto overflow-hidden cursor-default shrink-0 text-left text-white"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-base shadow-inner shrink-0">
              <i className="fa-solid fa-landmark"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 mb-0.5 flex items-center gap-1.5">
                <span>Stock Exchange Syndicate</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">{bankName}</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                  {state.isPublic ? 'Public Shareholder Equity' : 'Initial Public Offering (IPO) Roadshow'}
                </h2>
                {state.isPublic && (
                  <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-wider shadow-sm">
                    {ticker}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPitching}
            className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {!state.isPublic ? (
            /* PRE-IPO STATE: INVESTOR ROADSHOW */
            <div className="space-y-4">
              {/* Requirements Banner */}
              {!canFloatIpo ? (
                <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 text-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                    <i className="fa-solid fa-lock text-sm"></i>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-rose-300 text-sm">
                      Requires Tier 1 & 1M Fans
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Institutional underwriters require top-flight status and an established global audience of at least 1,000,000 supporters to float equity on the stock market.
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px]">
                      <span className={isTier1 ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                        <i className={`fa-solid ${isTier1 ? 'fa-check' : 'fa-xmark'} mr-1`}></i>
                        Tier 1 Division ({state.club.tier})
                      </span>
                      <span className={hasFanbaseReq ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                        <i className={`fa-solid ${hasFanbaseReq ? 'fa-check' : 'fa-xmark'} mr-1`}></i>
                        {currentFanbase.toLocaleString()} / 1,000,000 Fans
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 sm:p-4 text-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <i className="fa-solid fa-certificate text-sm"></i>
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                      <span>Investor Roadshow Approved</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                        25% Equity Float
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed mt-0.5">
                      {bankName} has completed due diligence. Select your pricing strategy below to syndicate 2,500,000 shares across institutional and retail markets.
                    </p>
                  </div>
                </div>
              )}

              {/* Valuation & Offering Overview Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    Base Fair Price
                  </span>
                  <div className="text-base sm:text-lg font-bold tabular-nums text-white mt-0.5">
                    {formatSharePrice(basePrice)}
                    <span className="text-[11px] text-zinc-400 font-normal"> / share</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    Pre-Money Valuation
                  </span>
                  <div className="text-base sm:text-lg font-bold tabular-nums text-amber-300 mt-0.5">
                    {formatMoney(Math.round((totalShares * basePrice) / 1000))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    Float Offering
                  </span>
                  <div className="text-base sm:text-lg font-bold tabular-nums text-sky-400 mt-0.5">
                    25% <span className="text-[11px] text-zinc-400 font-normal">(2.5M Shares)</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    Club Reputation
                  </span>
                  <div className="text-base sm:text-lg font-bold tabular-nums text-emerald-400 mt-0.5">
                    {state.reputation || 50} <span className="text-[11px] text-zinc-400 font-normal">/ 100 Rep</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Pre-IPO 3-Column Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
                {/* 1. Conservative Card: Institutional Discount */}
                <div className="bg-white/[0.03] hover:bg-white/[0.04] border border-white/[0.06] hover:border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between transition group relative">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        Safe · Discount
                      </span>
                      <span className="text-[10px] text-zinc-400 font-semibold tabular-nums">
                        -20% Par
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-0.5">
                      Institutional Discount
                    </h3>
                    <p className="text-[11px] text-zinc-400 mb-3 leading-snug">
                      Priced conservatively to guarantee complete institutional absorption.
                    </p>

                    <div className="p-3 bg-black/30 rounded-xl border border-white/[0.04] mb-3 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-zinc-400">Issue Price</span>
                        <span className="text-sm font-bold tabular-nums text-white">
                          {formatSharePrice(conservativePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-zinc-400">Immediate Cash</span>
                        <span className="text-sm font-bold tabular-nums text-emerald-400">
                          +{formatMoney(conservativeCashK)}
                        </span>
                      </div>
                    </div>

                    {/* Fixed-Height Div for Perks Preview (Zero UI Jitter) */}
                    <div className="h-16 w-full rounded-xl bg-white/[0.02] border border-white/[0.04] mb-3 p-2.5 flex flex-col justify-center text-[10px] text-zinc-300 space-y-1 leading-tight">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                        <i className="fa-solid fa-shield-halved text-[10px]"></i>
                        <span>Guaranteed 100% Placement</span>
                      </div>
                      <div className="text-zinc-400">
                        <strong className="text-white">Day 1 Pop:</strong> Stock pops +20% instantly ({formatSharePrice(conservativePopPrice)}), granting <span className="text-emerald-300 font-bold">+10 Board Trust</span>.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConservativeIpo}
                    disabled={!canFloatIpo || isPitching}
                    className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 active:bg-cyan-500/30 border border-cyan-500/30 disabled:opacity-40 text-cyan-300 font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <i className="fa-solid fa-arrow-trend-up text-cyan-400 text-xs"></i>
                    <span>Issue at {formatSharePrice(conservativePrice)}</span>
                  </button>
                </div>

                {/* 2. Fair Market Value Card */}
                <div className="bg-white/[0.03] hover:bg-white/[0.04] border border-white/[0.06] hover:border-sky-500/30 rounded-2xl p-4 flex flex-col justify-between transition group relative">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-200 border border-white/[0.12]">
                        Par · Balanced
                      </span>
                      <span className="text-[10px] text-zinc-400 font-semibold tabular-nums">
                        100% Value
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-0.5">
                      Fair Market Value
                    </h3>
                    <p className="text-[11px] text-zinc-400 mb-3 leading-snug">
                      Standard syndicate bookbuilding at current assessed valuation.
                    </p>

                    <div className="p-3 bg-black/30 rounded-xl border border-white/[0.04] mb-3 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-zinc-400">Issue Price</span>
                        <span className="text-sm font-bold tabular-nums text-white">
                          {formatSharePrice(fairPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-zinc-400">Immediate Cash</span>
                        <span className="text-sm font-bold tabular-nums text-emerald-400">
                          +{formatMoney(fairCashK)}
                        </span>
                      </div>
                    </div>

                    {/* Fixed-Height Div for Perks Preview (Zero UI Jitter) */}
                    <div className="h-16 w-full rounded-xl bg-white/[0.02] border border-white/[0.04] mb-3 p-2.5 flex flex-col justify-center text-[10px] text-zinc-300 space-y-1 leading-tight">
                      <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                        <i className="fa-solid fa-scale-balanced text-[10px] text-sky-400"></i>
                        <span>Balanced Execution</span>
                      </div>
                      <div className="text-zinc-400">
                        No immediate pricing bonuses or penalties. Standard 1.0x dividend ratio baseline for future seasons.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleFairMarketIpo}
                    disabled={!canFloatIpo || isPitching}
                    className="w-full bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18] border border-white/[0.12] disabled:opacity-40 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <i className="fa-solid fa-landmark text-sky-400 text-xs"></i>
                    <span>Issue at {formatSharePrice(fairPrice)}</span>
                  </button>
                </div>

                {/* 3. Aggressive Card: "Greed is Good" */}
                <div className="bg-white/[0.03] hover:bg-white/[0.04] border border-amber-500/25 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between transition group relative">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        High Risk · Gamble
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold tabular-nums">
                        +60% Target
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-0.5">
                      "Greed is Good"
                    </h3>
                    <p className="text-[11px] text-zinc-400 mb-3 leading-snug">
                      Aggressive roadshow targeting a massive 1.6x premium valuation.
                    </p>

                    <div className="p-3 bg-black/30 rounded-xl border border-white/[0.04] mb-3 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-zinc-400">Target Price</span>
                        <span className="text-sm font-bold tabular-nums text-amber-300">
                          {formatSharePrice(aggressivePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-zinc-400">Target Cash</span>
                        <span className="text-sm font-bold tabular-nums text-emerald-400">
                          +{formatMoney(aggressiveCashK)}
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Fixed-Height Div for Flash Text or Risk Warning (Zero UI Jitter) */}
                    <div className="h-16 w-full rounded-xl bg-white/[0.02] border border-white/[0.04] mb-3 p-2.5 flex flex-col justify-center overflow-hidden relative">
                      {isPitching ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="text-[9px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5 animate-pulse mb-0.5">
                            <i className="fa-solid fa-arrows-spin fa-spin text-[10px]"></i>
                            <span>Roadshow Pitching...</span>
                          </div>
                          <div className="text-xs font-bold tabular-nums text-amber-300 tracking-tight truncate w-full text-center animate-pulse">
                            {flashText}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-pulse" />
                        </div>
                      ) : (
                        <div className="text-[10px] space-y-1 leading-tight">
                          <div className="text-emerald-400 font-medium flex items-center gap-1">
                            <i className="fa-solid fa-circle-check text-[9px]"></i>
                            <span>35% Unicorn: 1.6x cash, +5 Rep, +10 Morale</span>
                          </div>
                          <div className="text-rose-400 font-medium flex items-center gap-1">
                            <i className="fa-solid fa-triangle-exclamation text-[9px]"></i>
                            <span>65% Disaster: 50% firesale, -20 Trust, -10 Rep</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleAggressiveIpo}
                    disabled={!canFloatIpo || isPitching}
                    className="w-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 active:from-amber-500/35 active:to-rose-500/35 border border-amber-500/35 disabled:opacity-40 text-amber-200 font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isPitching ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin text-amber-400"></i>
                        <span>Pitching Syndicate...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-dice text-amber-400 text-xs"></i>
                        <span>Pitch at {formatSharePrice(aggressivePrice)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Terms & Dividend Warning */}
              <div className="bg-black/30 rounded-xl p-3.5 border border-white/[0.04] text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
                <div className="font-bold text-zinc-300 flex items-center gap-1.5 text-xs">
                  <i className="fa-solid fa-scale-balanced text-amber-400"></i>
                  <span>Shareholder Covenant & Seasonal Dividend Rule</span>
                </div>
                <p>
                  Floating 25% of the club injects immediate equity capital, but mandates an ongoing <span className="text-white font-semibold">15% Shareholder Dividend target</span> on operating profits.
                </p>
                <p className="text-[10px] text-zinc-500">
                  <strong className="text-zinc-400">The Catch:</strong> The cash deduction scales dynamically with stock performance: <code className="text-zinc-300 bg-white/[0.05] px-1 py-0.5 rounded">baseDividend × (stockPrice / ipoPrice)</code>. A botched IPO fixes an artificially low baseline, causing severe future dividend spikes if the stock recovers!
                </p>
              </div>
            </div>
          ) : (
            /* POST-IPO STATE */
            <div className="space-y-4">
              {/* Ticker HUD */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                  <div className="border-b sm:border-b-0 sm:border-r border-white/[0.06] pb-3 sm:pb-0 sm:pr-4">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                      Current Share Price
                    </span>
                    <div className="text-2xl font-bold tabular-nums text-white flex items-baseline justify-center sm:justify-start gap-1.5">
                      <span>{formatSharePrice(currentPrice)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold tabular-nums">
                      <span
                        className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          allTimeDeltaPct >= 0
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            allTimeDeltaPct >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'
                          } text-[10px]`}
                        ></i>
                        <span>{allTimeDeltaPct >= 0 ? `+${allTimeDeltaPct}%` : `${allTimeDeltaPct}%`}</span>
                      </span>
                      <span className="text-zinc-500 text-[10px] font-normal">All-Time</span>
                    </div>
                  </div>

                  <div className="border-b sm:border-b-0 sm:border-r border-white/[0.06] pb-3 sm:pb-0 sm:px-4">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                      Public Market Cap
                    </span>
                    <div className="text-2xl font-bold tabular-nums text-sky-400">
                      {formatMoney(marketCapK)}
                    </div>
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      10M Shares Outstanding
                    </span>
                  </div>

                  <div className="sm:pl-4">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                      IPO Issue Price
                    </span>
                    <div className="text-2xl font-bold tabular-nums text-zinc-300">
                      {formatSharePrice(ipoReferencePrice)}
                    </div>
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      Float: 25% ({formatMoney(publicFloatValueK)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Historical Stock Price Line Chart */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-chart-line"></i>
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide">
                      Historical Share Price Trajectory
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {state.stockHistory && state.stockHistory.length > 0
                      ? `${state.stockHistory.length} Recorded ${state.stockHistory.length === 1 ? 'Season' : 'Seasons'}`
                      : 'Season Debut'}
                  </span>
                </div>

                {(() => {
                  const rawHistory = state.stockHistory || [];

                  // 1. Always anchor the chart at the IPO Issue Price
                  let chartData: { year: string | number; price: number }[] = [
                    { year: 'IPO', price: state.ipoPrice || 10.00 },
                  ];

                  // 2. Append all simulated seasons (filtering out duplicate origins if they exist)
                  rawHistory.forEach((entry) => {
                    if (entry.price !== state.ipoPrice || chartData.length > 1) {
                      chartData.push({ year: entry.year, price: entry.price });
                    }
                  });

                  // Guarantee at least 2 points (origin and current point) so the line always renders
                  if (chartData.length < 2) {
                    chartData.push({ year: state.year || 'Current', price: currentPrice });
                  }

                  const prices = chartData.map((h) => h.price);
                  const rawMin = Math.min(...prices);
                  const rawMax = Math.max(...prices);
                  // Provide padding around min and max
                  const minPrice = Math.max(0, rawMin === rawMax ? rawMin * 0.8 : rawMin - (rawMax - rawMin) * 0.15);
                  const maxPrice = rawMin === rawMax ? rawMax * 1.2 : rawMax + (rawMax - rawMin) * 0.15;
                  const priceRange = maxPrice - minPrice || 1;

                  const len = chartData.length;
                  const points = chartData.map((item, idx) => {
                    const x = len === 1 ? 50 : (idx / (len - 1)) * 100;
                    const y = 100 - ((item.price - minPrice) / priceRange) * 100;
                    return { x, y, price: item.price, year: item.year };
                  });

                  // Highest and lowest points
                  let highestPt = points[0];
                  let lowestPt = points[0];
                  points.forEach((pt) => {
                    if (pt.price > highestPt.price) highestPt = pt;
                    if (pt.price < lowestPt.price) lowestPt = pt;
                  });

                  const linePath = len === 1
                    ? `M 0 ${points[0].y} L 100 ${points[0].y}`
                    : `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
                  const areaPath = len === 1
                    ? `M 0 ${points[0].y} L 100 ${points[0].y} L 100 100 L 0 100 Z`
                    : `M 0 100 L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L 100 100 Z`;

                  return (
                    <div className="space-y-2">
                      <div className="h-32 sm:h-40 w-full relative rounded-xl bg-black/25 border border-white/[0.04] p-3 overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full overflow-visible z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="stockChartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
                              <stop offset="60%" stopColor="#0ea5e9" stopOpacity="0.08" />
                              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Reference horizontal dashed line for baseline IPO Price */}
                          {ipoReferencePrice >= minPrice && ipoReferencePrice <= maxPrice && (
                            <line
                              x1="0"
                              y1={100 - ((ipoReferencePrice - minPrice) / priceRange) * 100}
                              x2="100"
                              y2={100 - ((ipoReferencePrice - minPrice) / priceRange) * 100}
                              stroke="rgba(245, 158, 11, 0.35)"
                              strokeDasharray="2 3"
                              vectorEffect="non-scaling-stroke"
                            />
                          )}

                          <path d={areaPath} fill="url(#stockChartGrad)" />
                          <path
                            d={linePath}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>

                        {/* Interactive or Data Labels Overlay */}
                        <div className="absolute inset-0 z-20 w-full h-full pointer-events-none p-3">
                          {points.map((pt, i) => {
                            const isHighest = pt === highestPt && points.length > 1;
                            const isLowest = pt === lowestPt && points.length > 1 && lowestPt !== highestPt;
                            const isLatest = i === points.length - 1;

                            return (
                              <div
                                key={`stock-pt-${i}-${pt.year}`}
                                className="absolute flex flex-col items-center justify-center"
                                style={{
                                  left: `${pt.x}%`,
                                  top: `${Math.max(12, Math.min(88, pt.y))}%`,
                                  transform: 'translate(-50%, -50%)',
                                }}
                              >
                                <div
                                  className={`rounded-full bg-sky-400 border-2 border-[#12141c] ${
                                    isLatest
                                      ? 'w-3 h-3 ring-4 ring-sky-400/30 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                                      : 'w-2 h-2 opacity-80'
                                  }`}
                                />
                                {(isHighest || isLowest || isLatest) && (
                                  <div
                                    className={`absolute ${
                                      pt.y < 30 ? 'top-3.5' : '-top-5'
                                    } text-[9px] font-bold font-mono px-1.5 py-0.5 whitespace-nowrap rounded border tabular-nums shadow-sm ${
                                      isHighest
                                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                                        : isLowest
                                        ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                                        : 'bg-[#12141c]/95 text-sky-300 border-sky-500/40'
                                    }`}
                                  >
                                    {formatSharePrice(pt.price)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Timeline Year Markers & Range Legend */}
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono px-1">
                        <div className="flex items-center gap-2">
                          <span>Low: <strong className="text-rose-400">{formatSharePrice(rawMin)}</strong></span>
                          <span className="text-zinc-600">·</span>
                          <span>High: <strong className="text-emerald-400">{formatSharePrice(rawMax)}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">IPO Base: {formatSharePrice(ipoReferencePrice)}</span>
                          <span className="text-zinc-600">·</span>
                          <span>Latest ({chartData[chartData.length - 1].year}): <strong className="text-white">{formatSharePrice(chartData[chartData.length - 1].price)}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Shareholder Dividend Rule Explanation */}
              <div className="bg-black/30 rounded-2xl p-4 border border-white/[0.06] space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <i className="fa-solid fa-chart-line"></i>
                  <span>Dividend Covenant & Seasonal Math</span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  <strong className="text-white">15% Shareholder Dividend target:</strong> As your stock price rises, the cash payout owed to public shareholders increases proportionately:
                </p>
                <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl font-mono text-[11px] text-zinc-300 space-y-1">
                  <div className="text-zinc-400">baseDividend = operatingProfit × 15%</div>
                  <div className="text-emerald-300 font-bold">
                    actualPayout = baseDividend × (stockPrice / ipoPrice)
                  </div>
                  <div className="text-zinc-500 text-[10px] pt-1 flex items-center justify-between flex-wrap gap-2">
                    <span>
                      Current multiplier:{' '}
                      <span className="text-amber-400 font-bold tabular-nums">
                        {(currentPrice / ipoReferencePrice).toFixed(2)}x
                      </span>{' '}
                      relative to IPO launch.
                    </span>
                    <span className="text-zinc-300">
                      Est. Season Payout:{' '}
                      <span className="text-rose-400 font-bold tabular-nums">
                        -{formatMoney(liveFinancials.shareholderDividend || 0)}
                      </span>
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Dividends are deducted automatically from your projected operating ledger at season conclusion.
                </p>
              </div>

              {/* Performance Factors */}
              <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04] space-y-2 text-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                  Stock Price Market Catalysts (End of Season)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-black/20 border border-white/[0.03]">
                    <span className="text-zinc-400">League Title:</span>
                    <span className="font-bold text-emerald-400 tabular-nums">+15%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-black/20 border border-white/[0.03]">
                    <span className="text-zinc-400">Continental Qual:</span>
                    <span className="font-bold text-emerald-400 tabular-nums">+8%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-black/20 border border-white/[0.03]">
                    <span className="text-zinc-400">Cup / Trophy:</span>
                    <span className="font-bold text-emerald-400 tabular-nums">+10%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-black/20 border border-white/[0.03]">
                    <span className="text-zinc-400">Relegation:</span>
                    <span className="font-bold text-rose-400 tabular-nums">-35%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-black/20 border border-white/[0.03]">
                    <span className="text-zinc-400">In Debt:</span>
                    <span className="font-bold text-rose-400 tabular-nums">-25%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-black/20 border border-white/[0.03]">
                    <span className="text-zinc-400">Market Volatility:</span>
                    <span className="font-bold text-zinc-300 tabular-nums">±5%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-3 text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <i className="fa-solid fa-building-columns text-amber-400"></i>
            <span>Regulated by {regulatorName}.</span>
          </div>
          <button
            onClick={onClose}
            disabled={isPitching}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 hover:text-white transition cursor-pointer text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
