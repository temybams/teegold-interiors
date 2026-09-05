'use client';

import { whatsappUrl } from '@teegold/shared';
import { useCallback, useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { TableSkeleton } from '@/components/loader';
import { apiFetch, apiPatch, apiPost, isApiRequestError, type ApiIssue } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  invitedUserResponseSchema,
  usersResponseSchema,
  type Role,
  type User,
  type UserStatus,
} from '@/lib/schemas';

const statusChip: Record<UserStatus, string> = {
  PENDING: 'border-pending/30 bg-pending/10 text-pending',
  ACTIVE: 'border-paid/30 bg-paid/10 text-paid',
  SUSPENDED: 'border-cancelled/30 bg-cancelled/10 text-cancelled',
};

const statusLabel: Record<UserStatus, string> = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
};

const issueFor = (issues: ApiIssue[], field: string): string | undefined =>
  issues.find((issue) => issue.field === field)?.message;

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const inviteExpiryLabel = (iso: string | null): string => {
  if (!iso) {
    return 'Invite sent';
  }

  const expires = new Date(iso).getTime();
  const days = Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000));

  if (days < 0) {
    return 'Expired — resend';
  }

  if (days === 0) {
    return 'Expires today';
  }

  return `Expires in ${days} day${days === 1 ? '' : 's'}`;
};

const InviteLink = ({
  url,
  phone,
  emailed,
  onDismiss,
}: {
  url: string;
  phone: string | null;
  emailed: boolean;
  onDismiss: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const wa = phone
    ? whatsappUrl(phone, `Hi, set your Teegold Interiors password here: ${url}`)
    : null;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <div className="rounded-card mt-6 border border-brand/30 bg-lilac p-5">
      <p className="text-xs tracking-[0.12em] text-brand uppercase">Invite ready</p>
      <p className="mt-2 text-sm text-ink">
        {emailed
          ? 'We emailed them the link. Opening it and setting a password is the confirmation — there is no extra step.'
          : 'Email is not configured on this server, so nothing landed in their inbox. Send the link on WhatsApp or copy it.'}
      </p>
      <p className="rounded-card mt-3 border border-hairline bg-surface px-3 py-2 font-mono text-xs break-all">
        {url}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-card bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-paid underline underline-offset-4"
          >
            Send on WhatsApp
          </a>
        )}
        <button type="button" onClick={onDismiss} className="text-xs text-muted hover:text-ink">
          Done
        </button>
      </div>
    </div>
  );
};

