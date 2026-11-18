import React from 'react';
import { Check, X, HelpCircle, Clock, Eye } from 'lucide-react';

interface StatusChipProps {
  status: 'verified' | 'contradicted' | 'unsupported' | 'outdated' | 'needs_review' | string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const configs: Record<string, { label: string; icon: any; style: string }> = {
    verified: {
      label: 'Verified True ✅',
      icon: Check,
      style: 'bg-popGreen text-black border-2 border-black shadow-brutal-sm'
    },
    contradicted: {
      label: 'Contradicted ❌',
      icon: X,
      style: 'bg-crimson text-white border-2 border-black shadow-brutal-sm'
    },
    outdated: {
      label: 'Expired Date ⏳',
      icon: Clock,
      style: 'bg-popPurple text-black border-2 border-black shadow-brutal-sm'
    },
    unsupported: {
      label: 'No Evidence ⚠️',
      icon: HelpCircle,
      style: 'bg-popYellow text-black border-2 border-black shadow-brutal-sm'
    },
    needs_review: {
      label: 'Needs Human Eye 👀',
      icon: Eye,
      style: 'bg-popBlue text-black border-2 border-black shadow-brutal-sm'
    }
  };

  const config = configs[status] || {
    label: status,
    icon: HelpCircle,
    style: 'bg-cream-200 text-black border-2 border-black shadow-brutal-sm'
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-lg ${config.style}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
