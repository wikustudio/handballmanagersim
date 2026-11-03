import React from 'react';
import { FacilityModal } from './FacilityModal';
import { GameState, Language } from '../types';

interface AcademyModalProps {
  state: GameState;
  lang: Language;
  cost: number;
  onClose: () => void;
  onConfirm: () => void;
  canAfford: boolean;
}

export const AcademyModal: React.FC<AcademyModalProps> = (props) => {
  return <FacilityModal type="academy" {...props} />;
};
