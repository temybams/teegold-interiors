import type { RequestHandler } from 'express';

import { getCompanySettings, updateCompanySettings } from '../services/settings.service';
import { asyncHandler } from '../utils/async-handler';
import type { SettingsBody } from '../validations/settings.validation';

export const getSettings: RequestHandler = asyncHandler(async (_req, res) => {
  res.json({ company: await getCompanySettings() });
});

export const patchSettings: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as SettingsBody;

  res.json({
    company: await updateCompanySettings({
      name: body.name,
      tagline: body.tagline,
      phone: body.phone,
      email: body.email,
      address: body.address,
      bankName: body.bankName,
      accountName: body.accountName,
      accountNumber: body.accountNumber,
    }),
  });
});
