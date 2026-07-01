/**
 * Utility module for handling and standardizing phone numbers.
 */

/**
 * Formats a given phone number string into an international WhatsApp-compatible format.
 * Defaults to the Ghana country code (233) if no country code is detected.
 * 
 * @param phone - The raw phone number string input (e.g., '0241234567').
 * @returns A purely numeric string formatted with the correct country code (e.g., '233241234567').
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // If it starts with '0', replace with '233' (Ghana default)
  if (cleaned.startsWith('0')) {
    cleaned = '233' + cleaned.substring(1);
  }

  // If it doesn't start with a country code (assuming 9+ digits for local numbers)
  // and is exactly 9 digits (local number without leading 0), add 233
  if (cleaned.length === 9) {
    cleaned = '233' + cleaned;
  }

  return cleaned;
};
