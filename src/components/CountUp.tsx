import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  initialValue?: number;
  startFromZero?: boolean;
  formatValue?: (val: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 900,
  initialValue,
  startFromZero = false,
  formatValue = (v) => v.toString(),
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const getStartVal = () => {
    if (initialValue !== undefined) return initialValue;
    if (startFromZero) return 0;
    return value;
  };

  const [displayValue, setDisplayValue] = useState<number>(getStartVal);
  const currentValRef = useRef<number>(getStartVal());
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = currentValRef.current;
    if (startVal === value) return;

    const diff = value - startVal;
    const startTime = performance.now();
    const animDuration = Math.max(200, duration);

    const animateNumber = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / animDuration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startVal + diff * easeProgress);

      currentValRef.current = currentVal;
      setDisplayValue(currentVal);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateNumber);
      } else {
        currentValRef.current = value;
        setDisplayValue(value);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animateNumber);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatValue(Math.round(displayValue))}
      {suffix}
    </span>
  );
};

export const NumberTicker = CountUp;
