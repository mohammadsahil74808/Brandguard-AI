import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Shield, Clock } from 'lucide-react';
import { RiskBand } from '../../types';

interface RiskBadgeProps {
  band: RiskBand;
  points?: number;
  showPoints?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ band, points, showPoints = true, size = 'md' }) => {
  const config = {
    CRITICAL: {
      bg: 'bg-crimson text-white border-2 border-black shadow-brutal-sm',
      icon: ShieldAlert,
      label: 'CRITICAL RISK',
      desc: 'Severe policy violations or outdated/contradicted claims'
    },
    HIGH: {
      bg: 'bg-popCoral text-black border-2 border-black shadow-brutal-sm',
      icon: AlertTriangle,
      label: 'HIGH RISK',
      desc: 'Major brand guideline violations'
    },
    MEDIUM: {
      bg: 'bg-popYellow text-black border-2 border-black shadow-brutal-sm',
      icon: AlertTriangle,
      label: 'MEDIUM RISK',
      desc: 'Tone discrepancies or unverified claims'
    },
    LOW: {
      bg: 'bg-popGreen text-black border-2 border-black shadow-brutal-sm',
      icon: CheckCircle2,
      label: 'SAFE & READY',
      desc: 'Compliant with verified brand guidelines'
    },
    PENDING: {
      bg: 'bg-cream-200 text-black border-2 border-black shadow-brutal-sm',
      icon: Clock,
      label: 'NOT SCANNED',
      desc: 'Awaiting initial scan run'
    }
  }[band] || {
    bg: 'bg-cream-200 text-black border-2 border-black shadow-brutal-sm',
    icon: Shield,
    label: band,
    desc: ''
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5 font-bold',
    md: 'text-xs px-3 py-1 gap-1.5 font-black tracking-wide',
    lg: 'text-sm px-4 py-1.5 gap-2 font-black tracking-wide'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-xl border transition-all ${config.bg} ${sizeClasses}`}
      title={config.desc}
    >
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
      {showPoints && points !== undefined && (
        <span className="font-mono bg-black/10 px-1.5 py-0.5 rounded text-[10px] ml-0.5 font-bold">
          {points} pts
        </span>
      )}
    </span>
  );
};
