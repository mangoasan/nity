'use client';

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { X } from 'lucide-react';

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <SectionLabel className="mb-3">{eyebrow}</SectionLabel>}
        <h2 className="font-display text-3xl leading-[1.04] text-[var(--dark)] sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const buttonVariants = {
  primary:
    'bg-[var(--accent)] text-white shadow-[0_12px_28px_-18px_rgba(73,120,188,0.9)] hover:bg-[#3f6dac]',
  secondary: 'bg-[var(--dark)] text-white hover:bg-black',
  cream: 'bg-[var(--cream)] text-[var(--dark)] hover:bg-[#ded0b8]',
  outline:
    'border border-[var(--border)] bg-white text-[var(--dark)] hover:border-[var(--accent)]',
  ghost: 'bg-transparent text-[var(--accent)] hover:bg-[var(--accent-soft)]',
  danger: 'bg-[#A43A2C] text-white hover:bg-[#8c2f24]',
};

const buttonSizes = {
  sm: 'min-h-9 px-4 text-xs',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-sm sm:px-7',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  full,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  full?: boolean;
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        buttonVariants[variant],
        buttonSizes[size],
        full && 'w-full',
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  padded = true,
  ...props
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-[22px] bg-white shadow-[0_1px_0_rgba(24,24,27,0.04),0_18px_38px_-26px_rgba(24,24,27,0.22)]',
        padded && 'p-5',
        className,
      )}
      {...props}
    />
  );
}

const pillTones = {
  cream: 'bg-[#F1E8D6] text-[#5C4A2A]',
  accent: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  green: 'bg-[#E1F0E6] text-[#256940]',
  red: 'bg-[#F7E0DD] text-[#A43A2C]',
  dark: 'bg-[var(--dark)] text-white',
  white: 'bg-white/90 text-[var(--dark)]',
};

export function Pill({
  className,
  tone = 'cream',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof pillTones }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        pillTones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Alert({
  tone = 'info',
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: 'info' | 'success' | 'error' }) {
  const tones = {
    info: 'bg-[var(--accent-soft)] text-[var(--accent)]',
    success: 'bg-[#E1F0E6] text-[#256940]',
    error: 'bg-[#F7E0DD] text-[#A43A2C]',
  };

  return (
    <div
      className={cn('rounded-2xl px-4 py-3 text-sm leading-6', tones[tone], className)}
      {...props}
    />
  );
}

export function TextField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{label}</span>
      <input
        className={cn(
          'min-h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--dark)] outline-none transition',
          'placeholder:text-[#A8A199] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]',
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function TextArea({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{label}</span>
      <textarea
        className={cn(
          'w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--dark)] outline-none transition',
          'placeholder:text-[#A8A199] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]',
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function ModalShell({
  children,
  onClose,
  className,
  panelClassName,
  sheetOnMobile = true,
}: {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
  panelClassName?: string;
  sheetOnMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] flex bg-black/45 p-3 backdrop-blur-sm',
        sheetOnMobile ? 'items-end sm:items-center sm:justify-center' : 'items-center justify-center',
        className,
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'max-h-[92vh] w-full overflow-hidden bg-[var(--warm-bg)] shadow-2xl',
          sheetOnMobile ? 'rounded-t-[28px] sm:max-w-2xl sm:rounded-[28px]' : 'max-w-2xl rounded-[28px]',
          panelClassName,
        )}
      >
        {sheetOnMobile && (
          <div className="flex justify-center pt-3 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-[#D4CCBB]" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function CloseButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--dark)] shadow-sm transition hover:bg-[#F5EFE0]',
        className,
      )}
      type="button"
      {...props}
    >
      <X size={18} />
    </button>
  );
}

export function ProgressBar({
  value,
  danger,
}: {
  value: number;
  danger?: boolean;
}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#EDE5D6]">
      <div
        className={cn('h-full rounded-full transition-all duration-700', danger ? 'bg-[#D97757]' : 'bg-[var(--accent)]')}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: React.ReactNode;
  text?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xl text-[var(--accent)]">
        -
      </div>
      <div className="font-display text-2xl text-[var(--dark)]">{title}</div>
      {text && <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function LoadingStack({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-[22px] bg-[#EFE7D8]"
        />
      ))}
    </div>
  );
}
