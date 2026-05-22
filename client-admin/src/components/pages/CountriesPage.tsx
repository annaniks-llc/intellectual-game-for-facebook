import { useEffect, useMemo, useState } from "react";
import { createCountry, deleteCountry, getCountries, getLocales, updateCountries } from "../../api/adminApi";
import AddCountryForm, { type AddCountryFormValues } from "../countries/AddCountryForm";
import type { AdminCountryRow, ContentLocale } from "../../types";

export default function CountriesPage() {
  const [countries, setCountries] = useState<AdminCountryRow[]>([]);
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
        const [countriesData, localesData] = await Promise.all([getCountries(), getLocales()]);
        setCountries(countriesData);
        setLocales(localesData);
      } catch {
        setError("Failed to load countries.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const enabledLocales = useMemo(() => locales.filter((l) => l.enabled), [locales]);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      setCountries(await updateCountries(countries));
    } catch {
      setError("Failed to save countries.");
    } finally {
      setSaving(false);
    }
  }

  async function onAddCountry(values: AddCountryFormValues) {
    setAdding(true);
    setError(null);
    try {
      const created = await createCountry({
        code: values.code,
        defaultName: values.defaultName,
        enabledForGenerator: values.enabledForGenerator,
      });
      setCountries((curr) => [...curr.filter((item) => item.code !== created.code), created]);
      setShowAddForm(false);
    } catch {
      setError("Failed to create country.");
    } finally {
      setAdding(false);
    }
  }

  async function onDeleteCountry(code: string) {
    if (!window.confirm(`Delete country ${code}?`)) return;
    setError(null);
    try {
      await deleteCountry(code);
      setCountries((curr) => curr.filter((item) => item.code !== code));
    } catch {
      setError("Failed to delete country.");
    }
  }

  return (
    <section className="panel">
      <h2>Countries</h2>
      <div className="h-row">
        {!showAddForm ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add country
          </button>
        ) : null}
      </div>

      <AddCountryForm
        open={showAddForm}
        disabled={loading}
        submitting={adding}
        existingCodes={countries.map((country) => country.code)}
        onSubmit={(values) => void onAddCountry(values)}
        onCancel={() => setShowAddForm(false)}
      />

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Enabled</th>
            {enabledLocales.map((l) => (
              <th key={l.code}>{l.code}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {countries.map((row, rowIndex) => (
            <tr key={row.code}>
              <td>{row.code}</td>
              <td>
                <input
                  type="checkbox"
                  checked={row.enabledForGenerator}
                  onChange={(e) =>
                    setCountries((curr) =>
                      curr.map((r, i) => (i === rowIndex ? { ...r, enabledForGenerator: e.target.checked } : r))
                    )
                  }
                />
              </td>
              {enabledLocales.map((locale) => (
                <td key={locale.code}>
                  <input
                    value={row.localizations.find((l) => l.locale === locale.code)?.displayName ?? ""}
                    onChange={(e) =>
                      setCountries((curr) =>
                        curr.map((r, i) =>
                          i !== rowIndex
                            ? r
                            : {
                                ...r,
                                localizations: [
                                  ...r.localizations.filter((x) => x.locale !== locale.code),
                                  { locale: locale.code, displayName: e.target.value },
                                ],
                              }
                        )
                      )
                    }
                  />
                </td>
              ))}
              <td>
                <button type="button" className="ghost" onClick={() => void onDeleteCountry(row.code)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => void onSave()} disabled={saving || loading}>
        {saving ? "Saving..." : "Save countries"}
      </button>
    </section>
  );
}
