import { useEffect, useMemo, useState } from "react";
import { createCountry, deleteCountry, getCountries, getLocales, updateCountries, updateCountry } from "../../api/adminApi";
import { countryDefaultName } from "../../api/adminContentMappers";
import AddCountryForm, { type AddCountryFormValues } from "../countries/AddCountryForm";
import RowActions from "../common/RowActions";
import type { AdminCountryRow, ContentLocale } from "../../types";

function countryFormValues(row: AdminCountryRow): AddCountryFormValues {
  return {
    code: row.code,
    defaultName: countryDefaultName(row),
    enabledForGenerator: row.enabledForGenerator,
  };
}

function applyCountryFormValues(row: AdminCountryRow, values: AddCountryFormValues): AdminCountryRow {
  const localizations =
    row.localizations.length > 0
      ? row.localizations.map((loc, index) =>
          index === 0 ? { ...loc, displayName: values.defaultName } : loc
        )
      : [{ locale: "en", displayName: values.defaultName }];

  return {
    code: values.code.trim().toUpperCase(),
    enabledForGenerator: values.enabledForGenerator,
    localizations,
  };
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<AdminCountryRow[]>([]);
  const [locales, setLocales] = useState<ContentLocale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCountry, setEditingCountry] = useState<AdminCountryRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
  const formOpen = showAddForm || editingCountry !== null;

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
    setSubmitting(true);
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
      setSubmitting(false);
    }
  }

  async function onEditCountry(values: AddCountryFormValues) {
    if (!editingCountry) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = applyCountryFormValues(editingCountry, values);
      const updated = await updateCountry(editingCountry.code, payload);
      const saved = updated.find((item) => item.code === payload.code) ?? payload;
      setCountries(updated);
      setEditingCountry(null);
    } catch {
      setError("Failed to update country.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteCountry(code: string) {
    if (!window.confirm(`Delete country ${code}?`)) return;
    setError(null);
    try {
      await deleteCountry(code);
      setCountries((curr) => curr.filter((item) => item.code !== code));
      if (editingCountry?.code === code) setEditingCountry(null);
    } catch {
      setError("Failed to delete country.");
    }
  }

  function openEdit(row: AdminCountryRow) {
    setShowAddForm(false);
    setEditingCountry(row);
  }

  return (
    <section className="panel">
      <h2>Countries</h2>
      <div className="h-row">
        {!formOpen ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add country
          </button>
        ) : null}
      </div>

      {showAddForm ? (
        <AddCountryForm
          open
          disabled={loading}
          submitting={submitting}
          existingCodes={countries.map((country) => country.code)}
          onSubmit={(values) => void onAddCountry(values)}
          onCancel={() => setShowAddForm(false)}
        />
      ) : null}

      {editingCountry ? (
        <AddCountryForm
          key={editingCountry.code}
          mode="edit"
          open
          disabled={loading}
          submitting={submitting}
          initialValues={countryFormValues(editingCountry)}
          existingCodes={countries.filter((c) => c.code !== editingCountry.code).map((c) => c.code)}
          onSubmit={(values) => void onEditCountry(values)}
          onCancel={() => setEditingCountry(null)}
        />
      ) : null}

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
                <RowActions
                  onUpdate={() => openEdit(row)}
                  onDelete={() => void onDeleteCountry(row.code)}
                  updating={submitting && editingCountry?.code === row.code}
                />
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
