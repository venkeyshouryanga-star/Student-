import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  variant: 'pass' | 'fail' | 'published' | 'draft' | 'pending';
  label?: string;
}

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  const config = {
    pass: {
      text: label ?? 'Pass',
      classes: 'bg-emerald-50 text-emerald-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
    },
    published: {
      text: label ?? 'Published',
      classes: 'bg-emerald-50 text-emerald-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
    },
    fail: {
      text: label ?? 'Fail',
      classes: 'bg-rose-50 text-rose-700',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
    },
    draft: {
      text: label ?? 'Draft',
      classes: 'bg-amber-50 text-amber-700',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
    },
    pending: {
      text: label ?? 'Pending',
      classes: 'bg-gray-100 text-gray-600',
      icon: <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />,
    },
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${config.classes}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
}
