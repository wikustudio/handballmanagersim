import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useGameStore } from '../store/useGameStore';
import {
  getDynamicSponsorPitchTerms,
  formatMoney,
  SponsorBrand,
} from '../data/gameConstants';
import { isAnyModActive } from '../utils/modManager';
import { useModalDismiss } from '../utils/modalUtils';

export interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDealIndex?: 0 | 1 | 2;
  lang?: 'en' | 'de' | 'es';
}

interface BrandPalette {
  bg: string;
  accent: string;
  text: string;
  border: string;
  shape: 'shield' | 'chevrons' | 'hexagon' | 'circle' | 'diamond' | 'bars' | 'crown' | 'bolt' | 'leaf' | 'globe';
}

const resolveBrandVisuals = (brand: SponsorBrand, isMod: boolean): BrandPalette => {
  const n = (brand.name || '').toUpperCase();
  const tag = (brand.tag || '').toUpperCase();

  if (n.includes('HUMMEL') || n.includes('HAMMEL')) {
    return {
      bg: isMod ? '#18181b' : '#1e1b4b',
      accent: '#facc15',
      text: '#ffffff',
      border: 'rgba(250, 204, 21, 0.35)',
      shape: 'chevrons',
    };
  }
  if (
    n.includes('FLENSBURG') ||
    n.includes('KROMBACH') ||
    n.includes('CARLSBERG') ||
    n.includes('KARLSBERG') ||
    n.includes('BITBURG') ||
    n.includes('STIEGL') ||
    n.includes('ESTRELLA') ||
    tag.includes('BREW') ||
    tag.includes('BEVERAGE')
  ) {
    return {
      bg: isMod ? '#14261c' : '#1f2416',
      accent: '#fbbf24',
      text: '#fef3c7',
      border: 'rgba(251, 191, 36, 0.35)',
      shape: 'crown',
    };
  }
  if (
    n.includes('CRAFT') ||
    n.includes('KRAFT') ||
    n.includes('SELECT') ||
    n.includes('SELEKT') ||
    n.includes('KEMPA') ||
    n.includes('KEMPO') ||
    n.includes('PUMA') ||
    n.includes('PUMO') ||
    n.includes('ADIDAS') ||
    n.includes('ADIDOS') ||
    n.includes('ERIMA') ||
    n.includes('SALMING') ||
    n.includes('JOMA') ||
    n.includes('4F') ||
    tag.includes('KIT') ||
    tag.includes('APPAREL') ||
    tag.includes('SPORT') ||
    tag.includes('GEAR') ||
    tag.includes('FOOTWEAR')
  ) {
    return {
      bg: isMod ? '#0f172a' : '#172554',
      accent: '#38bdf8',
      text: '#f0f9ff',
      border: 'rgba(56, 189, 248, 0.35)',
      shape: 'bars',
    };
  }
  if (
    n.includes('SPARKASSE') ||
    n.includes('SPARBANK') ||
    n.includes('REWE') ||
    n.includes('REWA') ||
    n.includes('ORLEN') ||
    n.includes('MOBILIAR') ||
    n.includes('VELUX')
  ) {
    return {
      bg: isMod ? '#2a0f18' : '#2e1020',
      accent: '#f43f5e',
      text: '#ffe4e6',
      border: 'rgba(244, 63, 94, 0.35)',
      shape: 'diamond',
    };
  }
  if (
    n.includes('LIDL') ||
    n.includes('LIDEL') ||
    n.includes('SAP') ||
    n.includes('SYP') ||
    n.includes('PROVINZIAL') ||
    n.includes('ALLIANZ') ||
    n.includes('JYSK') ||
    n.includes('VOLKSBANK') ||
    tag.includes('BANK') ||
    tag.includes('FINANC') ||
    tag.includes('INSUR')
  ) {
    return {
      bg: isMod ? '#0c192e' : '#111c2d',
      accent: '#60a5fa',
      text: '#eff6ff',
      border: 'rgba(96, 165, 250, 0.35)',
      shape: 'shield',
    };
  }
  if (
    n.includes('GETEC') ||
    n.includes('GP JOULE') ||
    n.includes('IBERDROLA') ||
    n.includes('EDF') ||
    n.includes('TOTAL') ||
    n.includes('EWE') ||
    n.includes('ENVIAM') ||
    n.includes('MVM') ||
    n.includes('PGE') ||
    n.includes('TAURON') ||
    tag.includes('ENERGY') ||
    tag.includes('POWER') ||
    tag.includes('UTILITY')
  ) {
    return {
      bg: isMod ? '#0c241e' : '#0f2922',
      accent: '#34d399',
      text: '#ecfdf5',
      border: 'rgba(52, 211, 153, 0.35)',
      shape: 'bolt',
    };
  }
  if (
    tag.includes('HEALTH') ||
    tag.includes('MEDICAL') ||
    tag.includes('PHYSIO') ||
    tag.includes('PHARMA') ||
    tag.includes('CLINIC')
  ) {
    return {
      bg: '#0d2628',
      accent: '#2dd4bf',
      text: '#f0fdfa',
      border: 'rgba(45, 212, 191, 0.35)',
      shape: 'leaf',
    };
  }
  return {
    bg: isMod ? '#181826' : '#1c192b',
    accent: '#a78bfa',
    text: '#f5f3ff',
    border: 'rgba(167, 139, 250, 0.35)',
    shape: 'hexagon',
  };
};

