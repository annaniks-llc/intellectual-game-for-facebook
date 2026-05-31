import { useEffect, useState } from "react";
import { createTemplate, deleteTemplate, getTemplates, updateTemplates } from "../../api/adminApi";
import AddTemplateForm, { type AddTemplateFormValues } from "../templates/AddTemplateForm";
import RowActions from "../common/RowActions";
import type { Template } from "../../types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const formOpen = showAddForm || editingTemplate !== null;

  async function onAddTemplate(values: AddTemplateFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const created = await createTemplate(values);
      setTemplates((curr) => [...curr.filter((item) => item.id !== created.id), created]);
      setShowAddForm(false);
    } catch {
      setError("Failed to create template.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onEditTemplate(values: AddTemplateFormValues) {
    if (!editingTemplate) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Template = {
        ...editingTemplate,
        name: values.name.trim(),
        prompt: values.prompt.trim(),
        active: values.active,
      };
      const updated = await updateTemplates([payload]);
      const saved = updated.find((item) => item.id === editingTemplate.id) ?? payload;
      setTemplates((curr) => curr.map((item) => (item.id === editingTemplate.id ? saved : item)));
      setEditingTemplate(null);
    } catch {
      setError("Failed to update template.");
    } finally {
      setSubmitting(false);
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
      if (editingTemplate?.id === id) setEditingTemplate(null);
    } catch {
      setError("Failed to delete template.");
    }
  }

  function openEdit(template: Template) {
    setShowAddForm(false);
    setEditingTemplate(template);
  }

  return (
    <section className="panel">
      <h2>Templates</h2>
      <p>Question templates used to generate quiz content.</p>
      <div className="h-row">
        {!formOpen ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add template
          </button>
        ) : null}
      </div>

      {showAddForm ? (
        <AddTemplateForm
          open
          disabled={loading}
          submitting={submitting}
          existingNames={templates.map((template) => template.name)}
          onSubmit={(values) => void onAddTemplate(values)}
          onCancel={() => setShowAddForm(false)}
        />
      ) : null}

      {editingTemplate ? (
        <AddTemplateForm
          key={editingTemplate.id}
          mode="edit"
          open
          disabled={loading}
          submitting={submitting}
          initialValues={{
            name: editingTemplate.name,
            prompt: editingTemplate.prompt,
            active: editingTemplate.active,
          }}
          existingNames={templates.filter((t) => t.id !== editingTemplate.id).map((t) => t.name)}
          onSubmit={(values) => void onEditTemplate(values)}
          onCancel={() => setEditingTemplate(null)}
        />
      ) : null}

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
                <RowActions
                  onUpdate={() => openEdit(template)}
                  onDelete={() => void onDeleteTemplate(template.id)}
                  updating={submitting && editingTemplate?.id === template.id}
                />
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
