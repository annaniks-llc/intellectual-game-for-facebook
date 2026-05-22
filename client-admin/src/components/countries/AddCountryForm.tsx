import { useEffect, useState, type FormEvent } from "react";

export type AddCountryFormValues = {
  code: string;
  defaultName: string;
  enabledForGenerator: boolean;
};

type AddCountryFormProps = {
  open: boolean;
  disabled?: boolean;
  submitting?: boolean;
  existingCodes: string[];
  onSubmit: (values: AddCountryFormValues) => void;
  onCancel: () => void;
};

const emptyForm = (): AddCountryFormValues => ({
  code: "",
  defaultName: "",
  enabledForGenerator: true,
});

export default function AddCountryForm({
  open,
  disabled = false,
  submitting = false,
  existingCodes,
  onSubmit,
  onCancel,
}: AddCountryFormProps) {
  const [form, setForm] = useState<AddCountryFormValues>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const isBusy = disabled || submitting;

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const code = form.code.trim().toUpperCase();
    const defaultName = form.defaultName.trim();
    if (!code) {
      setError("Country code is required.");
      return;
    }
    if (!/^[A-Z]{2}$/.test(code)) {
      setError("Country code must be a 2-letter ISO code (e.g. AR, US).");
      return;
    }
    if (!defaultName) {
      setError("Default name is required.");
      return;
    }
    if (existingCodes.some((item) => item.toUpperCase() === code)) {
      setError("Country already exists.");
      return;
    }

    onSubmit({ code, defaultName, enabledForGenerator: form.enabledForGenerator });
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <h3>Add country</h3>
      <label htmlFor="country-code">Country code (ISO-2)</label>
      <input
        id="country-code"
        type="text"
        placeholder="e.g. AR"
        maxLength={2}
        value={form.code}
        onChange={(e) => setForm((curr) => ({ ...curr, code: e.target.value.toUpperCase() }))}
        disabled={isBusy}
        autoFocus
      />
      <label htmlFor="country-default-name">Default name</label>
      <input
        id="country-default-name"
        type="text"
        placeholder="e.g. Argentina"
        value={form.defaultName}
        onChange={(e) => setForm((curr) => ({ ...curr, defaultName: e.target.value }))}
        disabled={isBusy}
      />
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.enabledForGenerator}
          onChange={(e) => setForm((curr) => ({ ...curr, enabledForGenerator: e.target.checked }))}
          disabled={isBusy}
        />
        Enabled for generator
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="h-row">
        <button type="submit" disabled={isBusy}>
          {submitting ? "Adding..." : "Add country"}
        </button>
        <button type="button" className="ghost" onClick={onCancel} disabled={isBusy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
