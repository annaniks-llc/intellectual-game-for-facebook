import { useEffect, useState } from "react";
import {
  createTeam,
  deleteTeam,
  getTeamCountryOptions,
  getTeams,
  updateTeam,
  type TeamCountryOption,
} from "../../api/adminApi";
import AddTeamForm, { type AddTeamFormValues } from "../teams/AddTeamForm";
import RowActions from "../common/RowActions";
import type { Team } from "../../types";

function teamFormValues(team: Team, countryOptions: TeamCountryOption[]): AddTeamFormValues {
  const country = countryOptions.find((item) => item.code === team.countryCode);
  const defaultLocale = team.localizations[0];
  return {
    name: team.canonicalName,
    shortName: defaultLocale?.shortName ?? "",
    crestUrl: team.crestUrl ?? "",
    countryId: country?.id ?? null,
    countryCode: team.countryCode,
  };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [countryOptions, setCountryOptions] = useState<TeamCountryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const formOpen = showAddForm || editingTeam !== null;

  async function onAddTeam(values: AddTeamFormValues) {
    setSubmitting(true);
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
      setSubmitting(false);
    }
  }

  async function onEditTeam(values: AddTeamFormValues) {
    if (!editingTeam) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated: Team = {
        ...editingTeam,
        canonicalName: values.name,
        crestUrl: values.crestUrl || undefined,
        countryCode: values.countryCode,
      };
      const saved = await updateTeam(editingTeam.id, updated);
      setTeams((curr) => curr.map((item) => (item.id === editingTeam.id ? saved : item)));
      setEditingTeam(null);
    } catch {
      setError("Failed to update team.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteTeam(id: string) {
    if (!window.confirm("Delete this team?")) return;
    setError(null);
    try {
      await deleteTeam(id);
      setTeams((curr) => curr.filter((item) => item.id !== id));
      if (editingTeam?.id === id) setEditingTeam(null);
    } catch {
      setError("Failed to delete team.");
    }
  }

  function openEdit(team: Team) {
    setShowAddForm(false);
    setEditingTeam(team);
  }

  return (
    <section className="panel">
      <h2>Teams</h2>
      <div className="h-row">
        {!formOpen ? (
          <button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            Add team
          </button>
        ) : null}
      </div>

      {showAddForm ? (
        <AddTeamForm
          open
          disabled={loading}
          submitting={submitting}
          countryOptions={countryOptions}
          onSubmit={(values) => void onAddTeam(values)}
          onCancel={() => setShowAddForm(false)}
        />
      ) : null}

      {editingTeam ? (
        <AddTeamForm
          key={editingTeam.id}
          mode="edit"
          open
          disabled={loading}
          submitting={submitting}
          countryOptions={countryOptions}
          initialValues={teamFormValues(editingTeam, countryOptions)}
          onSubmit={(values) => void onEditTeam(values)}
          onCancel={() => setEditingTeam(null)}
        />
      ) : null}

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
                <RowActions
                  onUpdate={() => openEdit(team)}
                  onDelete={() => void onDeleteTeam(team.id)}
                  updating={submitting && editingTeam?.id === team.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
