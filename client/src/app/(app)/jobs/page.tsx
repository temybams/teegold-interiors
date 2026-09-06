'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { InvoiceStatus } from '@/components/invoice-status';
import { TableSkeleton } from '@/components/loader';
import { apiFetch, apiPatch, isApiRequestError } from '@/lib/api';
import { formatInvoiceDate, jobStatusLabel } from '@/lib/invoice';
import { formatNaira } from '@/lib/money';
import {
  JOB_STATUSES,
  invoiceResponseSchema,
  jobsResponseSchema,
  type InvoiceSummary,
  type JobStatus,
} from '@/lib/schemas';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'NOT_STARTED', label: 'Not started' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'COMPLETED', label: 'Completed' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const toDatetimeLocal = (iso: string | null | undefined): string => {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const JobsPage = () => {
  const [jobs, setJobs] = useState<InvoiceSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [filter, setFilter] = useState<FilterId>('all');
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async (status: FilterId, nextPage: number) => {
    try {
      const params = new URLSearchParams({
        status,
        page: String(nextPage),
        limit: '20',
      });

      const result = jobsResponseSchema.parse(
        await apiFetch<unknown>(`/api/jobs?${params.toString()}`),
      );
      setJobs(result.jobs);
      setPage(result.page);
      setTotal(result.total);
      setLimit(result.limit);
      setListError(null);
    } catch (caught) {
      setListError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load(filter, 1);
  }, [filter, load]);

  const updateJob = async (
    job: InvoiceSummary,
    patch: { jobStatus: JobStatus; scheduledAt?: string | null },
  ) => {
    setSavingId(job.id);

    try {
      const { invoice } = invoiceResponseSchema.parse(
        await apiPatch<unknown>(`/api/jobs/${job.id}`, patch),
      );
      setJobs((current) =>
        current.map((row) =>
          row.id === job.id
            ? {
                ...row,
                jobStatus: invoice.jobStatus,
                scheduledAt: invoice.scheduledAt,
                completedAt: invoice.completedAt,
              }
            : row,
        ),
      );
      setListError(null);
    } catch (caught) {
      setListError(errorMessage(caught));
    } finally {
      setSavingId(null);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="font-serif text-3xl">Jobs</h1>
        <p className="mt-1 text-sm text-muted">
          Install work tied to invoices. Update status and schedule from here.
        </p>
      </header>

      <section className="rounded-card mt-8 border border-hairline bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-4 sm:px-6">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-card px-3 py-1.5 text-xs ${
                filter === item.id ? 'bg-lilac text-brand' : 'border border-hairline text-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {listError && <p className="px-4 py-4 text-sm text-cancelled sm:px-6">{listError}</p>}
        {loading && <TableSkeleton rows={6} columns={5} />}

        {!loading && jobs.length === 0 && (
          <p className="px-4 py-8 text-sm text-muted sm:px-6">
            {filter !== 'all' ? 'No jobs in that status.' : 'No active jobs yet.'}
          </p>
        )}

        {!loading && jobs.length > 0 && (
          <>
            <ul className="divide-y divide-hairline md:hidden">
              {jobs.map((job) => (
                <li key={job.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/invoices/${job.id}`}
                        className="text-sm font-medium text-brand underline underline-offset-4"
                      >
                        {job.number}
                      </Link>
                      <p className="mt-1 text-sm">{job.customer.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatInvoiceDate(job.createdAt)}
                      </p>
                    </div>
                    <InvoiceStatus invoice={job} />
                  </div>
                  <p className="tabular text-sm">{formatNaira(job.total)}</p>
                  <label className="block text-xs text-muted">
                    Job status
                    <select
                      value={job.jobStatus}
                      disabled={savingId === job.id}
                      onChange={(event) =>
                        void updateJob(job, { jobStatus: event.target.value as JobStatus })
                      }
                      className="rounded-card mt-1 w-full border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand disabled:opacity-60"
                    >
                      {JOB_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {jobStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(job.jobStatus === 'SCHEDULED' || job.scheduledAt) && (
                    <label className="block text-xs text-muted">
                      Scheduled
                      <input
                        type="datetime-local"
                        value={toDatetimeLocal(job.scheduledAt)}
                        disabled={savingId === job.id}
                        onChange={(event) =>
                          void updateJob(job, {
                            jobStatus: job.jobStatus === 'NOT_STARTED' ? 'SCHEDULED' : job.jobStatus,
                            scheduledAt: event.target.value || null,
                          })
                        }
                        className="rounded-card mt-1 w-full border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand disabled:opacity-60"
                      />
                    </label>
                  )}
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="text-left text-xs tracking-widest text-muted uppercase">
                    <th className="px-6 py-3 font-normal">Invoice</th>
                    <th className="px-6 py-3 font-normal">Client</th>
                    <th className="px-6 py-3 font-normal">Date</th>
                    <th className="px-6 py-3 font-normal">Amount</th>
                    <th className="px-6 py-3 font-normal">Payment</th>
                    <th className="px-6 py-3 font-normal">Job status</th>
                    <th className="px-6 py-3 font-normal">Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-t border-hairline">
                      <td className="px-6 py-3">
                        <Link
                          href={`/invoices/${job.id}`}
                          className="text-brand underline underline-offset-4"
                        >
                          {job.number}
                        </Link>
                      </td>
                      <td className="px-6 py-3">{job.customer.name}</td>
                      <td className="px-6 py-3 text-muted">{formatInvoiceDate(job.createdAt)}</td>
                      <td className="tabular px-6 py-3">{formatNaira(job.total)}</td>
                      <td className="px-6 py-3">
                        <InvoiceStatus invoice={job} />
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={job.jobStatus}
                          disabled={savingId === job.id}
                          onChange={(event) =>
                            void updateJob(job, { jobStatus: event.target.value as JobStatus })
                          }
                          className="rounded-card w-full min-w-[9rem] border border-hairline bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand disabled:opacity-60"
                        >
                          {JOB_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {jobStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="datetime-local"
                          value={toDatetimeLocal(job.scheduledAt)}
                          disabled={savingId === job.id}
                          onChange={(event) =>
                            void updateJob(job, {
                              jobStatus:
                                job.jobStatus === 'NOT_STARTED' ? 'SCHEDULED' : job.jobStatus,
                              scheduledAt: event.target.value || null,
                            })
                          }
                          className="rounded-card w-full min-w-[11rem] border border-hairline bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand disabled:opacity-60"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && total > limit && (
          <div className="flex items-center justify-between border-t border-hairline px-4 py-3 text-sm sm:px-6">
            <p className="text-muted">
              Page {page} of {pageCount}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  void load(filter, page - 1);
                }}
                className="text-brand underline underline-offset-4 disabled:text-muted disabled:no-underline"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => {
                  setLoading(true);
                  void load(filter, page + 1);
                }}
                className="text-brand underline underline-offset-4 disabled:text-muted disabled:no-underline"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default JobsPage;
