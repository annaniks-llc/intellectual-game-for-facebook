import { useEffect, useState, type FormEvent } from "react";
import { ATHLETE_POSITION_OPTIONS, type AthleteTeamOption } from "../../api/adminApi";

export type AddAthleteFormValues = {
  firstName: string;
  lastName: string;
  teamId: number;
  positionCode: string;
  active: boolean;
};

type AddAthleteFormProps = {
  open: boolean;
  disabled?: boolean;
  submitting?: boolean;
  teamOptions: AthleteTeamOption[];
  onSubmit: (values: AddAthleteFormValues) => void;
  onCancel: () => void;
};

const emptyForm = (): AddAthleteFormValues => ({
  firstName: "",
  lastName: "",
  teamId: 0,
  positionCode: "FW",
  active: true,
});

export default function AddAthleteForm({
  open,
  disabled = false,
  submitting = false,
  teamOptions,
  onSubmit,
  onCancel,
}: AddAthleteFormProps) {
  const [form, setForm] = useState<AddAthleteFormValues>(emptyForm);
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

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    if (!firstName) {
      setError("First name is required.");
      return;
    }
    if (!lastName) {
      setError("Last name is required.");
      return;
    }
    if (!form.teamId) {
      setError("Team is required.");
      return;
    }
    if (!form.positionCode) {
      setError("Position is required.");
      return;
    }

    onSubmit({
      firstName,
      lastName,
      teamId: form.teamId,
      positionCode: form.positionCode,
      active: form.active,
    });
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <h3>Add athlete</h3>
      <label htmlFor="athlete-first-name">First name</label>
      <input
        id="athlete-first-name"
        type="text"
        placeholder="e.g. Lionel"
        value={form.firstName}
        onChange={(e) => setForm((curr) => ({ ...curr, firstName: e.target.value }))}
        disabled={isBusy}
        autoFocus
      />
      <label htmlFor="athlete-last-name">Last name</label>
      <input
        id="athlete-last-name"
        type="text"
        placeholder="e.g. Messi"
        value={form.lastName}
        onChange={(e) => setForm((curr) => ({ ...curr, lastName: e.target.value }))}
        disabled={isBusy}
      />
      <label htmlFor="athlete-team">Team</label>
      <select
        id="athlete-team"
        value={form.teamId || ""}
        onChange={(e) => setForm((curr) => ({ ...curr, teamId: Number(e.target.value) }))}
        disabled={isBusy || teamOptions.length === 0}
      >
        <option value="">— Select team —</option>
        {teamOptions.map((team) => (
          <option key={team.id} value={team.id}>
            {team.label}
          </option>
        ))}
      </select>
      {teamOptions.length === 0 ? (
        <p className="error-text">Add a team before creating athletes.</p>
      ) : null}
      <label htmlFor="athlete-position">Position</label>
      <select
        id="athlete-position"
        value={form.positionCode}
        onChange={(e) => setForm((curr) => ({ ...curr, positionCode: e.target.value }))}
        disabled={isBusy}
      >
        {ATHLETE_POSITION_OPTIONS.map((position) => (
          <option key={position.code} value={position.code}>
            {position.label} ({position.code})
          </option>
        ))}
      </select>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((curr) => ({ ...curr, active: e.target.checked }))}
          disabled={isBusy}
        />
        Active
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="h-row">
        <button type="submit" disabled={isBusy || teamOptions.length === 0}>
          {submitting ? "Adding..." : "Add athlete"}
        </button>
        <button type="button" className="ghost" onClick={onCancel} disabled={isBusy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
