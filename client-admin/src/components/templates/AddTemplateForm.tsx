import { useEffect, useState, type FormEvent } from "react";

export type AddTemplateFormValues = {
  name: string;
  prompt: string;
  active: boolean;
};

type AddTemplateFormProps = {
  open: boolean;
  mode?: "add" | "edit";
  initialValues?: AddTemplateFormValues;
  disabled?: boolean;
  submitting?: boolean;
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
  mode = "add",
  initialValues,
  disabled = false,
  submitting = false,
  existingNames,
  onSubmit,
  onCancel,
}: AddTemplateFormProps) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<AddTemplateFormValues>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const isBusy = disabled || submitting;

  useEffect(() => {
    if (open) {
      setForm(isEdit && initialValues ? initialValues : emptyForm());
      setError(null);
    }
  }, [open, isEdit, initialValues]);

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
    if (!isEdit && existingNames.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setError("A template with this name already exists.");
      return;
    }

    onSubmit({ name, prompt, active: form.active });
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <h3>{isEdit ? "Edit template" : "Add template"}</h3>
      <label htmlFor="template-name">Name</label>
      <input
        id="template-name"
        type="text"
        placeholder="e.g. Top Scorer"
        value={form.name}
        onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))}
        disabled={isBusy}
        autoFocus
      />
      <label htmlFor="template-prompt">Prompt</label>
      <input
        id="template-prompt"
        type="text"
        placeholder="e.g. Who is the top scorer for {team}?"
        value={form.prompt}
        onChange={(e) => setForm((curr) => ({ ...curr, prompt: e.target.value }))}
        disabled={isBusy}
      />
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
        <button type="submit" disabled={isBusy}>
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Add template"}
        </button>
        <button type="button" className="ghost" onClick={onCancel} disabled={isBusy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
