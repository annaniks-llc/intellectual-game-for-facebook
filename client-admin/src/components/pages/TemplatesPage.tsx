import { useEffect, useState } from "react";
import { createTemplate, deleteTemplate, getTemplates, updateTemplates } from "../../api/adminApi";
import AddTemplateForm, { type AddTemplateFormValues } from "../templates/AddTemplateForm";
import type { Template } from "../../types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        setTemplates(await getTemplates());
      } catch {
        setError("Failed to load templates.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onAddTemplate(values: AddTemplateFormValues) {
    setAdding(true);
    setError(null);
    try {
      const created = await createTemplate(values);
      setTemplates((curr) => [...curr.filter((item) => item.id !== created.id), created]);
      setShowAddForm(false);
    } catch {
      setError("Failed to create template.");
    } finally {
      setAdding(false);
    }
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      setTemplates(await updateTemplates(templates));
    } catch {
      setError("Failed to save templates.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteTemplate(id: string) {
    if (!window.confirm("Delete this template?")) return;
    setError(null);
    try {
      await deleteTemplate(id);
      setTemplates((curr) => curr.filter((item) => item.id !== id));
    } catch {
      setError("Failed to delete template.");
    }
  }

  return (
    <section className="panel">
      <h2>Templates</h2>
      <p>Question templates used to generate quiz content.</p>
      <div className="h-row">
        {!showAddForm ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add template
          </button>
        ) : null}
      </div>

      <AddTemplateForm
        open={showAddForm}
        disabled={loading || adding}
        existingNames={templates.map((template) => template.name)}
        onSubmit={(values) => void onAddTemplate(values)}
        onCancel={() => setShowAddForm(false)}
      />

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Prompt</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template, index) => (
            <tr key={template.id}>
              <td>
                <input
                  value={template.name}
                  onChange={(e) =>
                    setTemplates((curr) => curr.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)))
                  }
                />
              </td>
              <td>
                <input
                  value={template.prompt}
                  onChange={(e) =>
                    setTemplates((curr) => curr.map((item, i) => (i === index ? { ...item, prompt: e.target.value } : item)))
                  }
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={template.active}
                  onChange={(e) =>
                    setTemplates((curr) => curr.map((item, i) => (i === index ? { ...item, active: e.target.checked } : item)))
                  }
                />
              </td>
              <td>
                <button type="button" className="ghost" onClick={() => void onDeleteTemplate(template.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => void onSave()} disabled={saving || loading}>
        {saving ? "Saving..." : "Save templates"}
      </button>
    </section>
  );
}
