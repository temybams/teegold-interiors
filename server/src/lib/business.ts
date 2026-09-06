/** Fallback company copy when the API has not loaded settings yet. */
export const company = {
  name: 'Teegold Interiors',
  tagline: 'Blinds, curtains and window treatments',
  phone: '0803 000 0000',
  email: 'hello@teegoldinteriors.ng',
  address: 'GRA, Ado-Ekiti, Ekiti State',
  /** Shown on unpaid / partial invoices so the client can pay. */
  bank: {
    bankName: 'First Bank of Nigeria',
    accountName: 'Teegold Interiors',
    accountNumber: '0123456789',
  },
} as const;
