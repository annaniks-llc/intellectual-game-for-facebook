import { useEffect, useState, type FormEvent } from "react";

export type AddTemplateFormValues = {
  name: string;
  prompt: string;
  active: boolean;
};

type AddTemplateFormProps = {
  open: boolean;
  disabled?: boolean;
  existingNames: string[];
  onSubmit: (values: AddTemplateFormValues) => void;
  onCancel: () => void;
};

const emptyForm = (): AddTemplateFormValues => ({
  name: "",
  prompt: "",
  active: true,
});

export default function AddTemplateForm({
  open,
  disabled = false,
  existingNames,
  onSubmit,
  onCancel,
}: AddTemplateFormProps) {
  const [form, setForm] = useState<AddTemplateFormValues>(emptyForm);
  const [error, setError] = useState<string | null>(null);

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

    const name = form.name.trim();
    const prompt = form.prompt.trim();
    if (!name) {
      setError("Template name is required.");
      return;
    }
    if (!prompt) {
      setError("Template prompt is required.");
      return;
    }
    if (existingNames.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setError("A template with this name already exists.");
      return;
    }

    onSubmit({ name, prompt, active: form.active });
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <h3>Add template</h3>
      <label htmlFor="template-name">Name</label>
      <input
        id="template-name"
        type="text"
        placeholder="e.g. Top Scorer"
        value={form.name}
        onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))}
        disabled={disabled}
        autoFocus
      />
      <label htmlFor="template-prompt">Prompt</label>
      <input
        id="template-prompt"
        type="text"
        placeholder="e.g. Who is the top scorer for {team}?"
        value={form.prompt}
        onChange={(e) => setForm((curr) => ({ ...curr, prompt: e.target.value }))}
        disabled={disabled}
      />
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((curr) => ({ ...curr, active: e.target.checked }))}
          disabled={disabled}
        />
        Active
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="h-row">
        <button type="submit" disabled={disabled}>
          Add template
        </button>
        <button type="button" className="ghost" onClick={onCancel} disabled={disabled}>
          Cancel
        </button>
      </div>
    </form>
  );
}
