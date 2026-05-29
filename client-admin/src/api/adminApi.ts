import { http } from "./http";
import {
  applyDefaultLocale,
  countryDefaultName,
  localeToApiBody,
  mapAthleteFromApi,
  mapCountryFromApi,
  mapPositionFromApi,
  mapTeamFromApi,
  mapTemplateFromApi,
  mergeLocalesFromApi,
  sortPositions,
  templateToApiBody,
  type AthleteApiRow,
  type CountryApiRow,
  type LocaleApiRow,
  type PositionLabelApiRow,
  type QuestionTemplateApiRow,
  type TeamApiRow,
} from "./adminContentMappers";
import { readStorage, writeStorage } from "./storage";
import type { AdminCountryRow, Athlete, AthletePhoto, ContentLocale, Position, Team, Template } from "../types";

const LOCALES_KEY = "locales";
const COUNTRIES_KEY = "countries";
const TEAMS_KEY = "teams";
const ATHLETES_KEY = "athletes";
const POSITIONS_KEY = "positions";
const TEMPLATES_KEY = "templates";

async function fetchAndCache<T>(key: string, request: () => Promise<T>): Promise<T> {
  try {
    const data = await request();
    writeStorage(key, data);
    return data;
  } catch {
    const cached = readStorage<T>(key);
    if (cached !== null) return cached;
    throw new Error(`Failed to load ${key}`);
  }
}

function saveAndReturn<T>(key: string, data: T): T {
  writeStorage(key, data);
  return data;
}

function removeFromStorageCache<T>(key: string, shouldRemove: (item: T) => boolean): void {
  const stored = readStorage<T[]>(key);
  if (stored !== null) {
    writeStorage(
      key,
      stored.filter((item) => !shouldRemove(item))
    );
  }
}

async function fetchLocalesFromApi(): Promise<ContentLocale[]> {
  const { data } = await http.get<LocaleApiRow[]>("/locales");
  const cached = readStorage<ContentLocale[]>(LOCALES_KEY);
  return mergeLocalesFromApi(data, cached);
}

export async function getLocales(): Promise<ContentLocale[]> {
  return fetchAndCache(LOCALES_KEY, fetchLocalesFromApi);
}

export async function createLocale(payload: {
  code: string;
  enabled: boolean;
  isDefault?: boolean;
  name?: string;
}): Promise<ContentLocale> {
  const code = payload.code.trim().toLowerCase();
  const locale: ContentLocale = {
    code,
    name: payload.name?.trim() || code,
    enabled: payload.enabled,
    isDefault: payload.isDefault ?? false,
  };

  await http.post("/locales", localeToApiBody(locale));

  let locales = await fetchLocalesFromApi();
  if (locale.isDefault) {
    locales = applyDefaultLocale(locales, code);
  }
  saveAndReturn(LOCALES_KEY, locales);
  return locales.find((item) => item.code === code) ?? locale;
}

export async function updateLocales(payload: ContentLocale[]): Promise<ContentLocale[]> {
  for (const locale of payload) {
    await http.post("/locales", localeToApiBody(locale));
  }
  return saveAndReturn(LOCALES_KEY, payload);
}

export async function deleteLocale(code: string): Promise<void> {
  await http.delete(`/locales/${encodeURIComponent(code)}`);
  removeFromStorageCache<ContentLocale>(LOCALES_KEY, (locale) => locale.code.toLowerCase() === code.toLowerCase());
}

async function fetchCountriesFromApi(): Promise<AdminCountryRow[]> {
  const { data } = await http.get<CountryApiRow[]>("/countries/localizations");
  const cached = readStorage<AdminCountryRow[]>(COUNTRIES_KEY);
  const cachedByCode = new Map((cached ?? []).map((country) => [country.code.toUpperCase(), country]));
  return data.map((row) => mapCountryFromApi(row, cachedByCode.get(row.code.toUpperCase())));
}

export async function getCountries(): Promise<AdminCountryRow[]> {
  return fetchAndCache(COUNTRIES_KEY, fetchCountriesFromApi);
}

export async function updateCountries(payload: AdminCountryRow[]): Promise<AdminCountryRow[]> {
  for (const country of payload) {
    await http.post("/countries/localizations", {
      code: country.code,
      default_name: countryDefaultName(country),
    });
  }
  return saveAndReturn(COUNTRIES_KEY, payload);
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

  const countries = await fetchCountriesFromApi();
  const next = [...countries.filter((item) => item.code !== created.code), created].sort((a, b) =>
    a.code.localeCompare(b.code)
  );
  saveAndReturn(COUNTRIES_KEY, next);
  return created;
}

export async function deleteCountry(code: string): Promise<void> {
  await http.delete(`/countries/${encodeURIComponent(code)}`);
  removeFromStorageCache<AdminCountryRow>(COUNTRIES_KEY, (country) => country.code.toUpperCase() === code.toUpperCase());
}

async function fetchTeamsFromApi(): Promise<Team[]> {
  const { data } = await http.get<TeamApiRow[]>("/teams");
  const cached = readStorage<Team[]>(TEAMS_KEY);
  const cachedById = new Map((cached ?? []).map((team) => [team.id, team]));
  return data.map((row) => mapTeamFromApi(row, cachedById.get(String(row.id))));
}

export async function getTeams(): Promise<Team[]> {
  return fetchAndCache(TEAMS_KEY, fetchTeamsFromApi);
}