const getBrandMonogram = (name: string): string => {
  const clean = (name || 'SP')
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, ' ')
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 3).toUpperCase();
};

export const SponsorBrandLogo: React.FC<{
  brand: SponsorBrand;
  isModActive: boolean;
  size?: 'sm' | 'lg';
}> = ({ brand, isModActive, size = 'lg' }) => {
  const palette = resolveBrandVisuals(brand, isModActive);
  const monogram = getBrandMonogram(brand.name);
  const isLg = size === 'lg';

  const renderVectorGlyph = () => {
    switch (palette.shape) {
      case 'chevrons':
        return (
          <svg viewBox="0 0 36 36" className={isLg ? 'w-8 h-8' : 'w-4 h-4'} fill="none">
            <path d="M9 14L18 7L27 14" stroke={palette.accent} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 22L18 15L27 22" stroke={palette.accent} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 29L18 24L24 29" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          </svg>
        );
      case 'bars':
        return (
          <svg viewBox="0 0 36 36" className={isLg ? 'w-8 h-8' : 'w-4 h-4'} fill="none">
            <rect x="8" y="20" width="4.5" height="9" rx="1.5" fill={palette.accent} opacity="0.65" />
            <rect x="15.5" y="14" width="4.5" height="15" rx="1.5" fill={palette.accent} opacity="0.85" />
            <rect x="23" y="8" width="4.5" height="21" rx="1.5" fill="#ffffff" />
            <circle cx="11" cy="11" r="2.5" fill={palette.accent} />
          </svg>
        );
      case 'crown':
        return (
          <svg viewBox="0 0 36 36" className={isLg ? 'w-8 h-8' : 'w-4 h-4'} fill="none">
            <path d="M7 25L9.5 13L15 18.5L18 10L21 18.5L26.5 13L29 25H7Z" fill={palette.accent} fillOpacity="0.25" stroke={palette.accent} strokeWidth="2.2" strokeLinejoin="round" />
            <rect x="8" y="27" width="20" height="2.5" rx="1.2" fill="#ffffff" opacity="0.9" />
          </svg>
        );
      case 'diamond':
        return (
          <svg viewBox="0 0 36 36" className={isLg ? 'w-8 h-8' : 'w-4 h-4'} fill="none">
            <rect x="18" y="5" width="18" height="18" rx="3" transform="rotate(45 18 5)" fill={palette.accent} fillOpacity="0.22" stroke={palette.accent} strokeWidth="2.4" />
            <circle cx="18" cy="18" r="4" fill="#ffffff" />
          </svg>
        );
      case 'shield':
        return (
          <svg viewBox="0 0 36 36" className={isLg ? 'w-8 h-8' : 'w-4 h-4'} fill="none">
            <path d="M18 6L28 10V18.5C28 24.5 23.6 28.8 18 30.5C12.4 28.8 8 24.5 8 18.5V10L18 6Z" fill={palette.accent} fillOpacity="0.2" stroke={palette.accent} strokeWidth="2.3" />
            <text x="18" y="21.5" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="800" fontFamily="sans-serif">
              {monogram.slice(0, 2)}
            </text>
          </svg>
        );
      case 'bolt':
        return (
          <svg viewBox="0 0 36 36" className={isLg ? 'w-8 h-8' : 'w-4 h-4'} fill="none">
            <circle cx="18" cy="18" r="11.5" stroke={palette.accent} strokeWidth="2" strokeOpacity="0.5" />
            <path d="M19.5 8L11.5 19.5H17.5L16.5 28L24.5 16.5H18.5L19.5 8Z" fill={palette.accent} />
          </svg>
        );
      case 'leaf':
        return (
          <svg viewBox="0 0 36 36" className={isLg ? 'w-8 h-8' : 'w-4 h-4'} fill="none">
            <path d="M18 8V28M8 18H28" stroke={palette.accent} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="18" cy="18" r="11" stroke="#ffffff" strokeWidth="1.8" opacity="0.4" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 36 36" className={isLg ? 'w-8 h-8' : 'w-4 h-4'} fill="none">
            <polygon points="18,6 28,12 28,24 18,30 8,24 8,12" fill={palette.accent} fillOpacity="0.2" stroke={palette.accent} strokeWidth="2.2" />
            <text x="18" y="21.5" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="800" fontFamily="sans-serif">
              {monogram.slice(0, 2)}
            </text>
          </svg>
        );
    }
  };

  if (!isLg) {
    return (
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 relative overflow-hidden"
        style={{
          backgroundColor: palette.bg,
          border: `1px solid ${palette.border}`,
        }}
      >
        {renderVectorGlyph()}
      </div>
    );
  }

  return (
    <div
      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 relative overflow-hidden select-none"
      style={{
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
      }}
    >
      {renderVectorGlyph()}
      <span
        className="text-[8px] font-bold uppercase tracking-[0.14em] leading-none mt-1 truncate max-w-[54px]"
        style={{ color: palette.accent }}
      >
        {monogram}
      </span>
    </div>
  );
};

