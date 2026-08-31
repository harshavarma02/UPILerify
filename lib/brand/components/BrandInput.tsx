'use client';

import React from 'react';

export interface BrandInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  mono?: boolean;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export function BrandInput({
  label,
  helperText,
  error,
  mono = false,
  prefixElement,
  suffixElement,
  className = '',
  id,
  ...props
}: BrandInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-brand-navy tracking-tight"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {prefixElement && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground text-xs">
            {prefixElement}
          </div>
        )}

        <input
          id={inputId}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/60 focus:bg-white border text-xs text-brand-navy transition-all placeholder:text-muted-light focus:outline-none shadow-xs ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20'
          } ${mono ? 'font-mono' : 'font-sans'} ${
            prefixElement ? 'pl-9' : ''
          } ${suffixElement ? 'pr-9' : ''} ${className}`}
          {...props}
        />

        {suffixElement && (
          <div className="absolute right-3.5 flex items-center text-muted-foreground text-xs">
            {suffixElement}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-500">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}
