import { http } from "./http";
import { makeId, readStorage, writeStorage } from "./storage";
import type { AdminCountryRow, Athlete, AthletePhoto, ContentLocale, Position, Team, Template } from "../types";

const LOCALES_KEY = "locales";
const COUNTRIES_KEY = "countries";
const TEAMS_KEY = "teams";
const ATHLETES_KEY = "athletes";
const POSITIONS_KEY = "positions";
const TEMPLATES_KEY = "templates";

const defaultPositions: Position[] = [
  { id: "position_gk", code: "GK", label: "Goalkeeper" },
  { id: "position_df", code: "DF", label: "Defender" },
  { id: "position_mf", code: "MF", label: "Midfielder" },
  { id: "position_fw", code: "FW", label: "Forward" },
];

const defaultTemplates: Template[] = [
  { id: "template_1", name: "Top Scorer", prompt: "Who is the top scorer for {team}?", active: true },
  { id: "template_2", name: "Nationality", prompt: "Which country does {athlete} represent?", active: true },
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

export async function createTeam(payload: Pick<Team, "canonicalName" | "countryCode">): Promise<Team> {
  const { data } = await http.post<Team>("/teams", payload);
  const teams = await getTeams();
  saveAndReturn(TEAMS_KEY, [...teams, data]);
  return data;
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

export async function createAthlete(payload: {
  canonicalFirstName: string;
  canonicalLastName: string;
  teamId: string;
  position: string;
  active: boolean;
}): Promise<Athlete> {
  const { data } = await http.post<Athlete>("/athletes", payload);
  const athletes = await getAthletes();
  saveAndReturn(ATHLETES_KEY, [...athletes, data]);
  return data;
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

export async function getPositions(): Promise<Position[]> {
  const fromStorage = readStorage<Position[]>(POSITIONS_KEY);
  if (fromStorage !== null) return fromStorage;
  return saveAndReturn(POSITIONS_KEY, defaultPositions);
}

export async function createPosition(payload: Pick<Position, "code" | "label">): Promise<Position> {
  const positions = await getPositions();
  const created: Position = { id: makeId("position"), code: payload.code, label: payload.label };
  saveAndReturn(POSITIONS_KEY, [...positions, created]);
  return created;
}

export async function updatePositions(payload: Position[]): Promise<Position[]> {
  return saveAndReturn(POSITIONS_KEY, payload);
}

export async function deletePosition(id: string): Promise<void> {
  const positions = await getPositions();
  saveAndReturn(
    POSITIONS_KEY,
    positions.filter((position) => position.id !== id)
  );
}

export async function getTemplates(): Promise<Template[]> {
  const fromStorage = readStorage<Template[]>(TEMPLATES_KEY);
  if (fromStorage !== null) return fromStorage;
  return saveAndReturn(TEMPLATES_KEY, defaultTemplates);
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
  return saveAndReturn(TEMPLATES_KEY, payload);
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await getTemplates();
  saveAndReturn(
    TEMPLATES_KEY,
    templates.filter((template) => template.id !== id)
  );
}
