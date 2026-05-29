import { useEffect, useState } from "react";
import { createLocale, deleteLocale, getLocales, updateLocales } from "../../api/adminApi";
import AddLocaleForm, { type AddLocaleFormValues } from "../locales/AddLocaleForm";
import type { ContentLocale } from "../../types";

export default function LocalesPage() {
  const [locales, setLocales] = useState<ContentLocale[]>([]);
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
        setLocales(await getLocales());
      } catch {
        setError("Failed to load locales.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      setLocales(await updateLocales(locales));
    } catch {
      setError("Failed to save locales.");
    } finally {
      setSaving(false);
    }
  }

  async function onAddLocale(values: AddLocaleFormValues) {
    setAdding(true);
    setError(null);
    try {
      const isDefault = values.isDefault || locales.length === 0;
      const created = await createLocale({
        code: values.code,
        enabled: values.enabled,
        isDefault,
      });
      setLocales((curr) => {
        const without = curr.filter((item) => item.code !== created.code);
        if (!created.isDefault) return [...without, created];
        return [...without.map((item) => ({ ...item, isDefault: false })), created];
      });
      setShowAddForm(false);
    } catch {
      setError("Failed to create locale.");
    } finally {
      setAdding(false);
    }
  }

  async function onDeleteLocale(code: string) {
    if (!window.confirm(`Delete locale ${code}?`)) return;
    setError(null);
    try {
      await deleteLocale(code);
      setLocales((curr) => curr.filter((item) => item.code !== code));
    } catch {
      setError("Failed to delete locale.");
    }
  }

  return (
    <section className="panel">
      <h2>Content Locales</h2>
      <p>Manage enabled locales used in generated quiz content.</p>
      <div className="h-row">
        {!showAddForm ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add locale
          </button>
        ) : null}
      </div>

      <AddLocaleForm
        open={showAddForm}
        disabled={loading || adding}
        isFirstLocale={locales.length === 0}
        existingCodes={locales.map((locale) => locale.code)}
        onSubmit={(values) => void onAddLocale(values)}
        onCancel={() => setShowAddForm(false)}
      />

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Enabled</th>
            <th>Default</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locales.map((locale, index) => (
            <tr key={locale.code}>
              <td>{locale.code}</td>
              <td>
                <input
                  type="checkbox"
                  checked={locale.enabled}
                  onChange={(e) =>
                    setLocales((curr) => curr.map((l, i) => (i === index ? { ...l, enabled: e.target.checked } : l)))
                  }
                />
              </td>
              <td>
                <input
                  type="radio"
                  checked={locale.isDefault}
                  onChange={() =>
                    setLocales((curr) => curr.map((l, i) => ({ ...l, isDefault: i === index })))
                  }
                />
              </td>
              <td>
                <button type="button" className="ghost" onClick={() => void onDeleteLocale(locale.code)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => void onSave()} disabled={saving || loading}>
        {saving ? "Saving..." : "Save locales"}
      </button>
    </section>
  );
}
