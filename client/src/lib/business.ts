/** One place to edit the details that appear across the public site. */
export const business = {
  name: 'Teegold Interiors',
  tagline: 'Blinds, curtains and window treatments',
  phone: '08137341838',
  /** International form without plus or spaces, which is what wa.me expects. */
  whatsapp: '2348137341838',
  email: 'hello@teegoldinteriors.ng',
  area: 'Ado-Ekiti',
  address: 'GRA, Ado-Ekiti, Ekiti State',
  /** Shown on unpaid / partial invoices until Settings loads from the API. */
  bank: {
    bankName: 'First Bank of Nigeria',
    accountName: 'Teegold Interiors',
    accountNumber: '0123456789',
  },
} as const;

export const whatsappUrl = (message: string): string =>
  `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`;