export const SponsorModal: React.FC<SponsorModalProps> = ({
  isOpen,
  onClose,
  initialDealIndex = 0,
  lang = 'en',
}) => {
  useModalDismiss(onClose, isOpen);
  const stateStore = useGameStore();
  const [selectedDeal, setSelectedDeal] = useState<0 | 1 | 2>(initialDealIndex);
  const [dealLengths, setDealLengths] = useState<Record<0 | 1 | 2, 1 | 2 | 3>>({
    0: 1,
    1: 1,
    2: 1,
  });
  const [, setModTick] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedDeal(initialDealIndex);
    }
  }, [isOpen, initialDealIndex]);

  useEffect(() => {
    const onModChange = () => setModTick((t) => t + 1);
    window.addEventListener('mod-state-change', onModChange);
    return () => window.removeEventListener('mod-state-change', onModChange);
  }, []);

  if (!isOpen) return null;

  const isMod = isAnyModActive();
  const tr = (en: string, de: string) => (lang === 'de' ? de : en);

  const sponsorTerms = getDynamicSponsorPitchTerms(stateStore);
  const currentCommercial = stateStore.sponsorsPitchedThisSeason || 0;
  const limitCommercial = 3;
  const hasSalesmaster =
    (stateStore.managerSkills || []).includes('salesmaster') ||
    (stateStore.managerSkills || []).includes('sponsor_boost');

  const curSeasonDeals =
    stateStore.seasonSponsorDealsYear === stateStore.year
      ? stateStore.seasonSponsorDeals
      : undefined;

  const standardSlot = curSeasonDeals?.[0];
  const megaSlot = curSeasonDeals?.[1];
  const perfSlot = curSeasonDeals?.[2];

  const standardStatus = standardSlot?.status;
  const megaStatus = megaSlot?.status;
  const isPerfActive = Boolean(stateStore.activePerformanceDeal || perfSlot?.status === 'signed');

  const getDurationForDeal = (idx: 0 | 1 | 2): 1 | 2 | 3 => {
    const slot = curSeasonDeals?.[idx];
    if (slot?.status === 'signed' && slot.contractYears) {
      return slot.contractYears;
    }
    return dealLengths[idx] || 1;
  };

  const activeYears = getDurationForDeal(selectedDeal);
  const getDurationMult = (yrs: 1 | 2 | 3) => (yrs === 3 ? 1.1 : yrs === 2 ? 1.05 : 1.0);
  const getMegaOddsForYears = (yrs: 1 | 2 | 3) => {
    const penalty = yrs === 3 ? 10 : yrs === 2 ? 5 : 0;
    return Math.max(15, Math.min(95, sponsorTerms.megaSuccessPct - penalty));
  };

  const stdYears = getDurationForDeal(0);
  const megaYears = getDurationForDeal(1);
  const perfYears = getDurationForDeal(2);

  const stdAnnual =
    standardStatus === 'signed' && standardSlot?.payout
      ? standardSlot.payout
      : Math.round(sponsorTerms.standardPayout * getDurationMult(stdYears));

  const megaAnnual =
    megaStatus === 'signed' && megaSlot?.payout
      ? megaSlot.payout
      : Math.round(sponsorTerms.megaPayout * getDurationMult(megaYears));
  const megaOdds = getMegaOddsForYears(megaYears);

  const perfAnnualUpfront =
    isPerfActive && perfSlot?.payout
      ? perfSlot.payout
      : Math.round(sponsorTerms.performanceUpfront * getDurationMult(perfYears));
  const perfAnnualBonus =
    isPerfActive && perfSlot?.bonus
      ? perfSlot.bonus
      : Math.round(sponsorTerms.performanceBonus * getDurationMult(perfYears));

  const deals = [
    {
      index: 0 as const,
      tabLabel: tr('Standard', 'Standard'),
      title: tr('Standard Deal', 'Standard-Deal'),
      subtitle: tr('Regional & Kit Sponsorship', 'Regional- & Ausrüster-Vertrag'),
      brand: sponsorTerms.standardBrand,
      annualAmount: stdAnnual,
      totalAmount: stdAnnual * stdYears,
      years: stdYears,
      yearsRemaining: standardSlot?.yearsRemaining ?? stdYears,
      oddsText: tr('100% Guaranteed', '100% Garantiert'),
      isSigned: standardStatus === 'signed',
      isFailed: false,
      isEmpty: sponsorTerms.standardBrand.name === 'Empty',
      termsDescription: tr(
        `Guaranteed regional and kit partnership with ${sponsorTerms.standardBrand.name} (${sponsorTerms.standardBrand.fullName}). Pays +${formatMoney(stdAnnual)} per season over ${stdYears} ${stdYears === 1 ? 'year' : 'years'}.`,
        `Garantierte Regional- und Ausrüster-Partnerschaft mit ${sponsorTerms.standardBrand.name} (${sponsorTerms.standardBrand.fullName}). Zahlt +${formatMoney(stdAnnual)} pro Saison über ${stdYears} ${stdYears === 1 ? 'Jahr' : 'Jahre'}.`
      ),
      clauses: [
        {
          label: tr('ANNUAL PAYOUT', 'JÄHRLICHE PRÄMIE'),
          value: `+${formatMoney(stdAnnual)}/yr`,
          highlight: 'text-emerald-400',
        },
        {
          label: tr(`${stdYears}-YEAR TOTAL`, `GESAMTVOLUMEN (${stdYears} J.)`),
          value: `+${formatMoney(stdAnnual * stdYears)}`,
          highlight: 'text-white',
        },
        {
          label: tr('APPROVAL ODDS', 'ZUSAGEQUOTE'),
          value: tr('100% Guaranteed', '100% Sicher'),
          highlight: 'text-zinc-200',
        },
      ],
    },
    {
      index: 1 as const,
      tabLabel: tr('Megadeal', 'Megadeal'),
      title: tr('Megadeal Pitch', 'Megadeal-Pitch'),
      subtitle: tr('Anchor Corporate Partnership', 'Exklusiver Hauptsponsor-Pitch'),
      brand: sponsorTerms.megaBrand,
      annualAmount: megaAnnual,
      totalAmount: megaAnnual * megaYears,
      years: megaYears,
      yearsRemaining: megaSlot?.yearsRemaining ?? megaYears,
      oddsText: `${megaOdds}% ${tr('Success Odds', 'Erfolgschance')}`,
      isSigned: megaStatus === 'signed',
      isFailed: megaStatus === 'failed' || sponsorTerms.megaBrand.name === 'Empty',
      isEmpty: sponsorTerms.megaBrand.name === 'Empty',
      termsDescription: tr(
        `Anchor corporate pitch to ${sponsorTerms.megaBrand.name} (${sponsorTerms.megaBrand.fullName}). Longer terms increase annual payout (+5% to +10%/yr) but require stricter boardroom approval (${megaOdds}% odds).`,
        `Hauptsponsor-Pitch bei ${sponsorTerms.megaBrand.name} (${sponsorTerms.megaBrand.fullName}). Längere Laufzeiten erhöhen die Jahresprämie (+5% bis +10%/J.), erfordern aber strengere Vorstands-Zustimmung (${megaOdds}% Chance).`
      ),
      clauses: [
        {
          label: tr('ANNUAL PAYOUT', 'JÄHRLICHE PRÄMIE'),
          value: `+${formatMoney(megaAnnual)}/yr`,
          highlight: 'text-emerald-400',
        },
        {
          label: tr(`${megaYears}-YEAR TOTAL`, `GESAMTVOLUMEN (${megaYears} J.)`),
          value: `+${formatMoney(megaAnnual * megaYears)}`,
          highlight: 'text-white',
        },
        {
          label: tr('APPROVAL ODDS', 'ERFOLGSQUOTE'),
          value: `${megaOdds}%`,
          highlight: 'text-purple-400',
        },
      ],
    },
    {
      index: 2 as const,
      tabLabel: tr('Performance', 'Leistung'),
      title: tr('Performance Deal', 'Leistungsvertrag'),
      subtitle: tr('Upfront Fee + Placement Bonus', 'Handgeld + Platzierungsprämie'),
      brand: sponsorTerms.perfBrand,
      annualAmount: perfAnnualUpfront,
      totalAmount: (perfAnnualUpfront + perfAnnualBonus) * perfYears,
      years: perfYears,
      yearsRemaining: perfSlot?.yearsRemaining ?? perfYears,
      oddsText: tr(
        `Top ${sponsorTerms.performanceTargetPos} Bonus Clause`,
        `Top-${sponsorTerms.performanceTargetPos} Bonusklausel`
      ),
      isSigned: isPerfActive,
      isFailed: false,
      isEmpty: sponsorTerms.perfBrand.name === 'Empty',
      termsDescription: tr(
        `Performance contract with ${sponsorTerms.perfBrand.name} (${sponsorTerms.perfBrand.fullName}). Pays +${formatMoney(perfAnnualUpfront)}/yr upfront plus +${formatMoney(perfAnnualBonus)}/yr if finishing Top ${sponsorTerms.performanceTargetPos}.`,
        `Leistungsvertrag mit ${sponsorTerms.perfBrand.name} (${sponsorTerms.perfBrand.fullName}). Zahlt +${formatMoney(perfAnnualUpfront)}/J. sofort plus +${formatMoney(perfAnnualBonus)}/J. bei Platzierung in den Top ${sponsorTerms.performanceTargetPos}.`
      ),
      clauses: [
        {
          label: tr('UPFRONT FEE', 'HANDGELD / J.'),
          value: `+${formatMoney(perfAnnualUpfront)}/yr`,
          highlight: 'text-emerald-400',
        },
        {
          label: tr(`TOP ${sponsorTerms.performanceTargetPos} BONUS`, `TOP-${sponsorTerms.performanceTargetPos} BONUS`),
          value: `+${formatMoney(perfAnnualBonus)}/yr`,
          highlight: 'text-sky-400',
        },
        {
          label: tr(`MAX ${perfYears}-YR VALUE`, `MAX. VOLUMEN (${perfYears} J.)`),
          value: `+${formatMoney((perfAnnualUpfront + perfAnnualBonus) * perfYears)}`,
          highlight: 'text-white',
        },
      ],
    },
  ];

  const activeDeal = deals[selectedDeal] || deals[0];
  const isQuotaFull = currentCommercial >= limitCommercial;
  const canPitchActive =
    !isQuotaFull && !activeDeal.isSigned && !activeDeal.isFailed && !activeDeal.isEmpty;

  const durationOptions: {
    years: 1 | 2 | 3;
    label: string;
    bonusText: string;
    subText: string;
  }[] = [
    {
      years: 1,
      label: tr('1 Year', '1 Jahr'),
      bonusText: tr('Base', 'Basis'),
      subText:
        activeDeal.index === 1
          ? `${getMegaOddsForYears(1)}% ${tr('Odds', 'Chance')}`
          : tr('1-Season Term', '1 Saison'),
    },
    {
      years: 2,
      label: tr('2 Years', '2 Jahre'),
      bonusText: tr('+5%/yr', '+5%/J.'),
      subText:
        activeDeal.index === 1
          ? `${getMegaOddsForYears(2)}% ${tr('Odds', 'Chance')}`
          : tr('2-Season Term', '2 Saisons'),
    },
    {
      years: 3,
      label: tr('3 Years', '3 Jahre'),
      bonusText: tr('+10%/yr', '+10%/J.'),
      subText:
        activeDeal.index === 1
          ? `${getMegaOddsForYears(3)}% ${tr('Odds', 'Chance')}`
          : tr('3-Season Term', '3 Saisons'),
    },
  ];

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl cursor-pointer animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#14151e] border border-white/[0.04] rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] cursor-default relative text-white"
      >
        {/* Top Ambient Hairline */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/25 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 pb-3 border-b border-white/[0.04] flex items-center justify-between gap-3 shrink-0 bg-[#14151e]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-base shrink-0">
              <i className="fas fa-handshake" />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 leading-none">
                  {tr('COMMERCIAL & SPONSORSHIPS', 'KOMMERZ & SPONSORING')}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-zinc-400 tabular-nums leading-none">
                  {currentCommercial} / {limitCommercial}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-none truncate">
                {tr('Sponsorship Deals', 'Sponsorenverträge')}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer shrink-0 active:scale-95"
            aria-label={tr('Close', 'Schließen')}
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* 3-Deal Segmented Switcher */}
        <div className="px-5 pt-4 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#10121a] border border-white/[0.04]">
            {deals.map((d) => {
              const isSelected = d.index === selectedDeal;
              return (
                <button
                  key={d.index}
                  type="button"
                  onClick={() => setSelectedDeal(d.index)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer truncate ${
                    isSelected
                      ? 'bg-[#181924] text-white border border-white/[0.06] shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  <SponsorBrandLogo brand={d.brand} isModActive={isMod} size="sm" />
                  <span className="truncate">{d.tabLabel}</span>
                  {d.isSigned && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                  {d.isFailed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* Sponsor Identity Bento Card */}
          <div className="rounded-2xl bg-[#10121a] border border-white/[0.04] p-4 sm:p-5 flex flex-col gap-3.5">
            <div className="flex items-start sm:items-center gap-4">
              <SponsorBrandLogo brand={activeDeal.brand} isModActive={isMod} size="lg" />

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300">
                    {activeDeal.brand.tag || activeDeal.subtitle}
                  </span>
                  {activeDeal.isSigned ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-emerald-400 flex items-center gap-1.5 tabular-nums">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {tr(
                        `Active (${activeDeal.yearsRemaining} Yr${activeDeal.yearsRemaining === 1 ? '' : 's'} Left)`,
                        `Aktiv (${activeDeal.yearsRemaining} J. übrig)`
                      )}
                    </span>
                  ) : activeDeal.isFailed ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-rose-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {tr('Negotiations Ended', 'Gescheitert')}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300 tabular-nums">
                      {activeDeal.oddsText}
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight truncate">
                  {activeDeal.isEmpty
                    ? tr('Offer Unavailable This Season', 'Kein Angebot verfügbar')
                    : activeDeal.brand.name}
                </h3>

                {!activeDeal.isEmpty && (
                  <div className="text-xs text-zinc-500 truncate">
                    {activeDeal.brand.fullName}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed border-t border-white/[0.04] pt-3">
              {activeDeal.termsDescription}
            </p>
          </div>

          {/* Contract Length Negotiation Selector */}
          <div className="rounded-2xl bg-[#10121a] border border-white/[0.04] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {tr('CONTRACT LENGTH', 'VERTRAGSLAUFZEIT')}
              </span>
              <span className="text-[11px] text-zinc-500">
                {activeDeal.isSigned
                  ? tr(`Locked (${activeDeal.years} Yr)`, `Fixiert (${activeDeal.years} J.)`)
                  : tr('Longer term increases annual payout', 'Längere Laufzeit erhöht Jahresprämie')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {durationOptions.map((opt) => {
                const isSelected = activeYears === opt.years;
                const isDisabled = activeDeal.isSigned || activeDeal.isFailed || activeDeal.isEmpty;
                return (
                  <button
                    key={opt.years}
                    type="button"
                    disabled={isDisabled}
                    onClick={() =>
                      setDealLengths((prev) => ({
                        ...prev,
                        [selectedDeal]: opt.years,
                      }))
                    }
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-[#181924] border-purple-500/35 text-white'
                        : 'bg-[#14151e] border-white/[0.04] text-zinc-400 hover:border-white/[0.08] hover:text-zinc-200'
                    } ${isDisabled ? 'opacity-60 cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white tabular-nums">
                        {opt.label}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                          opt.years > 1
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06]'
                        }`}
                      >
                        {opt.bonusText}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 truncate tabular-nums">
                      {opt.subText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contract Financial Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {activeDeal.clauses.map((clause, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#10121a] border border-white/[0.04] p-3.5 flex flex-col justify-between gap-1.5"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {clause.label}
                </span>
                <span className={`text-base sm:text-lg font-semibold tracking-tight tabular-nums ${clause.highlight}`}>
                  {clause.value}
                </span>
              </div>
            ))}
          </div>

          {/* Valuation Modifiers (Market Appeal) */}
          {sponsorTerms.activeDrivers && sponsorTerms.activeDrivers.length > 0 && (
            <div className="rounded-2xl bg-[#10121a] border border-white/[0.04] p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {tr('VALUATION MODIFIERS', 'MARKTWERT-FAKTOREN')}
                </span>
                {hasSalesmaster && (
                  <span className="text-[10px] font-mono text-amber-400">
                    {tr('Negotiator +10%', 'Unterhändler +10%')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {sponsorTerms.activeDrivers.map((drv, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.03] border border-white/[0.06] text-zinc-300 flex items-center gap-1.5 tabular-nums"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        drv.positive ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    {lang === 'de' ? drv.labelDe : drv.labelEn} {drv.pct}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-white/[0.04] bg-[#10121a] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer"
          >
            {tr('Close', 'Schließen')}
          </button>

          <button
            type="button"
            disabled={!canPitchActive}
            onClick={() => {
              stateStore.pitchSponsor(activeDeal.index, activeYears);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 tabular-nums ${
              activeDeal.isSigned
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 cursor-default'
                : activeDeal.isFailed
                ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400 cursor-not-allowed'
                : !canPitchActive
                ? 'bg-white/[0.03] border border-white/[0.04] text-zinc-500 cursor-not-allowed'
                : 'bg-[#181924] hover:bg-white/[0.08] text-white border border-white/[0.1] cursor-pointer active:scale-[0.99]'
            }`}
          >
            {activeDeal.isSigned ? (
              <>
                <i className="fas fa-check text-xs text-emerald-400" />
                <span>
                  {tr(
                    `Signed (${activeDeal.years}-Year Deal Active)`,
                    `Unterschrieben (${activeDeal.years}-J.-Vertrag aktiv)`
                  )}
                </span>
              </>
            ) : activeDeal.isFailed ? (
              <>
                <i className="fas fa-xmark text-xs text-rose-400" />
                <span>{tr('Negotiations Collapsed', 'Verhandlung gescheitert')}</span>
              </>
            ) : isQuotaFull ? (
              <span>{tr('Commercial Limit Reached (3/3)', 'Sponsoren-Limit erreicht (3/3)')}</span>
            ) : activeDeal.index === 0 ? (
              <>
                <i className="fas fa-signature text-xs text-emerald-400" />
                <span>
                  {tr(
                    `Sign ${activeYears}-Yr Deal with ${activeDeal.brand.name}`,
                    `${activeYears}-J.-Vertrag mit ${activeDeal.brand.name}`
                  )}
                </span>
                <span className="font-mono text-emerald-400">+{formatMoney(stdAnnual)}/yr</span>
              </>
            ) : activeDeal.index === 1 ? (
              <>
                <i className="fas fa-dice text-xs text-purple-400" />
                <span>
                  {tr(
                    `Pitch ${activeYears}-Yr Deal to ${activeDeal.brand.name} (${megaOdds}%)`,
                    `${activeYears}-J.-Pitch bei ${activeDeal.brand.name} (${megaOdds}%)`
                  )}
                </span>
                <span className="font-mono text-emerald-400">+{formatMoney(megaAnnual)}/yr</span>
              </>
            ) : (
              <>
                <i className="fas fa-signature text-xs text-sky-400" />
                <span>
                  {tr(
                    `Sign ${activeYears}-Yr Deal with ${activeDeal.brand.name}`,
                    `${activeYears}-J.-Vertrag mit ${activeDeal.brand.name}`
                  )}
                </span>
                <span className="font-mono text-emerald-400">+{formatMoney(perfAnnualUpfront)}/yr</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
