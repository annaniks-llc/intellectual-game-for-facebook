import { useEffect, useState, type FormEvent } from "react";
import type { TeamCountryOption } from "../../api/adminApi";

export type AddTeamFormValues = {
  name: string;
  shortName: string;
  crestUrl: string;
  countryId: number | null;
  countryCode: string;
};

type AddTeamFormProps = {
  open: boolean;
  disabled?: boolean;
  submitting?: boolean;
  countryOptions: TeamCountryOption[];
  onSubmit: (values: AddTeamFormValues) => void;
  onCancel: () => void;
};

const emptyForm = (): AddTeamFormValues => ({
  name: "",
  shortName: "",
  crestUrl: "",
  countryId: null,
  countryCode: "",
});

export default function AddTeamForm({
  open,
  disabled = false,
  submitting = false,
  countryOptions,
  onSubmit,
  onCancel,
}: AddTeamFormProps) {
  const [form, setForm] = useState<AddTeamFormValues>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const isBusy = disabled || submitting;

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function handleCountryChange(countryIdValue: string) {
    if (!countryIdValue) {
      setForm((curr) => ({ ...curr, countryId: null, countryCode: "" }));
      return;
    }
    const id = Number(countryIdValue);
    const country = countryOptions.find((item) => item.id === id);
    setForm((curr) => ({
      ...curr,
      countryId: id,
      countryCode: country?.code ?? "",
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const name = form.name.trim();
    if (!name) {
      setError("Team name is required.");
      return;
    }

    onSubmit({
      name,
      shortName: form.shortName.trim(),
      crestUrl: form.crestUrl.trim(),
      countryId: form.countryId,
      countryCode: form.countryCode,
    });
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <h3>Add team</h3>
      <label htmlFor="team-name">Name</label>
      <input
        id="team-name"
        type="text"
        placeholder="e.g. Manchester United"
        value={form.name}
        onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))}
        disabled={isBusy}
        autoFocus
      />
      <label htmlFor="team-short-name">Short name (optional)</label>
      <input
        id="team-short-name"
        type="text"
        placeholder="e.g. Man Utd"
        value={form.shortName}
        onChange={(e) => setForm((curr) => ({ ...curr, shortName: e.target.value }))}
        disabled={isBusy}
      />
      <label htmlFor="team-crest-url">Crest URL (optional)</label>
      <input
        id="team-crest-url"
        type="url"
        placeholder="https://..."
        value={form.crestUrl}
        onChange={(e) => setForm((curr) => ({ ...curr, crestUrl: e.target.value }))}
        disabled={isBusy}
      />
      <label htmlFor="team-country">Country (optional)</label>
      <select
        id="team-country"
        value={form.countryId ?? ""}
        onChange={(e) => handleCountryChange(e.target.value)}
        disabled={isBusy}
      >
        <option value="">— No country —</option>
        {countryOptions.map((country) => (
          <option key={country.id} value={country.id}>
            {country.label}
          </option>
        ))}
      </select>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="h-row">
        <button type="submit" disabled={isBusy}>
          {submitting ? "Adding..." : "Add team"}
        </button>
        <button type="button" className="ghost" onClick={onCancel} disabled={isBusy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
