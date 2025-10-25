export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone);
};

export const validatePassword = (password) => {
  return {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    isValid: password.length >= 8,
  };
};

export const validateName = (name) => {
  return name && name.trim().length >= 2;
};

export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

export const formatPhoneNumber = (phone) => {
  return phone.replace(/[\s\-\(\)]/g, '');
};

export const formatCurrency = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};

export const formatDate = (date) => {
  const d = new Date(date);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-IN', options);
};

export const formatTime = (date) => {
  const d = new Date(date);
  const options = { hour: '2-digit', minute: '2-digit', hour12: true };
  return d.toLocaleTimeString('en-IN', options);
};

export const formatDateTime = (date) => {
  return `${formatDate(date)} ${formatTime(date)}`;
};