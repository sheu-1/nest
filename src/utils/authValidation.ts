/**
 * Email validation helper using standard RFC 5322 regex.
 */
export function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Password strength evaluator.
 * Returns a score between 0 and 4:
 * 0-1: Weak
 * 2-3: Medium
 * 4: Strong
 */
export interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Medium' | 'Strong';
  color: string;
  feedback: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (!password || password.length < 6) {
    return { score: 0, label: 'Weak', color: '#D32F2F', feedback: 'Password must be at least 6 characters.' };
  }

  score += 1; // Length is >= 6
  if (password.length >= 10) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Cap score at 4
  const finalScore = Math.min(score, 4);

  if (finalScore <= 2) {
    return {
      score: finalScore,
      label: 'Weak',
      color: '#D32F2F',
      feedback: 'Add numbers, capital letters, or symbols.'
    };
  } else if (finalScore === 3) {
    return {
      score: finalScore,
      label: 'Medium',
      color: '#F57C00',
      feedback: 'Good password. Add symbols to make it stronger.'
    };
  } else {
    return {
      score: finalScore,
      label: 'Strong',
      color: '#388E3C',
      feedback: 'Excellent! Your password is secure.'
    };
  }
}

/**
 * Formats a given number into the standardized Kenyan phone format (+254...)
 * Handles input patterns:
 * - "0712345678" -> "+254712345678"
 * - "712345678"  -> "+254712345678"
 * - "254712345678" -> "+254712345678"
 * - "+254712345678" -> "+254712345678"
 */
export function formatKenyanPhoneNumber(phone: string): string {
  let clean = phone.replace(/\D/g, ''); // strip all non-numeric characters

  if (phone.startsWith('+')) {
    return `+${clean}`;
  }

  if (clean.startsWith('0')) {
    return `+254${clean.slice(1)}`;
  }

  if (clean.startsWith('254') && clean.length >= 12) {
    return `+${clean}`;
  }

  if (clean.length === 9) {
    return `+254${clean}`;
  }

  return phone; // Return original if not fitting typical patterns
}
