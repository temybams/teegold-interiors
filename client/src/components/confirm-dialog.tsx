type ConfirmDialogProps = {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog = ({
  title,
  body,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="rounded-card w-full max-w-sm border border-hairline bg-surface p-6 shadow-lg"
    >
      <h2 id="confirm-title" className="font-serif text-2xl">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <div className="mt-6 flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="text-sm text-muted hover:text-ink">
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className={`rounded-card px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
            danger ? 'bg-cancelled hover:bg-cancelled/90' : 'bg-brand hover:bg-brand-dark'
          }`}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
