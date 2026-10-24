import { ClubLoan } from '../types';
import { getLeagueScaledVal } from '../data/gameConstants';

export interface LoanTermOption {
  termYears: 10 | 15 | 25;
  interestRate: number; // e.g. 0.035 for 3.5%
  annualPayment: number;
  totalRepayment: number;
  totalInterest: number;
}

export const getBaseLoanPrincipal = (tier: number = 1, country: string = 'GER'): number => {
  const baseMap: Record<number, number> = {
    1: 5000000,
    2: 2500000,
    3: 1200000,
    4: 600000,
    5: 350000,
    6: 250000,
  };
  const base = baseMap[tier] || 500000;
  return getLeagueScaledVal(tier, base, country);
};

export const calculateLoanTerms = (principal: number): Record<10 | 15 | 25, LoanTermOption> => {
  const terms: Array<{ termYears: 10 | 15 | 25; interestRate: number }> = [
    { termYears: 10, interestRate: 0.035 },
    { termYears: 15, interestRate: 0.045 },
    { termYears: 25, interestRate: 0.055 },
  ];

  const result = {} as Record<10 | 15 | 25, LoanTermOption>;

  terms.forEach(({ termYears, interestRate }) => {
    // Standard commercial amortization (simplified linear APR formulation for sports management sim)
    const totalInterest = Math.round(principal * interestRate * termYears);
    const totalRepayment = principal + totalInterest;
    const annualPayment = Math.round(totalRepayment / termYears);

    result[termYears] = {
      termYears,
      interestRate,
      annualPayment,
      totalRepayment,
      totalInterest,
    };
  });

  return result;
};

export const createClubLoan = (
  principal: number,
  termYears: 10 | 15 | 25,
  currentYear: number
): ClubLoan => {
  const terms = calculateLoanTerms(principal)[termYears];
  return {
    id: `loan_${Date.now()}_${termYears}y`,
    principal,
    remainingBalance: terms.totalRepayment,
    termYears,
    yearsRemaining: termYears,
    interestRate: terms.interestRate,
    annualPayment: terms.annualPayment,
    totalRepayment: terms.totalRepayment,
    takenInYear: currentYear,
  };
};
