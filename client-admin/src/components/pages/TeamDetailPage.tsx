import { useEffect, useLayoutEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLocales, getTeam, updateTeam } from "../../api/adminApi";
import type { ContentLocale, Team } from "../../types";

export default function TeamDetailPage() {
  const { id = "" } = useParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [locales, setLocales] = useState<ContentLocale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    setTeam(null);
    setLocales([]);
    setLoading(true);
    setError(null);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [teamData, localesData] = await Promise.all([getTeam(id), getLocales()]);
        if (cancelled) return;
        setTeam(teamData);
        setLocales(localesData);
      } catch {
        if (cancelled) return;
        setError("Failed to load team details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || (team !== null && team.id !== id)) {
    return <section className="panel">Loading...</section>;
  }
  if (!team) {
    return <section className="panel">{error ?? "Team not found."}</section>;
  }

  async function onSave() {
    if (!team) return;
    setSaving(true);
    setError(null);
    try {
      setTeam(await updateTeam(id, team));
    } catch {
      setError("Failed to save team.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>{team.canonicalName}</h2>
      {error ? <p className="error-text">{error}</p> : null}
      <label>Country</label>
      <input value={team.countryCode} onChange={(e) => setTeam({ ...team, countryCode: e.target.value.toUpperCase() })} />
      <h3>Localizations</h3>
      {locales
        .filter((l) => l.enabled)
        .map((locale) => {
          const row = team.localizations.find((x) => x.locale === locale.code);
          return (
            <div key={locale.code} className="panel">
              <strong>{locale.code}</strong>
              <input
                placeholder="Display"
                value={row?.displayName ?? ""}
                onChange={(e) =>
                  setTeam((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      localizations: [
                        ...prev.localizations.filter((x) => x.locale !== locale.code),
                        { locale: locale.code, displayName: e.target.value, shortName: row?.shortName ?? "" },
                      ],
                    };
                  })
                }
              />
              <input
                placeholder="Short"
                value={row?.shortName ?? ""}
                onChange={(e) =>
                  setTeam((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      localizations: [
                        ...prev.localizations.filter((x) => x.locale !== locale.code),
                        { locale: locale.code, displayName: row?.displayName ?? "", shortName: e.target.value },
                      ],
                    };
                  })
                }
              />
            </div>
          );
        })}
      <button type="button" onClick={() => void onSave()} disabled={saving}>
        {saving ? "Saving..." : "Save team"}
      </button>
    </section>
  );
}
