/**
 * Formats a phone number for WhatsApp international format.
 * Defaults to Ghana (+233) if no country code is provided.
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
