import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createTeam, deleteTeam, getTeamCountryOptions, getTeams, type TeamCountryOption } from "../../api/adminApi";
import AddTeamForm, { type AddTeamFormValues } from "../teams/AddTeamForm";
import type { Team } from "../../types";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [countryOptions, setCountryOptions] = useState<TeamCountryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [teamsData, countriesData] = await Promise.all([getTeams(), getTeamCountryOptions()]);
        setTeams(teamsData);
        setCountryOptions(countriesData);
      } catch {
        setError("Failed to load teams.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onAddTeam(values: AddTeamFormValues) {
    setAdding(true);
    setError(null);
    try {
      const created = await createTeam({
        name: values.name,
        shortName: values.shortName || undefined,
        crestUrl: values.crestUrl || undefined,
        countryId: values.countryId,
        countryCode: values.countryCode,
      });
      setTeams((curr) => [...curr.filter((item) => item.id !== created.id), created]);
      setShowAddForm(false);
    } catch {
      setError("Failed to create team.");
    } finally {
      setAdding(false);
    }
  }

  async function onDeleteTeam(id: string) {
    if (!window.confirm("Delete this team?")) return;
    setError(null);
    try {
      await deleteTeam(id);
      setTeams((curr) => curr.filter((item) => item.id !== id));
    } catch {
      setError("Failed to delete team.");
    }
  }

  return (
    <section className="panel">
      <h2>Teams</h2>
      <div className="h-row">
        {!showAddForm ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add team
          </button>
        ) : null}
      </div>

      <AddTeamForm
        open={showAddForm}
        disabled={loading}
        submitting={adding}
        countryOptions={countryOptions}
        onSubmit={(values) => void onAddTeam(values)}
        onCancel={() => setShowAddForm(false)}
      />

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>Canonical</th>
            <th>Country</th>
            <th>Locales</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id}>
              <td>{team.canonicalName}</td>
              <td>{team.countryCode}</td>
              <td>{team.localizations.length}</td>
              <td>
                <Link to={`/teams/${team.id}`}>Open</Link>
                {" | "}
                <button type="button" className="ghost" onClick={() => void onDeleteTeam(team.id)}>
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
