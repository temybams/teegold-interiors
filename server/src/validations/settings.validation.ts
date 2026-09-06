import { z } from 'zod';

export const settingsBodySchema = z.object({
  name: z.string().trim().min(2, 'Enter the company name'),
  tagline: z.string().trim().min(2, 'Enter a short tagline'),
  phone: z.string().trim().min(7, 'Enter a phone number'),
  email: z.string().trim().email('Enter an email address').toLowerCase(),
  address: z.string().trim().min(4, 'Enter the address'),
  bankName: z.string().trim().min(2, 'Enter the bank name'),
  accountName: z.string().trim().min(2, 'Enter the account name'),
  accountNumber: z.string().trim().min(8, 'Enter the account number').max(20, 'That looks too long'),
});

export type SettingsBody = z.infer<typeof settingsBodySchema>;
