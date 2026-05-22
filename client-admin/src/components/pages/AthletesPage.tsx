import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAthlete,
  deleteAthlete,
  getAthleteTeamOptions,
  getAthletes,
  type AthleteTeamOption,
} from "../../api/adminApi";
import AddAthleteForm, { type AddAthleteFormValues } from "../athletes/AddAthleteForm";
import type { Athlete } from "../../types";

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [teamOptions, setTeamOptions] = useState<AthleteTeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

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

  async function onAddAthlete(values: AddAthleteFormValues) {
    setAdding(true);
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
      setAdding(false);
    }
  }

  async function onDeleteAthlete(id: string) {
    if (!window.confirm("Delete this athlete?")) return;
    setError(null);
    try {
      await deleteAthlete(id);
      setAthletes((curr) => curr.filter((item) => item.id !== id));
    } catch {
      setError("Failed to delete athlete.");
    }
  }

  return (
    <section className="panel">
      <h2>Athletes</h2>
      <div className="h-row">
        {!showAddForm ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add athlete
          </button>
        ) : null}
      </div>

      <AddAthleteForm
        open={showAddForm}
        disabled={loading}
        submitting={adding}
        teamOptions={teamOptions}
        onSubmit={(values) => void onAddAthlete(values)}
        onCancel={() => setShowAddForm(false)}
      />

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
              <td>{athlete.teamId}</td>
              <td>{athlete.position}</td>
              <td>
                <Link to={`/athletes/${athlete.id}`}>Open</Link>
                {" | "}
                <button type="button" className="ghost" onClick={() => void onDeleteAthlete(athlete.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
