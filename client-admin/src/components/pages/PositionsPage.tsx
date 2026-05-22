import { useEffect, useMemo, useState } from "react";
import { createPosition, deletePosition, getLocales, getPositions, updatePositions } from "../../api/adminApi";
import AddPositionForm, { type AddPositionFormValues, type PositionLocaleOption } from "../positions/AddPositionForm";
import type { ContentLocale, Position } from "../../types";

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
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
        const [positionsData, localesData] = await Promise.all([getPositions(), getLocales()]);
        setPositions(positionsData);
        setLocales(localesData);
      } catch {
        setError("Failed to load positions.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const localeOptions = useMemo<PositionLocaleOption[]>(
    () =>
      locales
        .filter((locale) => locale.enabled)
        .map((locale) => ({ code: locale.code, label: locale.code })),
    [locales]
  );

  const defaultLocaleCode = useMemo(
    () => locales.find((locale) => locale.isDefault && locale.enabled)?.code,
    [locales]
  );

  async function onAddPosition(values: AddPositionFormValues) {
    setAdding(true);
    setError(null);
    try {
      const created = await createPosition(values);
      setPositions((curr) => [...curr, created]);
      setShowAddForm(false);
    } catch {
      setError("Failed to create position.");
    } finally {
      setAdding(false);
    }
  }

  async function onDeletePosition(id: string) {
    if (!window.confirm("Delete this position label?")) return;
    setError(null);
    try {
      await deletePosition(id);
      setPositions((curr) => curr.filter((item) => item.id !== id));
    } catch {
      setError("Failed to delete position.");
    }
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      setPositions(await updatePositions(positions));
    } catch {
      setError("Failed to save positions.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>Positions</h2>
      <p>Position labels are stored per locale.</p>
      <div className="h-row">
        {!showAddForm ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add position
          </button>
        ) : null}
      </div>

      <AddPositionForm
        open={showAddForm}
        disabled={loading}
        submitting={adding}
        defaultLocaleCode={defaultLocaleCode}
        localeOptions={localeOptions}
        existingEntries={positions.map((position) => ({
          code: position.code,
          localeCode: position.localeCode,
        }))}
        onSubmit={(values) => void onAddPosition(values)}
        onCancel={() => setShowAddForm(false)}
      />

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Locale</th>
            <th>Label</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, index) => (
            <tr key={position.id}>
              <td>
                <input
                  value={position.code}
                  onChange={(e) =>
                    setPositions((curr) =>
                      curr.map((item, i) => (i === index ? { ...item, code: e.target.value.toUpperCase() } : item))
                    )
                  }
                />
              </td>
              <td>{position.localeCode}</td>
              <td>
                <input
                  value={position.label}
                  onChange={(e) =>
                    setPositions((curr) => curr.map((item, i) => (i === index ? { ...item, label: e.target.value } : item)))
                  }
                />
              </td>
              <td>
                <button type="button" className="ghost" onClick={() => void onDeletePosition(position.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => void onSave()} disabled={saving || loading}>
        {saving ? "Saving..." : "Save positions"}
      </button>
    </section>
  );
}
