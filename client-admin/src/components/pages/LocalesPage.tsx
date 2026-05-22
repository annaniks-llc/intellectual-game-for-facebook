import { useEffect, useState } from "react";
import { getLocales, updateLocales } from "../../api/adminApi";
import AddLocaleForm, { type AddLocaleFormValues } from "../locales/AddLocaleForm";
import type { ContentLocale } from "../../types";

export default function LocalesPage() {
  const [locales, setLocales] = useState<ContentLocale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

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

  function onAddLocale(values: AddLocaleFormValues) {
    setLocales((curr) => {
      const isDefault = values.isDefault || curr.length === 0;
      const next: ContentLocale = {
        code: values.code,
        enabled: values.enabled,
        isDefault,
      };
      if (!isDefault) return [...curr, next];
      return [...curr.map((l) => ({ ...l, isDefault: false })), next];
    });
    setShowAddForm(false);
  }

  function onDeleteLocale(code: string) {
    setLocales((curr) => curr.filter((item) => item.code !== code));
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
        disabled={loading}
        isFirstLocale={locales.length === 0}
        existingCodes={locales.map((locale) => locale.code)}
        onSubmit={onAddLocale}
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
                <button type="button" className="ghost" onClick={() => onDeleteLocale(locale.code)}>
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
