import { prisma } from '../lib/prisma';
import { company as defaults } from '../lib/business';

export type PublicCompany = {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
};

const toPublic = (row: {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}): PublicCompany => ({
  name: row.name,
  tagline: row.tagline,
  phone: row.phone,
  email: row.email,
  address: row.address,
  bank: {
    bankName: row.bankName,
    accountName: row.accountName,
    accountNumber: row.accountNumber,
  },
});

export const getCompanySettings = async (): Promise<PublicCompany> => {
  const row = await prisma.companySettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      name: defaults.name,
      tagline: defaults.tagline,
      phone: defaults.phone,
      email: defaults.email,
      address: defaults.address,
      bankName: defaults.bank.bankName,
      accountName: defaults.bank.accountName,
      accountNumber: defaults.bank.accountNumber,
    },
    update: {},
  });

  return toPublic(row);
};

export type CompanyInput = {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export const updateCompanySettings = async (input: CompanyInput): Promise<PublicCompany> => {
  const row = await prisma.companySettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...input },
    update: input,
  });

  return toPublic(row);
};
