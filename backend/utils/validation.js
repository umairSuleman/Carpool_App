export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validatePassword = (password) => {
  return {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
};

export const validateRegistrationData = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  if (!validateEmail(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!validatePhone(data.phone)) {
    errors.phone = 'Invalid phone number format';
  }
  
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.minLength) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};