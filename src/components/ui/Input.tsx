import React from 'react';
import { classNames } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={inputId}
          className={classNames(
            'form-input',
            error && 'form-input-error',
            className
          )}
          {...props}
        />
        {error && (
          <p className="form-error" role="alert">
            <span>⚠️</span> {error}
          </p>
        )}
        {!error && helperText && (
          <p className="form-label" style={{ fontWeight: 'normal', opacity: 0.7 }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
