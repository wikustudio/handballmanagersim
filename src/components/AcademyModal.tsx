import React from 'react';
import { GameState, Language } from '../types';
import { FacilityModal } from './FacilityModal';

interface AcademyModalProps {
  isOpen?: boolean;
  state: GameState;
  lang: Language;
  cost: number;
  canAfford?: boolean;
  onConfirm?: () => void;
  onUpgrade?: () => void;
  onDowngrade?: () => void;
  onClose: () => void;
}

export const AcademyModal: React.FC<AcademyModalProps> = ({
  isOpen = true,
  state,
  lang,
  cost,
  canAfford = true,
  onConfirm,
  onUpgrade,
  onDowngrade,
  onClose,
}) => {
  if (!isOpen) return null;
  const handleConfirm = onConfirm || onUpgrade || (() => {});

  return (
    <FacilityModal
      type="academy"
      state={state}
      lang={lang}
      cost={cost}
      canAfford={canAfford}
      onConfirm={handleConfirm}
      onDowngrade={onDowngrade}
      onClose={onClose}
    />
  );
};
