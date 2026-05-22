import { useEffect, useState, type FormEvent } from "react";

export type AddLocaleFormValues = {
  code: string;
  enabled: boolean;
  isDefault: boolean;
};

type AddLocaleFormProps = {
  open: boolean;
  disabled?: boolean;
  isFirstLocale: boolean;
  existingCodes: string[];
  onSubmit: (values: AddLocaleFormValues) => void;
  onCancel: () => void;
};

const emptyForm = (isFirstLocale: boolean): AddLocaleFormValues => ({
  code: "",
  enabled: true,
  isDefault: isFirstLocale,
});

export default function AddLocaleForm({
  open,
  disabled = false,
  isFirstLocale,
  existingCodes,
  onSubmit,
  onCancel,
}: AddLocaleFormProps) {
  const [form, setForm] = useState<AddLocaleFormValues>(() => emptyForm(isFirstLocale));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(emptyForm(isFirstLocale));
      setError(null);
    }
  }, [open, isFirstLocale]);

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const code = form.code.trim();
    if (!code) {
      setError("Locale code is required.");
      return;
    }
    if (existingCodes.some((item) => item.toLowerCase() === code.toLowerCase())) {
      setError("Locale already exists.");
      return;
    }

    onSubmit({
      code,
      enabled: form.enabled,
      isDefault: form.isDefault || isFirstLocale,
    });
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <h3>Add locale</h3>
      <label htmlFor="locale-code">Locale code (BCP-47)</label>
      <input
        id="locale-code"
        type="text"
        placeholder="e.g. en or hy-AM"
        value={form.code}
        onChange={(e) => setForm((curr) => ({ ...curr, code: e.target.value }))}
        disabled={disabled}
        autoFocus
      />
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((curr) => ({ ...curr, enabled: e.target.checked }))}
          disabled={disabled}
        />
        Enabled
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((curr) => ({ ...curr, isDefault: e.target.checked }))}
          disabled={disabled || isFirstLocale}
        />
        Default locale
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="h-row">
        <button type="submit" disabled={disabled}>
          Add locale
        </button>
        <button type="button" className="ghost" onClick={onCancel} disabled={disabled}>
          Cancel
        </button>
      </div>
    </form>
  );
}