export async function getTeam(id: string): Promise<Team> {
  const teams = await getTeams();
  const cached = teams.find((team) => team.id === id);
  if (cached) return cached;
  const { data } = await http.get<TeamApiRow>(`/teams/${id}`);
  return mapTeamFromApi(data);
}

export async function updateTeam(id: string, payload: Team): Promise<Team> {
  const teams = await getTeams();
  const next = teams.map((team) => (team.id === id ? payload : team));
  saveAndReturn(TEAMS_KEY, next);
  return payload;
}

export type TeamCountryOption = {
  id: number;
  code: string;
  label: string;
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

  const teams = await fetchTeamsFromApi();
  saveAndReturn(TEAMS_KEY, teams);
  return teams.find((team) => team.id === created.id) ?? created;
}

export async function deleteTeam(id: string): Promise<void> {
  await http.delete(`/teams/${id}`);
  removeFromStorageCache<Team>(TEAMS_KEY, (team) => team.id === id);
}

async function fetchAthletesFromApi(): Promise<Athlete[]> {
  const { data } = await http.get<AthleteApiRow[]>("/athletes");
  const cached = readStorage<Athlete[]>(ATHLETES_KEY);
  const cachedById = new Map((cached ?? []).map((athlete) => [athlete.id, athlete]));
  return data.map((row) => mapAthleteFromApi(row, cachedById.get(String(row.id))));
}

export async function getAthletes(): Promise<Athlete[]> {
  return fetchAndCache(ATHLETES_KEY, fetchAthletesFromApi);
}

export async function getAthlete(id: string): Promise<Athlete> {
  const athletes = await getAthletes();
  const cached = athletes.find((athlete) => athlete.id === id);
  if (cached) return cached;
  const { data } = await http.get<AthleteApiRow>(`/athletes/${id}`);
  return mapAthleteFromApi(data);
}

export async function updateAthleteLocalizations(id: string, payload: Athlete["localizations"]) {
  const athletes = await getAthletes();
  const next = athletes.map((athlete) => (athlete.id === id ? { ...athlete, localizations: payload } : athlete));
  saveAndReturn(ATHLETES_KEY, next);
  return payload;
}

export type AthleteTeamOption = {
  id: number;
  label: string;
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

  const athletes = await fetchAthletesFromApi();
  saveAndReturn(ATHLETES_KEY, athletes);
  return athletes.find((athlete) => athlete.id === created.id) ?? created;
}

export async function deleteAthlete(id: string): Promise<void> {
  await http.delete(`/athletes/${id}`);
  removeFromStorageCache<Athlete>(ATHLETES_KEY, (athlete) => athlete.id === id);
}

async function fetchPositionsFromApi(): Promise<Position[]> {
  const { data } = await http.get<PositionLabelApiRow[]>("/position-labels");
  return sortPositions(data.map(mapPositionFromApi));
}

export async function getPositions(): Promise<Position[]> {
  return fetchAndCache(POSITIONS_KEY, fetchPositionsFromApi);
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

  const created: Position = {
    id: String(data.id),
    code: payload.code.trim().toUpperCase(),
    label: payload.label.trim(),
    localeCode: payload.localeCode.trim().toLowerCase(),
  };

  const positions = await fetchPositionsFromApi();
  saveAndReturn(POSITIONS_KEY, positions);
  return positions.find((item) => item.id === created.id) ?? created;
}

export async function updatePositions(payload: Position[]): Promise<Position[]> {
  for (const position of payload) {
    await http.post("/position-labels", {
      position_code: position.code,
      locale_code: position.localeCode,
      label: position.label,
    });
  }
  const positions = await fetchPositionsFromApi();
  return saveAndReturn(POSITIONS_KEY, positions);
}

export async function deletePosition(id: string): Promise<void> {
  await http.delete(`/position-labels/${id}`);
  removeFromStorageCache<Position>(POSITIONS_KEY, (position) => position.id === id);
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
  const athletes = await getAthletes();
  saveAndReturn(
    ATHLETES_KEY,
    athletes.map((athlete) => (athlete.id === id ? { ...athlete, photos: payload } : athlete))
  );
  return payload;
}

async function fetchTemplatesFromApi(): Promise<Template[]> {
  const { data } = await http.get<QuestionTemplateApiRow[]>("/templates");
  return data.map(mapTemplateFromApi);
}

export async function getTemplates(): Promise<Template[]> {
  return fetchAndCache(TEMPLATES_KEY, fetchTemplatesFromApi);
}

export async function createTemplate(payload: Pick<Template, "name" | "prompt" | "active">): Promise<Template> {
  const { data } = await http.post<{ ok: true; id: number }>("/templates", templateToApiBody({
    id: "",
    name: payload.name,
    prompt: payload.prompt,
    active: payload.active,
  }));

  const templates = await fetchTemplatesFromApi();
  saveAndReturn(TEMPLATES_KEY, templates);
  return templates.find((template) => template.id === String(data.id)) ?? {
    id: String(data.id),
    name: payload.name.trim(),
    prompt: payload.prompt.trim(),
    active: payload.active,
  };
}

export async function updateTemplates(payload: Template[]): Promise<Template[]> {
  for (const template of payload) {
    await http.post("/templates", templateToApiBody(template));
  }
  const templates = await fetchTemplatesFromApi();
  return saveAndReturn(TEMPLATES_KEY, templates);
}

export async function deleteTemplate(id: string): Promise<void> {
  await http.delete(`/templates/${id}`);
  removeFromStorageCache<Template>(TEMPLATES_KEY, (template) => template.id === id);
}
