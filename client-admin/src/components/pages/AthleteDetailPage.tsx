import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addAthletePhoto,
  getAthlete,
  getAthletePhotos,
  getLocales,
  updateAthleteLocalizations,
  updateAthletePhotos,
} from "../../api/adminApi";
import LocaleCoverageBadge from "../common/LocaleCoverageBadge";
import type { Athlete, AthletePhoto, ContentLocale } from "../../types";

type Tab = "summary" | "localizations" | "photos";

export default function AthleteDetailPage() {
  const { id = "" } = useParams();
  const [tab, setTab] = useState<Tab>("summary");
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [locales, setLocales] = useState<ContentLocale[]>([]);
  const [photos, setPhotos] = useState<AthletePhoto[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    setAthlete(null);
    setLocales([]);
    setPhotos([]);
    setNewUrl("");
    setTab("summary");
    setLoading(true);
    setError(null);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [athleteData, localesData, photoData] = await Promise.all([
          getAthlete(id),
          getLocales(),
          getAthletePhotos(id),
        ]);
        if (cancelled) return;
        setAthlete(athleteData);
        setLocales(localesData);
        setPhotos(photoData);
      } catch {
        if (cancelled) return;
        setError("Failed to load athlete details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const completed = useMemo(
    () =>
      athlete?.localizations
        .filter((l) => l.givenName.trim() && l.familyName.trim())
        .map((l) => l.locale) ?? [],
    [athlete]
  );

  if (loading || (athlete !== null && athlete.id !== id)) {
    return <section className="panel">Loading...</section>;
  }
  if (!athlete) {
    return <section className="panel">{error ?? "Athlete not found."}</section>;
  }

  return (
    <section className="panel">
      <h2>
        {athlete.canonicalFirstName} {athlete.canonicalLastName}
      </h2>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="h-row">
        <button type="button" className={tab === "summary" ? "secondary" : "ghost"} onClick={() => setTab("summary")}>
          Summary
        </button>
        <button
          type="button"
          className={tab === "localizations" ? "secondary" : "ghost"}
          onClick={() => setTab("localizations")}
        >
          Localizations
        </button>
        <button type="button" className={tab === "photos" ? "secondary" : "ghost"} onClick={() => setTab("photos")}>
          Photos
        </button>
      </div>

      {tab === "summary" ? (
        <div className="panel">
          <p>Team: {athlete.teamId}</p>
          <p>Position: {athlete.position}</p>
          <p>Active: {athlete.active ? "Yes" : "No"}</p>
          <LocaleCoverageBadge locales={locales} completedCodes={completed} />
        </div>
      ) : null}

      {tab === "localizations" ? (
        <div className="panel">
          {locales
            .filter((l) => l.enabled)
            .map((locale) => {
              const row = athlete.localizations.find((x) => x.locale === locale.code);
              return (
                <div key={locale.code} className="panel">
                  <strong>{locale.code}</strong>
                  <input
                    placeholder="Given name"
                    value={row?.givenName ?? ""}
                    onChange={(e) =>
                      setAthlete((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          localizations: [
                            ...prev.localizations.filter((x) => x.locale !== locale.code),
                            { locale: locale.code, givenName: e.target.value, familyName: row?.familyName ?? "" },
                          ],
                        };
                      })
                    }
                  />
                  <input
                    placeholder="Family name"
                    value={row?.familyName ?? ""}
                    onChange={(e) =>
                      setAthlete((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          localizations: [
                            ...prev.localizations.filter((x) => x.locale !== locale.code),
                            { locale: locale.code, givenName: row?.givenName ?? "", familyName: e.target.value },
                          ],
                        };
                      })
                    }
                  />
                </div>
              );
            })}
          <button
            type="button"
            onClick={async () => {
              setSaving(true);
              setError(null);
              try {
                const localizations = await updateAthleteLocalizations(id, athlete.localizations);
                setAthlete({ ...athlete, localizations });
              } catch {
                setError("Failed to save athlete localizations.");
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save localizations"}
          </button>
        </div>
      ) : null}

      {tab === "photos" ? (
        <div className="panel">
          <div className="h-row">
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Photo URL" />
            <button
              type="button"
              onClick={async () => {
                if (!newUrl.trim()) return;
                setError(null);
                try {
                  const photo = await addAthletePhoto(id, newUrl);
                  setPhotos((curr) => [...curr, photo]);
                  setNewUrl("");
                } catch {
                  setError("Failed to add photo.");
                }
              }}
            >
              Add
            </button>
          </div>
          <div className="photo-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="photo-card">
                <img src={photo.imageUrl} alt="Athlete" />
                <div className="meta h-row">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setPhotos((curr) => curr.map((p) => ({ ...p, isPrimary: p.id === photo.id })))}
                  >
                    {photo.isPrimary ? "Primary" : "Set primary"}
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setPhotos((curr) => curr.filter((p) => p.id !== photo.id))}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={async () => {
              setSaving(true);
              setError(null);
              try {
                setPhotos(await updateAthletePhotos(id, photos));
              } catch {
                setError("Failed to save photos.");
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save photos"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
