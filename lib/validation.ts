/**
 * Validation utilities for the Budget Tracker application
 * Contains validation functions for different types of input data
 */

export type ValidationResult = {
  isValid: boolean;
  message: string;
};

/**
 * Validates a required field
 */
export function validateRequired(value: string | number | null | undefined, fieldName: string): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      message: `${fieldName} is required`
    };
  }
  return { isValid: true, message: '' };
}

/**
 * Validates a numeric amount field
 */
export function validateAmount(value: string | number | null | undefined): ValidationResult {
  const requiredCheck = validateRequired(value, 'Amount');
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue as number)) {
    return {
      isValid: false,
      message: 'Amount must be a valid number'
    };
  }
  
  if ((numericValue as number) <= 0) {
    return {
      isValid: false,
      message: 'Amount must be greater than zero'
    };
  }
  
  if ((numericValue as number) > 999999999) {
    return {
      isValid: false,
      message: 'Amount is too large'
    };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validates a date field
 */
export function validateDate(value: string | null | undefined): ValidationResult {
  const requiredCheck = validateRequired(value, 'Date');
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }
  
  // Strict YYYY-MM-DD format check
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(value as string)) {
    return {
      isValid: false,
      message: 'Date must be in YYYY-MM-DD format'
    };
  }
  
  // Validate it's an actual valid date
  const dateObj = new Date(value as string);
  if (isNaN(dateObj.getTime())) {
    return {
      isValid: false,
      message: 'Invalid date'
    };
  }
  
  // Check if date is within reasonable range
  const today = new Date();
  const hundredYearsAgo = new Date();
  hundredYearsAgo.setFullYear(today.getFullYear() - 100);
  
  if (dateObj > new Date(today.getFullYear() + 10, today.getMonth(), today.getDate())) {
    return {
      isValid: false,
      message: 'Date cannot be more than 10 years in the future'
    };
  }
  
  if (dateObj < hundredYearsAgo) {
    return {
      isValid: false,
      message: 'Date cannot be more than 100 years in the past'
    };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validates an email address
 */
export function validateEmail(value: string | null | undefined): ValidationResult {
  const requiredCheck = validateRequired(value, 'Email');
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(value as string)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address'
    };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validates a phone number
 */
export function validatePhone(value: string | null | undefined, required = false): ValidationResult {
  if (!required && (!value || value.trim() === '')) {
    return { isValid: true, message: '' };
  }
  
  if (required) {
    const requiredCheck = validateRequired(value, 'Phone number');
    if (!requiredCheck.isValid) {
      return requiredCheck;
    }
  }
  
  // Allow different formats but ensure it has enough digits
  const digitsOnly = (value as string).replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return {
      isValid: false,
      message: 'Phone number must have between 10 and 15 digits'
    };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validates a name field
 */
export function validateName(value: string | null | undefined): ValidationResult {
  const requiredCheck = validateRequired(value, 'Name');
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }
  
  if ((value as string).length < 2) {
    return {
      isValid: false,
      message: 'Name must be at least 2 characters long'
    };
  }
  
  if ((value as string).length > 100) {
    return {
      isValid: false,
      message: 'Name cannot exceed 100 characters'
    };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validates a description field with optional requirement
 */
export function validateDescription(value: string | null | undefined, required = false, maxLength = 500): ValidationResult {
  if (!required && (!value || value.trim() === '')) {
    return { isValid: true, message: '' };
  }
  
  if (required) {
    const requiredCheck = validateRequired(value, 'Description');
    if (!requiredCheck.isValid) {
      return requiredCheck;
    }
  }
  
  if ((value as string).length > maxLength) {
    return {
      isValid: false,
      message: `Description cannot exceed ${maxLength} characters`
    };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validates a category field
 */
export function validateCategory(value: string | null | undefined): ValidationResult {
  const requiredCheck = validateRequired(value, 'Category');
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }
  
  if ((value as string).length > 50) {
    return {
      isValid: false,
      message: 'Category name cannot exceed 50 characters'
    };
  }
  
  // If it looks like a UUID, validate the format
  if ((value as string).includes('-') && (value as string).length > 30) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value as string)) {
      return {
        isValid: false,
        message: 'Invalid category ID format'
      };
    }
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validates a transaction type
 */
export function validateTransactionType(value: string | null | undefined): ValidationResult {
  const requiredCheck = validateRequired(value, 'Transaction type');
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }
  
  if ((value as string) !== 'income' && (value as string) !== 'expense') {
    return {
      isValid: false,
      message: 'Transaction type must be either income or expense'
    };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validates a form object by running multiple validations
 */
export function validateForm(validations: ValidationResult[]): ValidationResult {
  for (const validation of validations) {
    if (!validation.isValid) {
      return validation;
    }
  }
  return { isValid: true, message: '' };
} 