const StaffPage = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('STAFF');
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteEmailed, setInviteEmailed] = useState(false);
  const [invitePhone, setInvitePhone] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingSuspend, setPendingSuspend] = useState<User | null>(null);

  const load = useCallback(async () => {
    try {
      const { users: list } = usersResponseSchema.parse(await apiFetch<unknown>('/api/users'));
      setUsers(list);
      setListError(null);
    } catch (caught) {
      setListError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const showInvite = (inviteUrlValue?: string, emailed?: boolean, phoneValue?: string | null) => {
    setInviteUrl(inviteUrlValue ?? null);
    setInviteEmailed(Boolean(emailed));
    setInvitePhone(phoneValue ?? null);
  };

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setInviting(true);
    setIssues([]);
    setFormError(null);

    try {
      const result = invitedUserResponseSchema.parse(
        await apiPost<unknown>('/api/users/invites', { name, email, phone, role }),
      );

      showInvite(result.inviteUrl, result.emailed, result.user.phone);
      setName('');
      setEmail('');
      setPhone('');
      setRole('STAFF');
      await load();
    } catch (caught) {
      if (isApiRequestError(caught)) {
        setIssues(caught.issues);
        setFormError(caught.issues.length > 0 ? null : caught.message);
      } else {
        setFormError(errorMessage(caught));
      }
    } finally {
      setInviting(false);
    }
  };

  const changeStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
    setBusyId(id);
    setListError(null);

    try {
      const result = invitedUserResponseSchema.parse(
        await apiPatch<unknown>(`/api/users/${id}/status`, { status }),
      );

      showInvite(result.inviteUrl, result.emailed, result.user.phone);
      setPendingSuspend(null);
      await load();
    } catch (caught) {
      setListError(errorMessage(caught));
    } finally {
      setBusyId(null);
    }
  };

  const resend = async (id: string) => {
    setBusyId(id);
    setListError(null);

    try {
      const result = invitedUserResponseSchema.parse(
        await apiPost<unknown>(`/api/users/${id}/invites`),
      );

      showInvite(result.inviteUrl, result.emailed, result.user.phone);
      await load();
    } catch (caught) {
      setListError(errorMessage(caught));
    } finally {
      setBusyId(null);
    }
  };

  if (me?.role !== 'ADMIN') {
    return (
      <main className="px-8 py-10">
        <h1 className="font-serif text-3xl">Staff</h1>
        <p className="mt-3 text-sm text-muted">Only an admin can manage staff accounts.</p>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="font-serif text-3xl">Staff</h1>
        <p className="mt-1 text-sm text-muted">
          You decide who can sign in. We email them an invite; opening it and setting a password is
          the confirmation.
        </p>
      </header>

      <section className="rounded-card mt-8 border border-hairline bg-surface p-6">
        <h2 className="text-xs tracking-[0.12em] text-muted uppercase">Invite someone</h2>

        <form onSubmit={invite} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <label className="block">
            <span className="text-sm">Full name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                issueFor(issues, 'name') ? 'border-cancelled' : 'border-hairline'
              }`}
            />
            {issueFor(issues, 'name') && (
              <span className="mt-1 block text-xs text-cancelled">{issueFor(issues, 'name')}</span>
            )}
          </label>

          <label className="block">
            <span className="text-sm">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                issueFor(issues, 'email') ? 'border-cancelled' : 'border-hairline'
              }`}
            />
            {issueFor(issues, 'email') && (
              <span className="mt-1 block text-xs text-cancelled">{issueFor(issues, 'email')}</span>
            )}
          </label>

          <label className="block">
            <span className="text-sm">WhatsApp (optional)</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0803 000 0000"
              className="rounded-card mt-1 w-full border border-hairline px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>

          <label className="block">
            <span className="text-sm">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              className="rounded-card mt-1 w-full border border-hairline px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={inviting}
            className="rounded-card mt-[1.6rem] h-[2.6rem] bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {inviting ? 'Inviting…' : 'Send invite'}
          </button>
        </form>

        {formError && <p className="mt-4 text-sm text-cancelled">{formError}</p>}
        {inviteUrl && (
          <InviteLink
            url={inviteUrl}
            phone={invitePhone}
            emailed={inviteEmailed}
            onDismiss={() => setInviteUrl(null)}
          />
        )}
      </section>

      <section className="rounded-card mt-6 overflow-x-auto border border-hairline bg-surface">
        <div className="border-b border-hairline px-6 py-4">
          <h2 className="text-xs tracking-[0.12em] text-muted uppercase">Accounts</h2>
        </div>

        {listError && <p className="px-6 py-4 text-sm text-cancelled">{listError}</p>}
        {loading && <TableSkeleton rows={4} columns={5} />}

        {!loading && (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs tracking-[0.12em] text-muted uppercase">
                <th className="px-6 py-3 font-normal">Name</th>
                <th className="px-6 py-3 font-normal">Email</th>
                <th className="px-6 py-3 font-normal">Role</th>
                <th className="px-6 py-3 font-normal">Status</th>
                <th className="px-6 py-3 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => {
                const isMe = row.id === me?.id;
                const busy = busyId === row.id;
                const wa = row.phone
                  ? whatsappUrl(
                      row.phone,
                      `Hi ${row.name.split(' ')[0]}, here is your Teegold Interiors invite.`,
                    )
                  : null;

                return (
                  <tr key={row.id} className="border-t border-hairline">
                    <td className="px-6 py-3">
                      {row.name}
                      {isMe && <span className="ml-2 text-xs text-muted">You</span>}
                    </td>
                    <td className="px-6 py-3 text-muted">{row.email}</td>
                    <td className="px-6 py-3">{row.role === 'ADMIN' ? 'Admin' : 'Staff'}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-card border px-2 py-0.5 text-xs font-medium ${statusChip[row.status]}`}
                      >
                        {statusLabel[row.status]}
                      </span>
                      {row.status === 'PENDING' && (
                        <p className="mt-1 text-xs text-muted">
                          {inviteExpiryLabel(row.inviteExpiresAt)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {isMe ? (
                        <span className="text-xs text-muted">—</span>
                      ) : (
                        <span className="flex items-center justify-end gap-4">
                          {row.status === 'PENDING' && wa && (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-paid underline underline-offset-4"
                            >
                              WhatsApp
                            </a>
                          )}
                          {row.status === 'PENDING' && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void resend(row.id)}
                              className="text-xs text-brand underline underline-offset-4 disabled:opacity-50"
                            >
                              Resend invite
                            </button>
                          )}

                          {row.status === 'SUSPENDED' ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void changeStatus(row.id, 'ACTIVE')}
                              className="text-xs text-brand underline underline-offset-4 disabled:opacity-50"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setPendingSuspend(row)}
                              className="text-xs text-cancelled underline underline-offset-4 disabled:opacity-50"
                            >
                              {row.status === 'PENDING' ? 'Cancel invite' : 'Suspend'}
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {pendingSuspend && (
        <ConfirmDialog
          title={pendingSuspend.status === 'PENDING' ? 'Cancel this invite?' : `Suspend ${pendingSuspend.name}?`}
          body={
            pendingSuspend.status === 'PENDING'
              ? 'The invite link will stop working immediately.'
              : `${pendingSuspend.name} will be signed out on their next click. Their invoices stay in the system.`
          }
          confirmLabel={pendingSuspend.status === 'PENDING' ? 'Cancel invite' : 'Suspend'}
          danger
          busy={busyId === pendingSuspend.id}
          onCancel={() => setPendingSuspend(null)}
          onConfirm={() => void changeStatus(pendingSuspend.id, 'SUSPENDED')}
        />
      )}
    </main>
  );
};

export default StaffPage;
