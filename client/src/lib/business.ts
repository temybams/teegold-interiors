/** One place to edit the details that appear across the public site. */
export const business = {
  name: 'Teegold Interiors',
  tagline: 'Blinds, curtains and window treatments',
  phone: '0803 000 0000',
  /** International form without plus or spaces, which is what wa.me expects. */
  whatsapp: '2348030000000',
  email: 'hello@teegoldinteriors.ng',
  area: 'Ado-Ekiti',
  address: 'GRA, Ado-Ekiti, Ekiti State',
} as const;

export const whatsappUrl = (message: string): string =>
  `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`;
