import { useEffect, useMemo, useState } from "react";
import { createPosition, deletePosition, getLocales, getPositions, updatePosition, updatePositions } from "../../api/adminApi";
import AddPositionForm, { type AddPositionFormValues, type PositionLocaleOption } from "../positions/AddPositionForm";
import RowActions from "../common/RowActions";
import type { ContentLocale, Position } from "../../types";

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [locales, setLocales] = useState<ContentLocale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const formOpen = showAddForm || editingPosition !== null;

  async function onAddPosition(values: AddPositionFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const created = await createPosition(values);
      setPositions((curr) => [...curr, created]);
      setShowAddForm(false);
    } catch {
      setError("Failed to create position.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onEditPosition(values: AddPositionFormValues) {
    if (!editingPosition) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Position = {
        ...editingPosition,
        code: values.code.trim().toUpperCase(),
        label: values.label.trim(),
        localeCode: values.localeCode.trim().toLowerCase(),
      };
      const updated = await updatePosition(payload);
      setPositions(updated);
      setEditingPosition(null);
    } catch {
      setError("Failed to update position.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeletePosition(id: string) {
    if (!window.confirm("Delete this position label?")) return;
    setError(null);
    try {
      await deletePosition(id);
      setPositions((curr) => curr.filter((item) => item.id !== id));
      if (editingPosition?.id === id) setEditingPosition(null);
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

  function openEdit(position: Position) {
    setShowAddForm(false);
    setEditingPosition(position);
  }

  return (
    <section className="panel">
      <h2>Positions</h2>
      <p>Position labels are stored per locale.</p>
      <div className="h-row">
        {!formOpen ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add position
          </button>
        ) : null}
      </div>

      {showAddForm ? (
        <AddPositionForm
          open
          disabled={loading}
          submitting={submitting}
          defaultLocaleCode={defaultLocaleCode}
          localeOptions={localeOptions}
          existingEntries={positions.map((position) => ({
            code: position.code,
            localeCode: position.localeCode,
          }))}
          onSubmit={(values) => void onAddPosition(values)}
          onCancel={() => setShowAddForm(false)}
        />
      ) : null}

      {editingPosition ? (
        <AddPositionForm
          key={editingPosition.id}
          mode="edit"
          open
          disabled={loading}
          submitting={submitting}
          defaultLocaleCode={editingPosition.localeCode}
          localeOptions={localeOptions}
          initialValues={{
            code: editingPosition.code,
            label: editingPosition.label,
            localeCode: editingPosition.localeCode,
          }}
          existingEntries={positions
            .filter((p) => p.id !== editingPosition.id)
            .map((position) => ({
              code: position.code,
              localeCode: position.localeCode,
            }))}
          onSubmit={(values) => void onEditPosition(values)}
          onCancel={() => setEditingPosition(null)}
        />
      ) : null}

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
                <RowActions
                  onUpdate={() => openEdit(position)}
                  onDelete={() => void onDeletePosition(position.id)}
                  updating={submitting && editingPosition?.id === position.id}
                />
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
