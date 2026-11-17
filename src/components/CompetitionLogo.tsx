import React, { useEffect, useState } from 'react';
import { isAnyModActive } from '../utils/modManager';
import { CompetitionLogoKind, getCompetitionLogoDataUri } from '../data/competitionLogos';

export interface CompetitionLogoProps {
  kind: CompetitionLogoKind | string;
  country?: string;
  tier?: number;
  className?: string;
  alt?: string;
  title?: string;
}

export const CompetitionLogo: React.FC<CompetitionLogoProps> = ({
  kind,
  country,
  tier = 1,
  className = 'w-6 h-6 object-contain',
  alt = '',
  title,
}) => {
  const [modActive, setModActive] = useState(() => isAnyModActive());

  useEffect(() => {
    const handleModChange = () => setModActive(isAnyModActive());
    window.addEventListener('mod-state-change', handleModChange);
    window.addEventListener('storage', handleModChange);
    return () => {
      window.removeEventListener('mod-state-change', handleModChange);
      window.removeEventListener('storage', handleModChange);
    };
  }, []);

  const src = getCompetitionLogoDataUri(kind, {
    country,
    tier,
    isModActive: modActive,
  });

  if (!src) return null;

  const isJpeg = /\.jpe?g($|\?)/i.test(src);

  return (
    <img
      src={src}
      alt={alt}
      title={title}
      data-competition-logo={kind}
      data-mod-active={modActive ? 'true' : 'false'}
      className={`select-none pointer-events-none shrink-0 ${isJpeg ? 'mix-blend-multiply' : ''} ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
