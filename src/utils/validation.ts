// Input validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string,
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateName = (
  name: string,
): {
  isValid: boolean;
  error?: string;
} => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: "Name is required" };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long" };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: "Name must be less than 50 characters" };
  }

  return { isValid: true };
};

// Form validation helper
export const validateForm = (fields: {
  [key: string]: any;
}): {
  isValid: boolean;
  errors: { [key: string]: string };
} => {
  const errors: { [key: string]: string } = {};

  Object.entries(fields).forEach(([key, value]) => {
    if (key === "email") {
      if (!validateEmail(value)) {
        errors[key] = "Please enter a valid email address";
      }
    } else if (key === "password") {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        errors[key] = validation.errors[0]; // Show first error
      }
    } else if (key === "name") {
      const validation = validateName(value);
      if (!validation.isValid) {
        errors[key] = validation.error!;
      }
    } else if (
      !value ||
      (typeof value === "string" && value.trim().length === 0)
    ) {
      errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format currency
export const formatCurrency = (
  amount: number,
  currency: string = "₺",
): string => {
  return `${currency}${amount.toFixed(2)}`;
};

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format relative time
export const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
};

// Debounce function for search inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Error message parser
export const parseErrorMessage = (error: any): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return error.error;
  }

  if (error?.details && Array.isArray(error.details)) {
    return error.details
      .map((detail: any) => detail.message || detail.msg)
      .join(", ");
  }

  return "An unexpected error occurred";
};
