import { quotationStatusLabel, quotationTone, statusChipClass } from '@/lib/invoice';
import type { QuotationSummary } from '@/lib/schemas';

export const QuotationStatus = ({
  quotation,
}: {
  quotation: Pick<QuotationSummary, 'status' | 'cancelledAt'>;
}) => (
  <span
    className={`rounded-card border px-2 py-0.5 text-xs font-medium ${statusChipClass[quotationTone(quotation)]}`}
  >
    {quotationStatusLabel(quotation)}
  </span>
);
