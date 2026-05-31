import { useEffect, useState } from "react";
import {
  createAthlete,
  deleteAthlete,
  getAthleteTeamOptions,
  getAthletes,
  updateAthlete,
  type AthleteTeamOption,
} from "../../api/adminApi";
import AddAthleteForm, { type AddAthleteFormValues } from "../athletes/AddAthleteForm";
import RowActions from "../common/RowActions";
import type { Athlete } from "../../types";

function athleteFormValues(athlete: Athlete): AddAthleteFormValues {
  return {
    firstName: athlete.canonicalFirstName,
    lastName: athlete.canonicalLastName,
    teamId: Number(athlete.teamId),
    positionCode: athlete.position,
    active: athlete.active,
  };
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [teamOptions, setTeamOptions] = useState<AthleteTeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [athletesData, teamsData] = await Promise.all([getAthletes(), getAthleteTeamOptions()]);
        setAthletes(athletesData);
        setTeamOptions(teamsData);
      } catch {
        setError("Failed to load athletes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formOpen = showAddForm || editingAthlete !== null;

  async function onAddAthlete(values: AddAthleteFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const created = await createAthlete({
        firstName: values.firstName,
        lastName: values.lastName,
        teamId: values.teamId,
        positionCode: values.positionCode,
        active: values.active,
      });
      setAthletes((curr) => [...curr.filter((item) => item.id !== created.id), created]);
      setShowAddForm(false);
    } catch {
      setError("Failed to create athlete.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onEditAthlete(values: AddAthleteFormValues) {
    if (!editingAthlete) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await updateAthlete(editingAthlete.id, {
        firstName: values.firstName,
        lastName: values.lastName,
        teamId: values.teamId,
        positionCode: values.positionCode,
        active: values.active,
      });
      setAthletes((curr) => curr.map((item) => (item.id === editingAthlete.id ? saved : item)));
      setEditingAthlete(null);
    } catch {
      setError("Failed to update athlete.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteAthlete(id: string) {
    if (!window.confirm("Delete this athlete?")) return;
    setError(null);
    try {
      await deleteAthlete(id);
      setAthletes((curr) => curr.filter((item) => item.id !== id));
      if (editingAthlete?.id === id) setEditingAthlete(null);
    } catch {
      setError("Failed to delete athlete.");
    }
  }

  function openEdit(athlete: Athlete) {
    setShowAddForm(false);
    setEditingAthlete(athlete);
  }

  return (
    <section className="panel">
      <h2>Athletes</h2>
      <div className="h-row">
        {!formOpen ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add athlete
          </button>
        ) : null}
      </div>

      {showAddForm ? (
        <AddAthleteForm
          open
          disabled={loading}
          submitting={submitting}
          teamOptions={teamOptions}
          onSubmit={(values) => void onAddAthlete(values)}
          onCancel={() => setShowAddForm(false)}
        />
      ) : null}

      {editingAthlete ? (
        <AddAthleteForm
          key={editingAthlete.id}
          mode="edit"
          open
          disabled={loading}
          submitting={submitting}
          teamOptions={teamOptions}
          initialValues={athleteFormValues(editingAthlete)}
          onSubmit={(values) => void onEditAthlete(values)}
          onCancel={() => setEditingAthlete(null)}
        />
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Team</th>
            <th>Position</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((athlete) => (
            <tr key={athlete.id}>
              <td>
                {athlete.canonicalFirstName} {athlete.canonicalLastName}
              </td>
              <td>{athlete.teamShortName || athlete.teamName || athlete.teamId}</td>
              <td>{athlete.position}</td>
              <td>
                <RowActions
                  onUpdate={() => openEdit(athlete)}
                  onDelete={() => void onDeleteAthlete(athlete.id)}
                  updating={submitting && editingAthlete?.id === athlete.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
