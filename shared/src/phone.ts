/**
 * Turns a Nigerian number into the digits `wa.me` expects.
 * `0803 000 0000` and `+234 803 000 0000` both become `2348030000000`.
 */
export const toWhatsAppNumber = (phone: string): string | null => {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('0')) {
    return `234${digits.slice(1)}`;
  }

  if (digits.length === 13 && digits.startsWith('234')) {
    return digits;
  }

  if (digits.length === 10) {
    return `234${digits}`;
  }

  return digits.length >= 10 ? digits : null;
};

export const whatsappUrl = (phone: string, message: string): string | null => {
  const number = toWhatsAppNumber(phone);

  if (!number) {
    return null;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};
