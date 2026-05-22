import { http } from "./http";
import { makeId, readStorage, writeStorage } from "./storage";
import type { AdminCountryRow, Athlete, AthletePhoto, ContentLocale, Position, Team, Template } from "../types";

const LOCALES_KEY = "locales";
const COUNTRIES_KEY = "countries";
const TEAMS_KEY = "teams";
const ATHLETES_KEY = "athletes";
const TEMPLATES_KEY = "templates";

const defaultTemplates: Template[] = [
  { id: "template_1", name: "Top Scorer", prompt: "Who is the top scorer for {team}?", active: true },
  { id: "template_2", name: "Nationality", prompt: "Which country does {athlete} represent?", active: true },
  
const LEGACY_DEFAULT_TEMPLATE_IDS = new Set(["template_1", "template_2"]);

const LEGACY_DEFAULT_TEMPLATE_NAMES = new Set(["top scorer", "nationality"]);

const defaultPositions: Position[] = [
  { id: "position_gk", code: "GK", label: "Goalkeeper" },
  { id: "position_df", code: "DF", label: "Defender" },
  { id: "position_mf", code: "MF", label: "Midfielder" },
  { id: "position_fw", code: "FW", label: "Forward" },
];

async function withStorageFallback<T>(key: string, request: () => Promise<T>): Promise<T> {
  const fromStorage = readStorage<T>(key);
  if (fromStorage !== null) return fromStorage;
  const data = await request();
  writeStorage(key, data);
  return data;
}

function saveAndReturn<T>(key: string, data: T): T {
  writeStorage(key, data);
  return data;
}

export async function getLocales(): Promise<ContentLocale[]> {
  return withStorageFallback(LOCALES_KEY, async () => {
    const { data } = await http.get<ContentLocale[]>("/locales");
    return data;
  });
}

export async function updateLocales(payload: ContentLocale[]): Promise<ContentLocale[]> {
  const { data } = await http.patch<ContentLocale[]>("/locales", payload);
  return saveAndReturn(LOCALES_KEY, data);
}

export async function getCountries(): Promise<AdminCountryRow[]> {
  return withStorageFallback(COUNTRIES_KEY, async () => {
    const { data } = await http.get<AdminCountryRow[]>("/countries/localizations");
    return data;
  });
}

export async function updateCountries(payload: AdminCountryRow[]): Promise<AdminCountryRow[]> {
  const { data } = await http.patch<AdminCountryRow[]>("/countries/localizations", payload);
  return saveAndReturn(COUNTRIES_KEY, data);
}

export async function createCountry(payload: {
  code: string;
  defaultName: string;
  enabledForGenerator?: boolean;
}): Promise<AdminCountryRow> {
  await http.post("/countries/localizations", {
    code: payload.code,
    default_name: payload.defaultName,
  });

  const created: AdminCountryRow = {
    code: payload.code.trim().toUpperCase(),
    enabledForGenerator: payload.enabledForGenerator ?? true,
    localizations: [],
  };

  const countries = await getCountries();
  saveAndReturn(
    COUNTRIES_KEY,
    [...countries.filter((item) => item.code !== created.code), created].sort((a, b) => a.code.localeCompare(b.code))
  );
  return created;
}

export async function deleteCountry(code: string): Promise<void> {
  await http.delete(`/countries/${code}`);
  const countries = await getCountries();
  saveAndReturn(
    COUNTRIES_KEY,
    countries.filter((item) => item.code !== code)
  );
}

export async function getTeams(): Promise<Team[]> {
  return withStorageFallback(TEAMS_KEY, async () => {
    const { data } = await http.get<Team[]>("/teams");
    return data;
  });
}

export async function getTeam(id: string): Promise<Team> {
  const teams = await getTeams();
  const cached = teams.find((team) => team.id === id);
  if (cached) return cached;
  const { data } = await http.get<Team>(`/teams/${id}`);
  return data;
}

export async function updateTeam(id: string, payload: Team): Promise<Team> {
  const { data } = await http.patch<Team>(`/teams/${id}`, payload);
  const teams = await getTeams();
  saveAndReturn(
    TEAMS_KEY,
    teams.map((team) => (team.id === id ? data : team))
  );
  return data;
}

export type TeamCountryOption = {
  id: number;
  code: string;
  label: string;
};

type CountryApiRow = {
  id: number;
  code: string;
  default_name: string;
};

export async function getTeamCountryOptions(): Promise<TeamCountryOption[]> {
  const { data } = await http.get<CountryApiRow[]>("/countries/localizations");
  return data.map((row) => ({
    id: row.id,
    code: row.code,
    label: row.default_name ? `${row.code} — ${row.default_name}` : row.code,
  }));
}

export async function createTeam(payload: {
  name: string;
  shortName?: string;
  crestUrl?: string;
  countryId?: number | null;
  countryCode?: string;
}): Promise<Team> {
  const { data } = await http.post<{ ok: true; id: number }>("/teams", {
    name: payload.name,
    short_name: payload.shortName?.trim() || undefined,
    crest_url: payload.crestUrl?.trim() || undefined,
    country_id: payload.countryId ?? undefined,
  });

  const created: Team = {
    id: String(data.id),
    canonicalName: payload.name,
    crestUrl: payload.crestUrl?.trim() || undefined,
    countryCode: payload.countryCode ?? "",
    localizations: [],
  };

  const teams = await getTeams();
  saveAndReturn(TEAMS_KEY, [...teams.filter((team) => team.id !== created.id), created]);
  return created;
}

export async function deleteTeam(id: string): Promise<void> {
  await http.delete(`/teams/${id}`);
  const teams = await getTeams();
  saveAndReturn(
    TEAMS_KEY,
    teams.filter((team) => team.id !== id)
  );
}

export async function getAthletes(): Promise<Athlete[]> {
  return withStorageFallback(ATHLETES_KEY, async () => {
    const { data } = await http.get<Athlete[]>("/athletes");
    return data;
  });
}

export async function getAthlete(id: string): Promise<Athlete> {
  const athletes = await getAthletes();
  const cached = athletes.find((athlete) => athlete.id === id);
  if (cached) return cached;
  const { data } = await http.get<Athlete>(`/athletes/${id}`);
  return data;
}

export async function updateAthleteLocalizations(id: string, payload: Athlete["localizations"]) {
  const { data } = await http.patch<Athlete["localizations"]>(`/athletes/${id}/localizations`, payload);
  const athletes = await getAthletes();
  saveAndReturn(
    ATHLETES_KEY,
    athletes.map((athlete) => (athlete.id === id ? { ...athlete, localizations: data } : athlete))
  );
  return data;
}

export type AthleteTeamOption = {
  id: number;
  label: string;
};

type TeamApiRow = {
  id: number;
  name: string;
  country_code?: string | null;
};

export const ATHLETE_POSITION_OPTIONS = [
  { code: "GK", label: "Goalkeeper" },
  { code: "DF", label: "Defender" },
  { code: "MF", label: "Midfielder" },
  { code: "FW", label: "Forward" },
] as const;

export async function getAthleteTeamOptions(): Promise<AthleteTeamOption[]> {
  const { data } = await http.get<TeamApiRow[]>("/teams");
  return data.map((row) => ({
    id: row.id,
    label: row.country_code ? `${row.name} (${row.country_code})` : String(row.name),
  }));
}

export async function createAthlete(payload: {
  firstName: string;
  lastName: string;
  teamId: number;
  positionCode: string;
  active: boolean;
}): Promise<Athlete> {
  const { data } = await http.post<{ ok: true; id: number }>("/athletes", {
    team_id: payload.teamId,
    first_name: payload.firstName,
    last_name: payload.lastName,
    position_code: payload.positionCode,
    is_active: payload.active,
  });

  const created: Athlete = {
    id: String(data.id),
    canonicalFirstName: payload.firstName,
    canonicalLastName: payload.lastName,
    teamId: String(payload.teamId),
    position: payload.positionCode,
    active: payload.active,
    localizations: [],
    photos: [],
  };

  const athletes = await getAthletes();
  saveAndReturn(ATHLETES_KEY, [...athletes.filter((athlete) => athlete.id !== created.id), created]);
  return created;
}

export async function deleteAthlete(id: string): Promise<void> {
  await http.delete(`/athletes/${id}`);
  const athletes = await getAthletes();
  saveAndReturn(
    ATHLETES_KEY,
    athletes.filter((athlete) => athlete.id !== id)
  );
}

export async function getAthletePhotos(id: string): Promise<AthletePhoto[]> {
  const athletes = await getAthletes();
  const cached = athletes.find((athlete) => athlete.id === id)?.photos;
  if (cached) return cached;
  const { data } = await http.get<AthletePhoto[]>(`/athletes/${id}/photos`);
  return data;
}

export async function addAthletePhoto(id: string, imageUrl: string): Promise<AthletePhoto> {
  const { data } = await http.post<AthletePhoto>(`/athletes/${id}/photos`, { imageUrl });
  const athletes = await getAthletes();
  saveAndReturn(
    ATHLETES_KEY,
    athletes.map((athlete) => (athlete.id === id ? { ...athlete, photos: [...athlete.photos, data] } : athlete))
  );
  return data;
}

export async function updateAthletePhotos(id: string, payload: AthletePhoto[]): Promise<AthletePhoto[]> {
  const { data } = await http.patch<AthletePhoto[]>(`/athletes/${id}/photos`, payload);
  const athletes = await getAthletes();
  saveAndReturn(
    ATHLETES_KEY,
    athletes.map((athlete) => (athlete.id === id ? { ...athlete, photos: data } : athlete))
  );
  return data;
}

type PositionLabelRow = {
  id: number;
  position_code: string;
  label: string;
  locale_code: string;
};

export async function getPositions(): Promise<Position[]> {
  const { data } = await http.get<PositionLabelRow[]>("/position-labels");
  return data
    .map((row) => ({
      id: String(row.id),
      code: row.position_code,
      label: row.label,
      localeCode: row.locale_code,
    }))
    .sort((a, b) => a.code.localeCompare(b.code) || a.localeCode.localeCompare(b.localeCode));
}

export async function createPosition(payload: {
  code: string;
  label: string;
  localeCode: string;
}): Promise<Position> {
  const { data } = await http.post<{ ok: true; id: number }>("/position-labels", {
    position_code: payload.code,
    locale_code: payload.localeCode,
    label: payload.label,
  });

  return {
    id: String(data.id),
    code: payload.code.trim().toUpperCase(),
    label: payload.label.trim(),
    localeCode: payload.localeCode,
  };
}

export async function updatePositions(payload: Position[]): Promise<Position[]> {
  for (const position of payload) {
    await http.post("/position-labels", {
      position_code: position.code,
      locale_code: position.localeCode,
      label: position.label,
    });
  }
  return getPositions();
}

function isLegacyDefaultTemplate(template: Template): boolean {
  if (LEGACY_DEFAULT_TEMPLATE_IDS.has(template.id)) return true;
  return LEGACY_DEFAULT_TEMPLATE_NAMES.has(template.name.trim().toLowerCase());
}

function withoutLegacyDefaultTemplates(templates: Template[]): Template[] {
  return templates.filter((template) => !isLegacyDefaultTemplate(template));
}

export async function getTemplates(): Promise<Template[]> {
  const stored = readStorage<Template[]>(TEMPLATES_KEY) ?? [];
  const templates = withoutLegacyDefaultTemplates(stored);
  if (templates.length !== stored.length) {
    writeStorage(TEMPLATES_KEY, templates);
  }
  return templates;
}

export async function createTemplate(payload: Pick<Template, "name" | "prompt" | "active">): Promise<Template> {
  const templates = await getTemplates();
  const created: Template = {
    id: makeId("template"),
    name: payload.name,
    prompt: payload.prompt,
    active: payload.active,
  };
  saveAndReturn(TEMPLATES_KEY, [...templates, created]);
  return created;
}

export async function updateTemplates(payload: Template[]): Promise<Template[]> {
  return saveAndReturn(TEMPLATES_KEY, withoutLegacyDefaultTemplates(payload));
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await getTemplates();
  saveAndReturn(
    TEMPLATES_KEY,
    templates.filter((template) => template.id !== id)
  );
}
