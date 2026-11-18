import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 750,
  className = ''
}) => {
  const stringVal = String(value);
  const match = stringVal.match(/^(\d+)(.*)$/);
  const targetNum = match ? parseInt(match[1], 10) : (typeof value === 'number' ? value : NaN);
  const suffix = match && match[2] ? match[2] : '';

  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    if (isNaN(targetNum)) return;
    let startTime: number | null = null;
    let frameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo curve
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCurrent(Math.round(easeProgress * targetNum));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [targetNum, duration]);

  if (isNaN(targetNum)) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      {current}{suffix}
    </span>
  );
};
