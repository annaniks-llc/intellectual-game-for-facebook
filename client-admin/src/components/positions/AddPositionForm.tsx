import { useEffect, useState, type FormEvent } from "react";

export type PositionLocaleOption = {
  code: string;
  label: string;
};

export type AddPositionFormValues = {
  code: string;
  label: string;
  localeCode: string;
};

type ExistingPositionEntry = {
  code: string;
  localeCode: string;
};

type AddPositionFormProps = {
  open: boolean;
  disabled?: boolean;
  submitting?: boolean;
  defaultLocaleCode?: string;
  localeOptions: PositionLocaleOption[];
  existingEntries: ExistingPositionEntry[];
  onSubmit: (values: AddPositionFormValues) => void;
  onCancel: () => void;
};

const emptyForm = (defaultLocaleCode: string): AddPositionFormValues => ({
  code: "",
  label: "",
  localeCode: defaultLocaleCode,
});

export default function AddPositionForm({
  open,
  disabled = false,
  submitting = false,
  defaultLocaleCode: preferredLocaleCode,
  localeOptions,
  existingEntries,
  onSubmit,
  onCancel,
}: AddPositionFormProps) {
  const initialLocaleCode =
    preferredLocaleCode && localeOptions.some((l) => l.code === preferredLocaleCode)
      ? preferredLocaleCode
      : (localeOptions[0]?.code ?? "");
  const [form, setForm] = useState<AddPositionFormValues>(() => emptyForm(initialLocaleCode));
  const [error, setError] = useState<string | null>(null);
  const isBusy = disabled || submitting;

  useEffect(() => {
    if (open) {
      setForm(emptyForm(initialLocaleCode));
      setError(null);
    }
  }, [open, initialLocaleCode]);

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const code = form.code.trim().toUpperCase();
    const label = form.label.trim();
    const localeCode = form.localeCode.trim().toLowerCase();

    if (!code) {
      setError("Position code is required.");
      return;
    }
    if (!label) {
      setError("Label is required.");
      return;
    }
    if (!localeCode) {
      setError("Locale is required.");
      return;
    }
    if (
      existingEntries.some(
        (entry) => entry.code.toUpperCase() === code && entry.localeCode.toLowerCase() === localeCode
      )
    ) {
      setError("This position code already exists for the selected locale.");
      return;
    }

    onSubmit({ code, label, localeCode });
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <h3>Add position</h3>
      <label htmlFor="position-code">Code</label>
      <input
        id="position-code"
        type="text"
        placeholder="e.g. GK, DF, MF, FW"
        value={form.code}
        onChange={(e) => setForm((curr) => ({ ...curr, code: e.target.value.toUpperCase() }))}
        disabled={isBusy}
        autoFocus
      />
      <label htmlFor="position-label">Label</label>
      <input
        id="position-label"
        type="text"
        placeholder="e.g. Goalkeeper"
        value={form.label}
        onChange={(e) => setForm((curr) => ({ ...curr, label: e.target.value }))}
        disabled={isBusy}
      />
      <label htmlFor="position-locale">Locale</label>
      <select
        id="position-locale"
        value={form.localeCode}
        onChange={(e) => setForm((curr) => ({ ...curr, localeCode: e.target.value }))}
        disabled={isBusy || localeOptions.length === 0}
      >
        {localeOptions.length === 0 ? <option value="">— No locales —</option> : null}
        {localeOptions.map((locale) => (
          <option key={locale.code} value={locale.code}>
            {locale.label}
          </option>
        ))}
      </select>
      {localeOptions.length === 0 ? (
        <p className="error-text">Add and enable a locale before creating positions.</p>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
      <div className="h-row">
        <button type="submit" disabled={isBusy || localeOptions.length === 0}>
          {submitting ? "Adding..." : "Add position"}
        </button>
        <button type="button" className="ghost" onClick={onCancel} disabled={isBusy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
