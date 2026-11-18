import React from 'react';
import { ViolationSeverity } from '../../types';

interface SeverityBadgeProps {
  severity: ViolationSeverity;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const styles: Record<ViolationSeverity, string> = {
    critical: 'bg-crimson text-white border-2 border-black shadow-brutal-sm',
    high: 'bg-popCoral text-black border-2 border-black shadow-brutal-sm',
    medium: 'bg-popYellow text-black border-2 border-black shadow-brutal-sm',
    low: 'bg-cream-200 text-black border-2 border-black shadow-brutal-sm',
    info: 'bg-popBlue text-black border-2 border-black shadow-brutal-sm'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-black rounded-lg uppercase tracking-wider ${styles[severity] || styles.medium}`}>
      {severity}
    </span>
  );
};
