import React, { useState, useEffect, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ValidationResult } from '@/lib/validation';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  validate?: (value: string) => ValidationResult;
  onValidationChange?: (isValid: boolean) => void;
  prefix?: string | ReactNode;
  validationFn?: (value: string) => ValidationResult;
  fullWidth?: boolean;
};

const ValidatedInput = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text', 
    label, 
    error, 
    helperText, 
    validate,
    validationFn,
    onValidationChange,
    onChange,
    onBlur,
    required,
    prefix,
    fullWidth = true,
    ...props 
  }, ref) => {
    const [validationError, setValidationError] = useState<string | undefined>(error);
    const [touched, setTouched] = useState(false);
    const [value, setValue] = useState(props.value || props.defaultValue || '');
    
    // Use either validate or validationFn prop (for backward compatibility)
    const validationFunction = validate || validationFn;
    
    // Handle external error prop changes
    useEffect(() => {
      setValidationError(error);
    }, [error]);
    
    // Run validation when value changes and field has been touched
    useEffect(() => {
      if (touched && validationFunction) {
        const result = validationFunction(value as string);
        setValidationError(result.isValid ? undefined : result.message);
        if (onValidationChange) {
          onValidationChange(result.isValid);
        }
      }
    }, [value, touched, validationFunction, onValidationChange]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      if (onChange) {
        onChange(e);
      }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      if (validationFunction) {
        const result = validationFunction(e.target.value);
        setValidationError(result.isValid ? undefined : result.message);
        if (onValidationChange) {
          onValidationChange(result.isValid);
        }
      }
      if (onBlur) {
        onBlur(e);
      }
    };
    
    const hasError = touched && !!validationError;
    const describedBy = hasError ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined;
    
    // Determine if this is likely a mobile/touch device
    const isTouchDevice = typeof window !== 'undefined' && (
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      (navigator as any).msMaxTouchPoints > 0
    );
    
    const inputProps = {
      ...props,
      type,
      className: cn(
        "w-full rounded-md border border-input bg-transparent px-3 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 tap-highlight-transparent",
        isTouchDevice ? "h-11 py-2.5 text-base" : "h-9 py-1 text-sm",
        prefix && "pl-8",
        hasError && "border-red-500 focus-visible:ring-red-500",
        className
      ),
      onChange: handleChange,
      onBlur: handleBlur,
      // Improve mobile keyboard experience based on input type
      inputMode: type === 'number' ? 'numeric' as const : type === 'email' ? 'email' as const : type === 'tel' ? 'tel' as const : undefined,
      // Add autocomplete attributes to help browsers
      autoComplete: type === 'email' ? 'email' : type === 'password' ? 'current-password' : type === 'tel' ? 'tel' : props.autoComplete,
      // Add accessibility
      "aria-required": required ? 'true' : undefined,
    } as React.InputHTMLAttributes<HTMLInputElement>;
    
    if (hasError) {
      inputProps['aria-invalid'] = 'true';
    }
    
    if (describedBy) {
      inputProps['aria-describedby'] = describedBy;
    }
    
    return (
      <div className={cn("space-y-2", fullWidth ? "w-full" : "")}>
        {label && (
          <label 
            htmlFor={props.id} 
            className="block text-sm font-medium leading-none text-foreground mb-1.5"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            {...inputProps}
          />
        </div>
        {hasError ? (
          <p 
            className="text-xs text-red-500 mt-1.5" 
            id={`${props.id}-error`}
            role="alert"
          >
            {validationError}
          </p>
        ) : helperText ? (
          <p 
            className="text-xs text-muted-foreground mt-1.5" 
            id={`${props.id}-helper`}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

export { ValidatedInput };

// Also create a validated textarea component for descriptions
type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  helperText?: string;
  validate?: (value: string) => ValidationResult;
  onValidationChange?: (isValid: boolean) => void;
  fullWidth?: boolean;
};

const ValidatedTextarea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({
    className,
    label,
    error,
    helperText,
    validate,
    onValidationChange,
    onChange,
    onBlur,
    required,
    fullWidth = true,
    ...props
  }, ref) => {
    const [validationError, setValidationError] = useState<string | undefined>(error);
    const [touched, setTouched] = useState(false);
    const [value, setValue] = useState(props.value || props.defaultValue || '');
    
    // Handle external error prop changes
    useEffect(() => {
      setValidationError(error);
    }, [error]);
    
    // Run validation when value changes and field has been touched
    useEffect(() => {
      if (touched && validate) {
        const result = validate(value as string);
        setValidationError(result.isValid ? undefined : result.message);
        if (onValidationChange) {
          onValidationChange(result.isValid);
        }
      }
    }, [value, touched, validate, onValidationChange]);
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      if (onChange) {
        onChange(e);
      }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setTouched(true);
      if (validate) {
        const result = validate(e.target.value);
        setValidationError(result.isValid ? undefined : result.message);
        if (onValidationChange) {
          onValidationChange(result.isValid);
        }
      }
      if (onBlur) {
        onBlur(e);
      }
    };
    
    const hasError = touched && !!validationError;
    const describedBy = hasError ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined;
    
    const textareaProps = {
      ...props,
      className: cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        hasError && "border-red-500 focus-visible:ring-red-500",
        className
      ),
      onChange: handleChange,
      onBlur: handleBlur,
    };
    
    if (hasError) {
      textareaProps['aria-invalid'] = 'true';
    }
    
    if (describedBy) {
      textareaProps['aria-describedby'] = describedBy;
    }
    
    return (
      <div className="space-y-1">
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium leading-6 text-muted-foreground"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <textarea
          ref={ref}
          {...textareaProps}
        />
        {hasError ? (
          <p 
            className="text-xs text-red-500 mt-1" 
            id={`${props.id}-error`}
            role="alert"
          >
            {validationError}
          </p>
        ) : helperText ? (
          <p 
            className="text-xs text-muted-foreground mt-1" 
            id={`${props.id}-helper`}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

ValidatedTextarea.displayName = 'ValidatedTextarea';

export { ValidatedTextarea }; 