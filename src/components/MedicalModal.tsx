import React from 'react';
import { FacilityModal } from './FacilityModal';
import { GameState, Language } from '../types';

interface MedicalModalProps {
  state: GameState;
  lang: Language;
  cost: number;
  onClose: () => void;
  onConfirm: () => void;
  canAfford: boolean;
}

export const MedicalModal: React.FC<MedicalModalProps> = (props) => {
  return <FacilityModal type="medical" {...props} />;
};
