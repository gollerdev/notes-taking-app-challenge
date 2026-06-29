/** Validates an email address. Returns an error string or undefined. */
export function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return "Email is required";
  }
  // Simple regex for email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return "Invalid email format";
  }
  return undefined;
}

/** Validates a password. Returns an error string or undefined. */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return undefined;
}
