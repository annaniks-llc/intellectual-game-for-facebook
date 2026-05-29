import type { AdminCountryRow, Athlete, ContentLocale, Position, Team, Template } from "../types";

export type LocaleApiRow = {
  id: number;
  code: string;
  name: string;
  is_enabled: boolean;
};

export type CountryApiRow = {
  id: number;
  code: string;
  default_name: string;
};

export type TeamApiRow = {
  id: number;
  name: string;
  short_name?: string | null;
  crest_url?: string | null;
  country_code?: string | null;
};

export type AthleteApiRow = {
  id: number;
  first_name: string;
  last_name: string;
  team_id: number;
  position_code: string;
  is_active: boolean;
};

export type PositionLabelApiRow = {
  id: number;
  position_code: string;
  label: string;
  locale_code: string;
};

export type QuestionTemplateApiRow = {
  id: number;
  name: string;
  prompt: string;
  is_active: boolean;
};

export function localeToApiBody(locale: ContentLocale) {
  return {
    code: locale.code.trim().toLowerCase(),
    name: (locale.name ?? locale.code).trim(),
    is_enabled: locale.enabled,
  };
}

export function mergeLocalesFromApi(rows: LocaleApiRow[], cached: ContentLocale[] | null): ContentLocale[] {
  const cachedByCode = new Map((cached ?? []).map((locale) => [locale.code.toLowerCase(), locale]));
  const merged = rows.map((row) => {
    const cachedLocale = cachedByCode.get(row.code.toLowerCase());
    return {
      code: row.code,
      name: row.name,
      enabled: row.is_enabled,
      isDefault: cachedLocale?.isDefault ?? false,
    };
  });

  if (merged.length > 0 && !merged.some((locale) => locale.isDefault)) {
    const fallback = merged.find((locale) => locale.enabled) ?? merged[0];
    return merged.map((locale) => ({ ...locale, isDefault: locale.code === fallback.code }));
  }

  return merged;
}

export function applyDefaultLocale(locales: ContentLocale[], defaultCode: string): ContentLocale[] {
  const normalized = defaultCode.trim().toLowerCase();
  return locales.map((locale) => ({
    ...locale,
    isDefault: locale.code.toLowerCase() === normalized,
  }));
}

export function mapCountryFromApi(row: CountryApiRow, cached?: AdminCountryRow): AdminCountryRow {
  if (cached) {
    return { ...cached, code: row.code };
  }

  return {
    code: row.code,
    enabledForGenerator: true,
    localizations: row.default_name ? [{ locale: "en", displayName: row.default_name }] : [],
  };
}

export function countryDefaultName(country: AdminCountryRow): string {
  const named = country.localizations.find((item) => item.displayName.trim());
  return named?.displayName.trim() || country.code;
}

export function mapTeamFromApi(row: TeamApiRow, cached?: Team): Team {
  return {
    id: String(row.id),
    canonicalName: row.name,
    crestUrl: row.crest_url ?? cached?.crestUrl,
    countryCode: row.country_code ?? cached?.countryCode ?? "",
    localizations: cached?.localizations ?? [],
  };
}

export function mapAthleteFromApi(row: AthleteApiRow, cached?: Athlete): Athlete {
  return {
    id: String(row.id),
    canonicalFirstName: row.first_name,
    canonicalLastName: row.last_name,
    teamId: String(row.team_id),
    position: row.position_code,
    active: row.is_active,
    localizations: cached?.localizations ?? [],
    photos: cached?.photos ?? [],
  };
}

export function mapPositionFromApi(row: PositionLabelApiRow): Position {
  return {
    id: String(row.id),
    code: row.position_code,
    label: row.label,
    localeCode: row.locale_code,
  };
}

export function sortPositions(positions: Position[]): Position[] {
  return [...positions].sort(
    (a, b) => a.code.localeCompare(b.code) || a.localeCode.localeCompare(b.localeCode)
  );
}

export function mapTemplateFromApi(row: QuestionTemplateApiRow): Template {
  return {
    id: String(row.id),
    name: row.name,
    prompt: row.prompt,
    active: row.is_active,
  };
}

export function templateToApiBody(template: Pick<Template, "id" | "name" | "prompt" | "active">) {
  const numericId = Number(template.id);
  return {
    ...(Number.isFinite(numericId) && numericId > 0 ? { id: numericId } : {}),
    name: template.name.trim(),
    prompt: template.prompt.trim(),
    is_active: template.active,
  };
}
